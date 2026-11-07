import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSampleForUser } from '@/lib/onboarding/sample';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Creates (or reuses) the onboarding sample idea and prompt for the product tour. */
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { ideaId } = await createSampleForUser(supabase, user.id);
    return NextResponse.json({ data: { ideaId } }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error creating onboarding sample:', error);
    const message = error instanceof Error ? error.message : 'Could not prepare the sample idea';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
