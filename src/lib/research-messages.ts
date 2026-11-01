import { getGoogleSheet } from '@/lib/google-sheets';

export interface ResearchMessage {
  id: string;
  ideaId: string;
  role: 'user' | 'assistant' | 'source';
  content: string;
  createdAt: string;
}

const HEADERS = ['id', 'ideaId', 'role', 'content', 'createdAt'];
let ready = false;

async function sheet() {
  const doc = await getGoogleSheet();
  let tab = doc.sheetsByTitle['ResearchMessages'];
  if (!tab) {
    tab = await doc.addSheet({ title: 'ResearchMessages', headerValues: HEADERS });
    ready = true;
  } else if (!ready) {
    try {
      await tab.loadHeaderRow();
      const current = [...tab.headerValues];
      const missing = HEADERS.filter((header) => !current.includes(header));
      if (missing.length > 0) await tab.setHeaderRow([...current, ...missing]);
    } catch {
      await tab.setHeaderRow(HEADERS);
    }
    ready = true;
  }
  return tab;
}

function toMessage(row: { get: (key: string) => unknown }): ResearchMessage {
  const role = String(row.get('role') || 'user');
  return {
    id: String(row.get('id') || ''),
    ideaId: String(row.get('ideaId') || ''),
    role: role === 'assistant' || role === 'source' ? role : 'user',
    content: String(row.get('content') || ''),
    createdAt: String(row.get('createdAt') || ''),
  };
}

export async function listResearchMessages(ideaId: string): Promise<ResearchMessage[]> {
  const tab = await sheet();
  const rows = await tab.getRows();
  return rows
    .map(toMessage)
    .filter((message) => message.ideaId === ideaId && message.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function appendResearchMessage(
  ideaId: string,
  role: ResearchMessage['role'],
  content: string
): Promise<ResearchMessage> {
  const tab = await sheet();
  const message: ResearchMessage = {
    id: crypto.randomUUID(),
    ideaId,
    role,
    content: content.slice(0, 45000),
    createdAt: new Date().toISOString(),
  };
  await tab.addRow({
    id: message.id,
    ideaId: message.ideaId,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
  });
  return message;
}
