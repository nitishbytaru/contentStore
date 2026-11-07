import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid using supabase.auth.getSession() because it is not guaranteed
  // to revalidate with the Auth server. Using getUser() is recommended.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Supabase falls back to the Site URL (e.g. `/?code=…`) when an OAuth redirectTo is not on
  // its allow-list. Without this, the code is never exchanged, the visitor bounces to /login and
  // the browser autofills the password form instead of finishing Google sign-in.
  const strayCode = request.nextUrl.searchParams.get('code');
  if (!user && strayCode && !request.nextUrl.pathname.startsWith('/auth')) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/callback';
    if (!url.searchParams.get('next')) url.searchParams.set('next', '/ideas');
    return NextResponse.redirect(url);
  }

  const isLanding = request.nextUrl.pathname === '/';

  // Public landing page: signed-in users go straight to their ideas.
  if (isLanding) {
    if (user) {
      const url = request.nextUrl.clone();
      url.pathname = '/ideas';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const isAuthRoute =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup') ||
    request.nextUrl.pathname.startsWith('/auth');

  // If user is not logged in and not on an auth route or public assets, redirect to /login
  if (
    !user &&
    !isAuthRoute &&
    !request.nextUrl.pathname.startsWith('/_next') &&
    !request.nextUrl.pathname.startsWith('/api') &&
    request.nextUrl.pathname !== '/favicon.ico'
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If user is logged in and tries to access /login or /signup, redirect to /ideas
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    const url = request.nextUrl.clone();
    url.pathname = '/ideas';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
