const MAX_MESSAGE_LENGTH = 4096;

function apiUrl(method: string): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set');
  return `https://api.telegram.org/bot${token}/${method}`;
}

async function callTelegram(method: string, payload: Record<string, unknown>) {
  const response = await fetch(apiUrl(method), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error(`Telegram ${method} failed (${response.status}):`, body);
  }
}

/** Splits text into chunks that fit Telegram's 4096-char limit, preferring line breaks. */
function splitMessage(text: string, limit = MAX_MESSAGE_LENGTH): string[] {
  const chunks: string[] = [];
  let rest = text.trim();
  while (rest.length > limit) {
    let cut = rest.lastIndexOf('\n', limit);
    if (cut < limit / 2) cut = rest.lastIndexOf(' ', limit);
    if (cut < limit / 2) cut = limit;
    chunks.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

export async function sendMessage(chatId: number, text: string) {
  for (const chunk of splitMessage(text || '…')) {
    await callTelegram('sendMessage', {
      chat_id: chatId,
      text: chunk,
      link_preview_options: { is_disabled: true },
    });
  }
}

export async function sendChatAction(chatId: number, action: 'typing' = 'typing') {
  await callTelegram('sendChatAction', { chat_id: chatId, action });
}
