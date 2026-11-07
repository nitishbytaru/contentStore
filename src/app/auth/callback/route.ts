import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** Only same-site paths are allowed after sign-in (blocks open redirects like `//evil.com`). */
function safeNext(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return '/ideas';
  return value;
}

function loginWithError(origin: string, message: string) {
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(message)}`);
}

/**
 * Lands here after email confirmation and after Google sign-in. Exchanges the
 * one-time code for a session cookie, then continues into the app.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNext(searchParams.get('next'));

  // The provider (e.g. Google) reports failures such as a cancelled consent screen this way.
  const providerError = searchParams.get('error_description') || searchParams.get('error');
  if (providerError) {
    return loginWithError(origin, providerError.replace(/\+/g, ' '));
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    return loginWithError(origin, error.message || 'Could not authenticate user');
  }

  return loginWithError(origin, 'Could not authenticate user');
}
