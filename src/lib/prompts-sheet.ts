import { getGoogleSheet } from '@/lib/google-sheets';
import { PromptItem } from '@/types';

export const HEADERS = ['id', 'title', 'content', 'category', 'createdAt', 'updatedAt'];

let isPromptsSheetInitialized = false;

export async function getPromptsSheet() {
  const doc = await getGoogleSheet();
  let sheet = doc.sheetsByTitle['Prompts'];

  if (!sheet) {
    sheet = await doc.addSheet({ title: 'Prompts', headerValues: HEADERS });
    isPromptsSheetInitialized = true;
  } else if (!isPromptsSheetInitialized) {
    try {
      await sheet.loadHeaderRow();
      const currentHeaders = [...sheet.headerValues];
      const missingHeaders = HEADERS.filter((h) => !currentHeaders.includes(h));
      if (missingHeaders.length > 0) {
        await sheet.setHeaderRow([...currentHeaders, ...missingHeaders]);
      }
    } catch {
      await sheet.setHeaderRow(HEADERS);
    }
    isPromptsSheetInitialized = true;
  }

  return sheet;
}

export function parseRowToPrompt(row: any): PromptItem {
  return {
    id: row.get('id') || '',
    title: row.get('title') || '',
    content: row.get('content') || '',
    category: row.get('category') || 'General',
    createdAt: row.get('createdAt') || '',
    updatedAt: row.get('updatedAt') || '',
  };
}
