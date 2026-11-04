import { createClient } from '@/lib/supabase/server';
import { replaceIdeaVector } from '@/lib/idea-index';
import { appendResearchMessage, clearResearchMessages, listResearchMessages, ResearchMessage } from '@/lib/research-messages';
import { clearResearchChunks, indexResearchSource, searchResearch } from '@/lib/research-index';
import { guardedSystemPrompt, isOutOfScope, OUT_OF_SCOPE, OutOfScopeError } from '@/lib/llm-guard';

const NO_CONTEXT = 'I have no context. Please add context.';
const OUTSIDE_CONTEXT = 'I can only answer from the context you added. That question is outside it.';
const MIN_MATCH = 0.42;

function readableAnswer(text: string): string {
  return text
    .replace(/\[\d+[^\]]*\]/g, '')
    .replace(/【[^】]*】/g, '')
    .replace(/\*\*|__|[*_`#>]+/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function saveBrief(ideaId: string, title: string, brief: string) {
  const supabase = await createClient();
  const notes = brief.slice(0, 4000);
  await supabase
    .from('ideas')
    .update({ base_article: notes, updated_at: new Date().toISOString() })
    .eq('id', ideaId);

  try {
    await replaceIdeaVector({ ideaId, title, notes });
  } catch (error) {
    console.warn('Research brief saved, but the idea vector was not updated:', error);
  }
}

async function askGroq(question: string, chunks: { sourceName: string; text: string }[]) {
  const key = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL?.trim();
  if (!key) throw new Error('GROQ_API_KEY is not set');
  if (!model) throw new Error('GROQ_MODEL is not set');

  const context = chunks.map((chunk, index) => `[${index + 1}] ${chunk.sourceName}\n${chunk.text}`).join('\n\n');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: guardedSystemPrompt(
            'You are the research assistant for one content idea. Answer the question using ONLY the provided context excerpts (notes and documents the user added). Summaries, overviews, comparisons and explanations of that content are fine. Do not add facts from your own knowledge, and do not answer questions the excerpts do not cover, even if you know the answer. Write plain, clear sentences without markdown formatting, bullets, asterisks, or citation markers.',
            OUTSIDE_CONTEXT
          ),
        },
        {
          role: 'user',
          content: `Context:\n${context}\n\nQuestion: ${question}`,
        },
      ],
    }),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body?.error?.message || 'Groq request failed');
  }
  const answer = body?.choices?.[0]?.message?.content;
  if (!answer || typeof answer !== 'string') throw new Error('Groq returned an empty reply');
  if (isOutOfScope(answer)) return OUTSIDE_CONTEXT;
  const readable = readableAnswer(answer);
  if (!readable) throw new Error('Groq returned an empty reply');
  return readable;
}

export async function saveResearchSource(
  ideaId: string,
  sourceName: string,
  text: string,
  title = '',
  identity?: { sourceKey: string; matchName?: boolean; maxChunks?: number }
) {
  const indexed = await indexResearchSource(ideaId, sourceName, text, identity);
  if (indexed.count === 0) throw new Error('That source did not contain readable text');
  const preview = text.replace(/\s+/g, ' ').trim().slice(0, 700);
  await appendResearchMessage(
    ideaId,
    'source',
    `${sourceName}\n${preview}${text.length > 700 ? '…' : ''}`
  );
  const note = indexed.truncated
    ? `Saved the first part of ${sourceName} in ${indexed.count} sections. The rest was too long to store.`
    : `Saved ${sourceName} in ${indexed.count} sections. Ask a question when you want to dig in.`;
  await appendResearchMessage(ideaId, 'assistant', note);
  await saveBrief(ideaId, title, note);
  return listResearchMessages(ideaId);
}

async function saveArticle(ideaId: string, article: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('ideas')
    .update({ medium_article: article, updated_at: new Date().toISOString() })
    .eq('id', ideaId);

  if (error) throw new Error('Idea not found: ' + error.message);
  return article;
}

function conversationTranscript(messages: ResearchMessage[]) {
  return messages
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => `${message.role === 'assistant' ? 'Assistant' : 'You'}: ${message.content.slice(0, 2000)}`)
    .join('\n\n')
    .slice(-14000);
}

export async function clearResearch(ideaId: string) {
  await clearResearchMessages(ideaId);
  await clearResearchChunks(ideaId);
}

export async function generateArticleFromResearch(ideaId: string) {
  const messages = await listResearchMessages(ideaId);
  const transcript = conversationTranscript(messages);
  if (!transcript.trim()) {
    throw new Error('Ask a few questions first so there is a conversation to write from');
  }

  const key = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL?.trim();
  if (!key) throw new Error('GROQ_API_KEY is not set');
  if (!model) throw new Error('GROQ_MODEL is not set');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content: guardedSystemPrompt(
            `Write an article from this research conversation. Use only the facts the person and the assistant stated in it; do not add facts from your own knowledge. Skip any exchange where the assistant declined to answer. If the conversation contains no usable research material for an article, reply with exactly: ${OUT_OF_SCOPE}. Write plain paragraphs a reader can follow, in normal sentences. Do not use markdown, asterisks, headings, bullets, or citation markers.`
          ),
        },
        { role: 'user', content: transcript },
      ],
    }),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body?.error?.message || 'Groq request failed');
  }
  const raw = String(body?.choices?.[0]?.message?.content || '');
  if (isOutOfScope(raw)) {
    throw new OutOfScopeError('The research conversation has no material to write an article from. Add context and ask questions about it first.');
  }
  const article = readableAnswer(raw);
  if (!article) throw new Error('Groq returned an empty article');
  return saveArticle(ideaId, article);
}

export async function askResearch(ideaId: string, question: string, title = '') {
  const trimmed = question.trim();
  await appendResearchMessage(ideaId, 'user', trimmed);
  const found = await searchResearch(ideaId, trimmed, 6);

  if (found.length === 0) {
    const answer = NO_CONTEXT;
    await appendResearchMessage(ideaId, 'assistant', answer);
    await saveBrief(ideaId, title, answer);
    return listResearchMessages(ideaId);
  }

  // Prioritize chunks with strong similarity, or fall back to top retrieved chunks
  // for broad/summary questions (which naturally score low in embedding cosine distance)
  const strongMatches = found.filter((chunk) => chunk.score >= 0.35);
  const chunksToUse = strongMatches.length > 0 ? strongMatches : found.slice(0, 5);

  const answer = await askGroq(trimmed, chunksToUse);
  await appendResearchMessage(ideaId, 'assistant', answer);
  await saveBrief(ideaId, title, answer);
  return listResearchMessages(ideaId);
}
