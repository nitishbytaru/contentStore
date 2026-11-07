import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prepareSample } from '@/lib/onboarding/prepare';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/** Prepares the sample idea when the user skips ahead in the tour. Body: { need: 'context' | 'article' }. */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const need = body?.need === 'article' ? 'article' : body?.need === 'context' ? 'context' : null;
    if (!need) return NextResponse.json({ error: 'Unknown preparation step' }, { status: 400 });

    const result = await prepareSample(supabase, user.id, need);
    if (!result) return NextResponse.json({ error: 'Sample idea not found' }, { status: 404 });
    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error preparing the onboarding sample:', error);
    const message = error instanceof Error ? error.message : 'Could not prepare the sample idea';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
