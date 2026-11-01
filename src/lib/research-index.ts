import { QdrantClient } from '@qdrant/js-client-rest';
import { embedIdeaText, IDEA_VECTOR_SIZE } from '@/lib/idea-embeddings';

const COLLECTION = 'research';
let ready: Promise<void> | null = null;

function client() {
  return new QdrantClient({ url: process.env.QDRANT_URL || 'http://localhost:6333' });
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
    })().catch((error) => {
      ready = null;
      throw error;
    });
  }
  await ready;
}

export function chunkResearchText(text: string): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  const size = 900;
  const overlap = 120;
  const chunks: string[] = [];
  for (let index = 0; index < clean.length && chunks.length < 40; index += size - overlap) {
    chunks.push(clean.slice(index, index + size));
  }
  return chunks;
}

export async function indexResearchSource(ideaId: string, sourceName: string, text: string) {
  const chunks = chunkResearchText(text);
  if (chunks.length === 0) return 0;
  await ensureCollection();
  const points = [];
  for (const chunk of chunks) {
    points.push({
      id: crypto.randomUUID(),
      vector: await embedIdeaText(chunk),
      payload: { ideaId, sourceName, text: chunk },
    });
  }
  await client().upsert(COLLECTION, { wait: true, points });
  return chunks.length;
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
}
