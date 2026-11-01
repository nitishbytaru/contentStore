import { createClient } from '@/lib/supabase/server';

export interface IdeaCatalogEntry {
  ideaId: string;
  title: string;
  notes: string;
}

/**
 * Reads idea ids, titles, and research notes from the ideas table in Supabase.
 */
export async function listIdeaCatalog(): Promise<IdeaCatalogEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('ideas')
    .select('id, idea, base_article');

  if (error || !data) return [];

  return data
    .map((row) => ({
      ideaId: row.id,
      title: (row.idea || '').trim(),
      notes: row.base_article || '',
    }))
    .filter((entry) => entry.ideaId && entry.title);
}
