import { getGoogleSheet } from '@/lib/google-sheets';

export interface IdeaCatalogEntry {
  ideaId: string;
  title: string;
  notes: string;
}

/**
 * Reads idea ids, titles, and research notes from the ideas sheet.
 */
export async function listIdeaCatalog(): Promise<IdeaCatalogEntry[]> {
  const doc = await getGoogleSheet();
  const sheet = doc.sheetsByIndex[0];
  const rows = await sheet.getRows();

  return rows
    .map((row) => ({
      ideaId: String(row.get('ideaId') || row.get('id') || ''),
      title: String(row.get('idea') || '').trim(),
      notes: String(row.get('baseArticle') || ''),
    }))
    .filter((entry) => entry.ideaId && entry.title);
}
