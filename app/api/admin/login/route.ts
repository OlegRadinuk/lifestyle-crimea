import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  verifyPassword,
  createSession,
  destroySession,
  getTokenFromRequest,
  getAdminTokenCookieOptions,
  ADMIN_TOKEN_COOKIE,
} from '@/lib/admin-auth';

const DUMMY_HASH = 'a'.repeat(32) + ':' + 'b'.repeat(128);

interface AdminUser { id: string; username: string; password_hash: string; }

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json() as { username: string; password: string };
    if (!username || !password) {
      return NextResponse.json({ error: 'Введите логин и пароль' }, { status: 400 });
    }

    const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username) as AdminUser | undefined;
    // Всегда вызываем verifyPassword чтобы избежать timing attack
    const ok = verifyPassword(password, user?.password_hash ?? DUMMY_HASH);

    if (!user || !ok) {
      return NextResponse.json({ error: 'Неверный логин или пароль' }, { status: 401 });
    }

    const token = createSession(user.id);
    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_TOKEN_COOKIE, token, getAdminTokenCookieOptions());
    return response;
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const token = getTokenFromRequest(request);
  if (token) destroySession(token);
  const response = NextResponse.json({ success: true });
  response.cookies.delete(ADMIN_TOKEN_COOKIE);
  return response;
}
