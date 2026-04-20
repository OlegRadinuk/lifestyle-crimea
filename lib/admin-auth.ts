import { NextResponse } from 'next/server';
import crypto from 'crypto';

const ADMIN_TOKEN_COOKIE = 'admin_token';

function getAdminSecret(): string {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) throw new Error('ADMIN_SECRET env variable is required');
  return secret;
}

export function generateSessionToken(secret: string): string {
  return crypto.createHmac('sha256', secret).update('admin-session').digest('hex');
}

export function checkAdminAuth(request: Request): NextResponse | null {
  let adminSecret: string;
  try {
    adminSecret = getAdminSecret();
  } catch {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const cookieHeader = request.headers.get('cookie') ?? '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k, v.join('=')];
    })
  );

  const token = cookies[ADMIN_TOKEN_COOKIE];
  const expected = generateSessionToken(adminSecret);

  if (!token || token !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}
