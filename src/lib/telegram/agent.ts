import { SupabaseClient } from '@supabase/supabase-js';
import { executeTool, siteUrl, toolDefinitions } from '@/lib/telegram/tools';
import { guardedSystemPrompt, isOutOfScope, OUT_OF_SCOPE_MESSAGE } from '@/lib/llm-guard';

const MAX_ROUNDS = 5;

type ChatMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: { id: string; type: 'function'; function: { name: string; arguments: string } }[];
  tool_call_id?: string;
};

function systemPrompt() {
  const today = new Date().toISOString().slice(0, 10);
  const site = siteUrl();
  const task = [
    `You are ContentStore, a Telegram assistant for a content creator. Today is ${today}.`,
    "Your task: answer questions about the user's own ContentStore data (ideas and saved prompts) using the tools, create new ideas when asked, and explain what you can do. Greetings, thanks and 'what can you do' are fine to answer briefly.",
    'The person chatting is the verified owner of this account, so share any of their data they ask for: titles, status, stage, formats, platforms, dates, descriptions, research notes, article drafts, video scripts, links, ids and saved prompts.',
    'Always use the tools to get data. Never guess numbers, titles or content.',
    "'Pending' means not completed yet; 'completed' means posted. Stages: Pending (no format chosen), Article, Video, Article & Video, Completed.",
    '',
    'Creating ideas: you CAN create new ideas with create_idea when the user asks, including choosing the starting stage (pending, article, video, or article and video) and whether it is already completed. If the user did not say which stage, use the default (article and video). After creating, confirm the title, stage and give the link.',
    '',
    'Editing or deleting: you CANNOT update, rename, change the stage/status of, or delete an EXISTING idea. If the user asks for that, politely decline, find the idea with search_ideas (or list_ideas), and give them the direct link to that idea on the website so they can do it there. If you cannot identify the idea, give them ' +
      `${site}/ideas instead.`,
    '',
    'Questions that use the content of their ideas are in scope (e.g. "summarize the research for my RAG idea"). Questions that merely mention a topic but are not about their ContentStore data are out of scope (e.g. "who is the president", "what is RAG", "write me a poem").',
    '',
    'Reply in plain text suitable for a chat app. No markdown tables, no bold/italics markers. Simple numbered or dash lists are fine. Include links as plain URLs.',
  ].join('\n');
  return guardedSystemPrompt(task);
}

async function groqChat(messages: ChatMessage[], withTools: boolean) {
  const key = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL?.trim();
  if (!key) throw new Error('GROQ_API_KEY is not set');
  if (!model) throw new Error('GROQ_MODEL is not set');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages,
      ...(withTools ? { tools: toolDefinitions, tool_choice: 'auto' } : {}),
    }),
  });

  const body = await response.json();
  if (!response.ok) throw new Error(body?.error?.message || 'Groq request failed');
  const message = body?.choices?.[0]?.message;
  if (!message) throw new Error('Groq returned no message');
  return message as ChatMessage;
}

function cleanReply(text: string): string {
  if (isOutOfScope(text)) return OUT_OF_SCOPE_MESSAGE;
  return text.replace(/\*\*|__/g, '').replace(/\n{3,}/g, '\n\n').trim();
}

/** Runs the tool-calling loop for one incoming message and returns the reply text. */
export async function runAgent(supabase: SupabaseClient, userId: string, userText: string): Promise<string> {
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt() },
    { role: 'user', content: userText.slice(0, 2000) },
  ];

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const reply = await groqChat(messages, true);
    const calls = reply.tool_calls || [];

    if (!calls.length) {
      return cleanReply(reply.content || '') || "Sorry, I couldn't come up with an answer.";
    }

    messages.push({ role: 'assistant', content: reply.content || null, tool_calls: calls });

    for (const call of calls) {
      let result: unknown;
      try {
        const args = call.function.arguments ? JSON.parse(call.function.arguments) : {};
        result = await executeTool(supabase, userId, call.function.name, args);
      } catch (error) {
        console.error(`Telegram tool ${call.function.name} failed:`, error);
        result = { error: 'tool failed' };
      }
      messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) });
    }
  }

  // Out of tool rounds: ask for a final answer without tools.
  const final = await groqChat(messages, false);
  return cleanReply(final.content || '') || "Sorry, I couldn't come up with an answer.";
}
