import { timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { runAgent } from '@/lib/telegram/agent';
import { sendChatAction, sendMessage } from '@/lib/telegram/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const HELP_TEXT = [
  'Hi! I am ContentStore. Ask me about your content ideas, for example:',
  '- How many ideas are still pending?',
  '- List my pending video ideas',
  '- Do I have an idea about AI agents?',
  '',
  'Commands:',
  '/help - show this message',
  '/unlink - disconnect this chat from your ContentStore account',
].join('\n');

const NOT_LINKED_TEXT =
  'This chat is not connected to a ContentStore account yet. Open the ContentStore website, click "Connect Telegram", and tap Start here.';

// Best-effort dedupe of Telegram retries within a warm serverless instance.
const seenUpdates = new Set<number>();

function rememberUpdate(updateId: number): boolean {
  if (seenUpdates.has(updateId)) return false;
  seenUpdates.add(updateId);
  if (seenUpdates.size > 500) {
    const oldest = seenUpdates.values().next().value;
    if (oldest !== undefined) seenUpdates.delete(oldest);
  }
  return true;
}

function validSecret(header: string | null): boolean {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected || !header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

const ok = () => NextResponse.json({ ok: true }, { status: 200 });

async function handleStart(chatId: number, code: string) {
  const supabase = createAdminClient();

  if (!code) {
    const { data } = await supabase.from('telegram_links').select('user_id').eq('chat_id', chatId).maybeSingle();
    await sendMessage(chatId, data ? HELP_TEXT : NOT_LINKED_TEXT);
    return;
  }

  const { data: link } = await supabase
    .from('telegram_links')
    .select('user_id, code_expires_at')
    .eq('link_code', code)
    .maybeSingle();

  if (!link || !link.code_expires_at || new Date(link.code_expires_at).getTime() < Date.now()) {
    await sendMessage(chatId, 'That link has expired or is invalid. Click "Connect Telegram" on the website again.');
    return;
  }

  // A chat can belong to only one account: detach it from any previous one.
  await supabase.from('telegram_links').delete().eq('chat_id', chatId).neq('user_id', link.user_id);

  const { error } = await supabase
    .from('telegram_links')
    .update({ chat_id: chatId, linked_at: new Date().toISOString(), link_code: null, code_expires_at: null })
    .eq('user_id', link.user_id);

  if (error) throw error;
  await sendMessage(chatId, `Connected! Your ContentStore account is now linked.\n\n${HELP_TEXT}`);
}

async function handleUnlink(chatId: number) {
  const supabase = createAdminClient();
  const { data } = await supabase.from('telegram_links').delete().eq('chat_id', chatId).select('user_id');
  await sendMessage(
    chatId,
    data?.length ? 'Disconnected. This chat is no longer linked to your ContentStore account.' : NOT_LINKED_TEXT
  );
}

async function handleQuestion(chatId: number, text: string) {
  const supabase = createAdminClient();
  const { data: link } = await supabase.from('telegram_links').select('user_id').eq('chat_id', chatId).maybeSingle();

  if (!link) {
    await sendMessage(chatId, NOT_LINKED_TEXT);
    return;
  }

  await sendChatAction(chatId);
  const reply = await runAgent(supabase, link.user_id, text);
  await sendMessage(chatId, reply);
}

export async function POST(request: Request) {
  if (!validSecret(request.headers.get('x-telegram-bot-api-secret-token'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  type TelegramUpdate = {
    update_id?: number;
    message?: { chat?: { id?: number; type?: string }; text?: string };
  };
  let update: TelegramUpdate;
  try {
    update = await request.json();
  } catch {
    return ok();
  }

  if (typeof update?.update_id === 'number' && !rememberUpdate(update.update_id)) return ok();

  const message = update?.message;
  const chatId: number | undefined = message?.chat?.id;
  const text: string = (message?.text || '').trim();
  if (!chatId) return ok();

  // Only answer private chats so ideas never leak into groups.
  if (message?.chat?.type !== 'private') return ok();

  try {
    if (!text) {
      await sendMessage(chatId, 'I can only read text messages for now.');
      return ok();
    }

    const [command, ...rest] = text.split(/\s+/);
    const cmd = command.toLowerCase().replace(/@\w+$/, '');

    if (cmd === '/start') await handleStart(chatId, rest.join('').trim());
    else if (cmd === '/help') await sendMessage(chatId, HELP_TEXT);
    else if (cmd === '/unlink') await handleUnlink(chatId);
    else await handleQuestion(chatId, text);
  } catch (error) {
    console.error('Telegram webhook error:', error);
    await sendMessage(chatId, 'Sorry, something went wrong while answering. Please try again in a moment.').catch(
      () => {}
    );
  }

  // Always 200 so Telegram does not retry and send duplicate replies.
  return ok();
}
