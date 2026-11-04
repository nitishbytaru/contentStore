import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CODE_TTL_MS = 10 * 60 * 1000;

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

const unauthorized = () => NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });

/** Link status for the logged-in user. */
export async function GET() {
  try {
    const { supabase, user } = await getUser();
    if (!user) return unauthorized();

    const { data, error } = await supabase
      .from('telegram_links')
      .select('chat_id, linked_at')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) throw error;

    return NextResponse.json({ linked: Boolean(data?.chat_id), linkedAt: data?.linked_at || null });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('Error reading Telegram link:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** Creates a one-time link code and returns the t.me deep link. */
export async function POST() {
  try {
    const { supabase, user } = await getUser();
    if (!user) return unauthorized();

    const botUsername = process.env.TELEGRAM_BOT_USERNAME?.replace(/^@/, '').trim();
    if (!botUsername) throw new Error('TELEGRAM_BOT_USERNAME is not set');

    const code = randomBytes(16).toString('hex');
    const { error } = await supabase.from('telegram_links').upsert(
      {
        user_id: user.id,
        link_code: code,
        code_expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
      },
      { onConflict: 'user_id' }
    );
    if (error) throw error;

    return NextResponse.json({ url: `https://t.me/${botUsername}?start=${code}` });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('Error creating Telegram link code:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** Disconnects Telegram for the logged-in user. */
export async function DELETE() {
  try {
    const { supabase, user } = await getUser();
    if (!user) return unauthorized();

    const { error } = await supabase.from('telegram_links').delete().eq('user_id', user.id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('Error unlinking Telegram:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
