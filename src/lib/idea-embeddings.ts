import path from 'path';

const MODEL = 'Xenova/all-MiniLM-L6-v2';
export const IDEA_VECTOR_SIZE = 384;

type FeatureExtractor = (
  text: string,
  options: { pooling: 'mean'; normalize: boolean }
) => Promise<{ data: Float32Array }>;

let extractorPromise: Promise<FeatureExtractor> | null = null;

async function getExtractor(): Promise<FeatureExtractor> {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      const { pipeline, env } = await import('@xenova/transformers');
      env.allowLocalModels = false;
      env.useBrowserCache = false;
      env.cacheDir = path.join(process.cwd(), '.cache/transformers');
      return (await pipeline('feature-extraction', MODEL)) as FeatureExtractor;
    })().catch((error) => {
      extractorPromise = null;
      throw error;
    });
  }
  return extractorPromise;
}

/**
 * Embeds a short idea title and optional notes into a normalized 384-d vector.
 */
export async function embedIdeaText(text: string): Promise<number[]> {
  const extractor = await getExtractor();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

export function ideaIndexText(title: string, notes?: string): string {
  const heading = title.trim();
  const detail = (notes || '').trim().slice(0, 400);
  return detail ? `${heading}\n${detail}` : heading;
}
