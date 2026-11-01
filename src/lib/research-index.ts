import { createHash } from 'crypto';
import { QdrantClient } from '@qdrant/js-client-rest';
import { embedIdeaText, IDEA_VECTOR_SIZE } from '@/lib/idea-embeddings';
import { clearResearchMessages } from '@/lib/research-messages';

const COLLECTION = 'research';
let ready: Promise<void> | null = null;

function client() {
  return new QdrantClient({
    url: process.env.QDRANT_URL || 'http://localhost:6333',
    apiKey: process.env.QDRANT_API_KEY || undefined,
  });
}

async function ensureCollection() {
  if (!ready) {
    ready = (async () => {
      const qdrant = client();
      try {
        await qdrant.getCollection(COLLECTION);
      } catch {
        await qdrant.createCollection(COLLECTION, {
          vectors: { size: IDEA_VECTOR_SIZE, distance: 'Cosine' },
        });
      }

      // Ensure payload indexes exist for filtered queries
      const indexFields = ['ideaId', 'sourceKey', 'sourceName'];
      for (const field of indexFields) {
        try {
          await qdrant.createPayloadIndex(COLLECTION, {
            field_name: field,
            field_schema: 'keyword',
          });
        } catch {
          // Index might already exist
        }
      }
    })().catch((error) => {
      ready = null;
      throw error;
    });
  }
  await ready;
}

export function chunkResearchText(text: string, maxChunks = 40): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  const size = 900;
  const overlap = 120;
  const chunks: string[] = [];
  for (let index = 0; index < clean.length && chunks.length < maxChunks; index += size - overlap) {
    chunks.push(clean.slice(index, index + size));
  }
  return chunks;
}

export function sourceKeyForBytes(bytes: Uint8Array) {
  return createHash('sha256').update(bytes).digest('hex');
}

export function sourceKeyForText(text: string) {
  return createHash('sha256').update(text.replace(/\s+/g, ' ').trim()).digest('hex');
}

export class AlreadyAddedError extends Error {
  constructor(kind: 'file' | 'text') {
    super(kind === 'file' ? 'This file is already added' : 'This text is already added');
    this.name = 'AlreadyAddedError';
  }
}

async function sourceExists(ideaId: string, key: string, value: string) {
  const found = await client().scroll(COLLECTION, {
    filter: {
      must: [
        { key: 'ideaId', match: { value: ideaId } },
        { key, match: { value } },
      ],
    },
    limit: 1,
    with_payload: false,
  });
  return found.points.length > 0;
}

export async function indexResearchSource(
  ideaId: string,
  sourceName: string,
  text: string,
  options?: { sourceKey?: string; matchName?: boolean; maxChunks?: number }
) {
  const maxChunks = options?.maxChunks ?? 40;
  const chunks = chunkResearchText(text, maxChunks);
  if (chunks.length === 0) return { count: 0, truncated: false };
  await ensureCollection();
  if (options?.sourceKey && await sourceExists(ideaId, 'sourceKey', options.sourceKey)) {
    throw new AlreadyAddedError(options.matchName ? 'file' : 'text');
  }
  if (options?.matchName && await sourceExists(ideaId, 'sourceName', sourceName)) {
    throw new AlreadyAddedError('file');
  }
  const points = [];
  for (const chunk of chunks) {
    points.push({
      id: crypto.randomUUID(),
      vector: await embedIdeaText(chunk),
      payload: {
        ideaId,
        sourceName,
        text: chunk,
        ...(options?.sourceKey ? { sourceKey: options.sourceKey } : {}),
      },
    });
  }
  await client().upsert(COLLECTION, { wait: true, points });
  const cleanLength = text.replace(/\s+/g, ' ').trim().length;
  const covered = chunks.length * (900 - 120) + 120;
  return { count: chunks.length, truncated: cleanLength > covered };
}

export async function searchResearch(ideaId: string, query: string, limit = 5) {
  await ensureCollection();
  const vector = await embedIdeaText(query);
  const result = await client().query(COLLECTION, {
    query: vector,
    filter: { must: [{ key: 'ideaId', match: { value: ideaId } }] },
    limit,
    with_payload: true,
  });
  return result.points
    .map((point) => ({
      sourceName: String(point.payload?.sourceName || 'note'),
      text: String(point.payload?.text || ''),
      score: typeof point.score === 'number' ? point.score : 0,
    }))
    .filter((chunk) => chunk.text);
}

export async function clearResearchChunks(ideaId: string) {
  await ensureCollection();
  await client().delete(COLLECTION, {
    wait: true,
    filter: { must: [{ key: 'ideaId', match: { value: ideaId } }] },
  });
}

export async function deleteResearchForIdea(ideaId: string) {
  try {
    await clearResearchChunks(ideaId);
  } catch (error) {
    console.warn('Research vectors were not removed:', error);
  }

  try {
    await clearResearchMessages(ideaId);
  } catch (error) {
    console.warn('Research messages were not removed:', error);
  }
}
