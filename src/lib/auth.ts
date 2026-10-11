import crypto from 'crypto';

export const SESSION_COOKIE_NAME = 'cs_auth_session';
export const DEFAULT_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds
export const REMEMBER_ME_MAX_AGE = 60 * 60 * 24 * 90; // 90 days in seconds

// Fallback password if APP_PASSWORD or ADMIN_PASSWORD is not set in environment variables
const DEFAULT_FALLBACK_PASSWORD = 'contentstore2026';
const DEFAULT_FALLBACK_SECRET = 'cs-default-secret-salt-3a8f9c1b7e4d2a6e0c';

function getPassword(): string {
  return (
    process.env.APP_PASSWORD ||
    process.env.ADMIN_PASSWORD ||
    DEFAULT_FALLBACK_PASSWORD
  );
}

function getSecret(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.APP_PASSWORD ||
    process.env.ADMIN_PASSWORD ||
    DEFAULT_FALLBACK_SECRET
  );
}

export function isAuthCustomConfigured(): boolean {
  return Boolean(process.env.APP_PASSWORD || process.env.ADMIN_PASSWORD);
}

export function verifyPassword(inputPassword: string): boolean {
  if (!inputPassword || typeof inputPassword !== 'string') {
    return false;
  }
  const expectedPassword = getPassword();

  const inputHash = crypto.createHash('sha256').update(inputPassword).digest();
  const expectedHash = crypto.createHash('sha256').update(expectedPassword).digest();

  return crypto.timingSafeEqual(inputHash, expectedHash);
}

interface TokenPayload {
  v: number;
  iat: number;
  exp: number;
}

export function createAuthToken(maxAgeSeconds: number = DEFAULT_MAX_AGE): string {
  const now = Date.now();
  const payload: TokenPayload = {
    v: 1,
    iat: now,
    exp: now + maxAgeSeconds * 1000,
  };

  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSecret())
    .update(data)
    .digest('base64url');

  return `${data}.${signature}`;
}

export function verifyAuthToken(token: string | undefined | null): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return false;
  }

  const [data, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', getSecret())
    .update(data)
    .digest('base64url');

  const sigHash = crypto.createHash('sha256').update(signature).digest();
  const expHash = crypto.createHash('sha256').update(expectedSignature).digest();

  if (!crypto.timingSafeEqual(sigHash, expHash)) {
    return false;
  }

  try {
    const payload: TokenPayload = JSON.parse(
      Buffer.from(data, 'base64url').toString('utf8')
    );
    if (!payload.exp || Date.now() > payload.exp) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
