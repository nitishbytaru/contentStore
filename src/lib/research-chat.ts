import { getGoogleSheet } from '@/lib/google-sheets';
import { replaceIdeaVector } from '@/lib/idea-index';
import { appendResearchMessage, listResearchMessages, ResearchMessage } from '@/lib/research-messages';
import { indexResearchSource, searchResearch } from '@/lib/research-index';

const SOURCE_MIN = 500;

async function saveBrief(ideaId: string, title: string, brief: string) {
  const doc = await getGoogleSheet();
  const sheet = doc.sheetsByIndex[0];
  const rows = await sheet.getRows();
  const row = rows.find((item) => (item.get('ideaId') || item.get('id')) === ideaId);
  if (!row) return;
  const notes = brief.slice(0, 4000);
  row.set('baseArticle', notes);
  await row.save();
  try {
    await replaceIdeaVector({ ideaId, title: title || String(row.get('idea') || ''), notes });
  } catch (error) {
    console.warn('Research brief saved, but the idea vector was not updated:', error);
  }
}

async function askGroq(question: string, chunks: { sourceName: string; text: string }[], history: ResearchMessage[]) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY is not set');

  const context = chunks.length
    ? chunks.map((chunk, index) => `[${index + 1}] ${chunk.sourceName}\n${chunk.text}`).join('\n\n')
    : 'No source material has been saved for this idea yet.';

  const recent = history.slice(-8).map((message) => ({
    role: message.role === 'assistant' ? 'assistant' as const : 'user' as const,
    content: message.content.slice(0, 1500),
  }));

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content:
            'You are the research assistant for one content idea. Answer only from the supplied source chunks. If the chunks do not contain the answer, say what is missing. Keep the reply useful for a later article: claims, numbers, and quotes, each tied to the source name.',
        },
        {
          role: 'user',
          content: `Sources:\n${context}`,
        },
        ...recent,
        { role: 'user', content: question },
      ],
    }),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body?.error?.message || 'Groq request failed');
  }
  const answer = body?.choices?.[0]?.message?.content;
  if (!answer || typeof answer !== 'string') throw new Error('Groq returned an empty reply');
  return answer.trim();
}

export async function saveResearchSource(ideaId: string, sourceName: string, text: string, title = '') {
  const count = await indexResearchSource(ideaId, sourceName, text);
  if (count === 0) throw new Error('That source did not contain readable text');
  const preview = text.replace(/\s+/g, ' ').trim().slice(0, 700);
  await appendResearchMessage(
    ideaId,
    'source',
    `${sourceName}\n${preview}${text.length > 700 ? '…' : ''}`
  );
  const note = `Saved ${sourceName} in ${count} sections. Ask a question when you want to dig in.`;
  await appendResearchMessage(ideaId, 'assistant', note);
  await saveBrief(ideaId, title, note);
  return listResearchMessages(ideaId);
}

export async function askResearch(ideaId: string, question: string, title = '') {
  const trimmed = question.trim();
  if (trimmed.length >= SOURCE_MIN) {
    await indexResearchSource(ideaId, 'Pasted note', trimmed);
    await appendResearchMessage(ideaId, 'source', `Pasted note\n${trimmed.slice(0, 700)}${trimmed.length > 700 ? '…' : ''}`);
  }
  await appendResearchMessage(ideaId, 'user', trimmed);
  const history = await listResearchMessages(ideaId);
  const chunks = await searchResearch(ideaId, trimmed);
  const answer = await askGroq(trimmed, chunks, history);
  await appendResearchMessage(ideaId, 'assistant', answer);
  await saveBrief(ideaId, title, answer);
  return listResearchMessages(ideaId);
}
