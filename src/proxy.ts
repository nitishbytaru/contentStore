import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuthToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Allow static assets, Next.js internal files, and favicon
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/favicon.ico' ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|css|js|map|txt|xml)$/)
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isAuthenticated = verifyAuthToken(token);

  // 2. If user is accessing the login page:
  if (pathname === '/login') {
    if (isAuthenticated) {
      // Already authenticated -> redirect to dashboard
      const from = request.nextUrl.searchParams.get('from') || '/';
      const redirectUrl = new URL(from.startsWith('/') ? from : '/', request.url);
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next();
  }

  // 3. If user is NOT authenticated:
  if (!isAuthenticated) {
    // For protected API endpoints, return a 401 JSON response
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    // For web pages, redirect to /login and preserve origin path
    const loginUrl = new URL('/login', request.url);
    const destination = pathname + search;
    if (destination !== '/') {
      loginUrl.searchParams.set('from', destination);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
