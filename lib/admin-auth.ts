import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';

export const ADMIN_TOKEN_COOKIE = 'admin_token';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64, { N: 2**15, r: 8, p: 1 });
  return `${salt}:${hash.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(':');
  if (parts.length !== 2) return false;
  const [salt, hash] = parts;
  try {
    const storedBuf = Buffer.from(hash, 'hex');
    const computedBuf = crypto.scryptSync(password, salt, 64, { N: 2**15, r: 8, p: 1 });
    if (storedBuf.length !== computedBuf.length) return false;
    return crypto.timingSafeEqual(storedBuf, computedBuf);
  } catch {
    return false;
  }
}

export function createSession(userId: string): string {
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
  db.prepare('INSERT INTO admin_sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, userId, expiresAt);
  return token;
}

export function verifySession(token: string): string | null {
  const row = db.prepare('SELECT user_id, expires_at FROM admin_sessions WHERE token = ?').get(token) as { user_id: string; expires_at: string } | undefined;
  if (!row) return null;
  if (new Date(row.expires_at) < new Date()) {
    db.prepare('DELETE FROM admin_sessions WHERE token = ?').run(token);
    return null;
  }
  return row.user_id;
}

export function destroySession(token: string): void {
  db.prepare('DELETE FROM admin_sessions WHERE token = ?').run(token);
}

function parseCookies(request: Request): Record<string, string> {
  const cookieHeader = request.headers.get('cookie') ?? '';
  return Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k, v.join('=')];
    })
  );
}

export function getTokenFromRequest(request: Request): string {
  return parseCookies(request)[ADMIN_TOKEN_COOKIE] ?? '';
}

export function checkAdminAuth(request: Request): NextResponse | null {
  const token = getTokenFromRequest(request);
  if (!token || !verifySession(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export function getAdminTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  };
}
