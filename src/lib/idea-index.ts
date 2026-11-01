import { createHash } from 'crypto';
import { QdrantClient } from '@qdrant/js-client-rest';
import {
  embedIdeaText,
  IDEA_VECTOR_SIZE,
  ideaIndexText,
} from '@/lib/idea-embeddings';
import { IdeaCatalogEntry } from '@/lib/idea-catalog';

const COLLECTION = 'ideas';

export interface SimilarIdea {
  ideaId: string;
  title: string;
}

let collectionReady: Promise<void> | null = null;

function qdrantUrl(): string {
  return process.env.QDRANT_URL || 'http://localhost:6333';
}

function client(): QdrantClient {
  return new QdrantClient({
    url: qdrantUrl(),
    apiKey: process.env.QDRANT_API_KEY || undefined,
  });
}

/**
 * Qdrant point ids must be UUIDs. Older sheet ids are hashed into a stable UUID.
 */
export function ideaPointId(ideaId: string): string {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(ideaId)) {
    return ideaId;
  }
  const hash = createHash('sha256').update(ideaId).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

async function ensureCollection(): Promise<void> {
  if (!collectionReady) {
    collectionReady = (async () => {
      const qdrant = client();
      try {
        await qdrant.getCollection(COLLECTION);
      } catch {
        await qdrant.createCollection(COLLECTION, {
          vectors: { size: IDEA_VECTOR_SIZE, distance: 'Cosine' },
        });
      }

      try {
        await qdrant.createPayloadIndex(COLLECTION, {
          field_name: 'ideaId',
          field_schema: 'keyword',
        });
      } catch {
        // Index might already exist
      }
    })().catch((error) => {
      collectionReady = null;
      throw error;
    });
  }
  await collectionReady;
}

export async function upsertIdeaVector(entry: IdeaCatalogEntry): Promise<void> {
  if (!entry.ideaId) return;
  await ensureCollection();
  if (!entry.title.trim()) {
    await deleteIdeaVector(entry.ideaId);
    return;
  }

  const vector = await embedIdeaText(ideaIndexText(entry.title, entry.notes));
  await client().upsert(COLLECTION, {
    wait: true,
    points: [
      {
        id: ideaPointId(entry.ideaId),
        vector,
        payload: { ideaId: entry.ideaId, title: entry.title },
      },
    ],
  });
}

/**
 * Removes every stored vector for an idea, including one saved under an older point id.
 */
export async function deleteIdeaVector(ideaId: string): Promise<void> {
  if (!ideaId) return;
  await ensureCollection();
  const qdrant = client();
  await qdrant.delete(COLLECTION, {
    wait: true,
    filter: {
      must: [{ key: 'ideaId', match: { value: ideaId } }],
    },
  });
}

/**
 * Drops the previous vector and writes the current title and notes.
 */
export async function replaceIdeaVector(entry: IdeaCatalogEntry): Promise<void> {
  await deleteIdeaVector(entry.ideaId);
  await upsertIdeaVector(entry);
}

async function indexedIdeaIds(): Promise<Set<string>> {
  const ids = new Set<string>();
  let offset: string | number | Record<string, unknown> | null | undefined = undefined;
  const qdrant = client();

  for (;;) {
    const page = await qdrant.scroll(COLLECTION, {
      limit: 256,
      offset,
      with_payload: true,
      with_vector: false,
    });
    for (const point of page.points) {
      const ideaId = String(point.payload?.ideaId || '');
      if (ideaId) ids.add(ideaId);
    }
    if (page.next_page_offset == null) break;
    offset = page.next_page_offset;
  }

  return ids;
}

/**
 * Embeds sheet ideas that are missing from Qdrant so older rows are searchable.
 */
export async function backfillIdeaIndex(entries: IdeaCatalogEntry[]): Promise<void> {
  await ensureCollection();
  const indexed = await indexedIdeaIds();
  for (const entry of entries) {
    if (indexed.has(entry.ideaId)) continue;
    await upsertIdeaVector(entry);
  }
}

export async function searchSimilarIdeas(text: string, limit = 3): Promise<SimilarIdea[]> {
  await ensureCollection();
  const vector = await embedIdeaText(text.trim());
  const result = await client().query(COLLECTION, {
    query: vector,
    limit,
    with_payload: true,
  });

  return result.points
    .map((hit) => ({
      ideaId: String(hit.payload?.ideaId || ''),
      title: String(hit.payload?.title || ''),
    }))
    .filter((hit) => hit.ideaId && hit.title);
}
