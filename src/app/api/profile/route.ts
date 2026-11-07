import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AccountDeletionError, deleteUserAccount, getProfileSummary } from '@/lib/account';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/** Typed by the user in the confirmation dialog before their account is deleted. */
const CONFIRM_PHRASE = 'DELETE';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const profile = await getProfileSummary(supabase, user);
    return NextResponse.json({ data: profile }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error loading profile:', error);
    const message = error instanceof Error ? error.message : 'Could not load your profile';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Permanently deletes the signed-in user's account and all of their data. */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    if (body?.confirm !== CONFIRM_PHRASE) {
      return NextResponse.json({ error: `Type ${CONFIRM_PHRASE} to confirm` }, { status: 400 });
    }

    await deleteUserAccount(supabase, user.id);

    // The auth user is gone; clear the session cookies locally (no call to the auth server).
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // Cookies may already be invalid; the client redirects to /login regardless.
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error deleting account:', error);
    const message =
      error instanceof AccountDeletionError ? error.message : 'Could not delete your account. Please try again.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
