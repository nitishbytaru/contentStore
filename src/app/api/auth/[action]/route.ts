import { NextResponse } from 'next/server';
import {
  verifyPassword,
  createAuthToken,
  SESSION_COOKIE_NAME,
  DEFAULT_MAX_AGE,
  REMEMBER_ME_MAX_AGE,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Consolidated Authentication API Route.
 * Handles both /api/auth/login and /api/auth/logout via dynamic [action] parameter.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;

  // 1. Logout Handler
  if (action === 'logout') {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  }

  // 2. Login Handler
  if (action === 'login') {
    try {
      const body = await request.json().catch(() => null);
      if (!body || typeof body.password !== 'string') {
        return NextResponse.json(
          { error: 'Password is required' },
          { status: 400 }
        );
      }

      const { password, rememberMe } = body;

      if (!verifyPassword(password)) {
        return NextResponse.json(
          { error: 'Incorrect password. Please try again.' },
          { status: 401 }
        );
      }

      const maxAge = rememberMe ? REMEMBER_ME_MAX_AGE : DEFAULT_MAX_AGE;
      const token = createAuthToken(maxAge);

      const response = NextResponse.json({
        success: true,
        message: 'Authentication successful',
      });

      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge,
      });

      return response;
    } catch (error) {
      console.error('Error in /api/auth/login:', error);
      return NextResponse.json(
        { error: 'An unexpected error occurred during login' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { error: `Unknown auth action: ${action}` },
    { status: 404 }
  );
}
