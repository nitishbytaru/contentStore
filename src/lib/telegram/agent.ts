import { SupabaseClient } from '@supabase/supabase-js';
import { executeTool, toolDefinitions } from '@/lib/telegram/tools';

const MAX_ROUNDS = 4;

type ChatMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: { id: string; type: 'function'; function: { name: string; arguments: string } }[];
  tool_call_id?: string;
};

function systemPrompt() {
  const today = new Date().toISOString().slice(0, 10);
  return [
    'You are ContentStore, a Telegram assistant for a content creator. Today is ' + today + '.',
    "Answer questions about the user's content ideas using the tools. Never guess numbers or titles: call a tool.",
    "'Pending' means not completed yet; 'completed' means posted.",
    'Reply in short plain text suitable for a chat app. No markdown tables, no bold/italics markers. Simple numbered or dash lists are fine.',
    'Do not show idea ids unless the user asks for them.',
    'You can only read ideas; you cannot create, edit or delete them. If asked, say so and suggest using the website.',
  ].join('\n');
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
