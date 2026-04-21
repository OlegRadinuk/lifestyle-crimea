import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import { checkAdminAuth, hashPassword } from '@/lib/admin-auth';

export async function GET(request: Request) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  const users = db.prepare('SELECT id, username, created_at FROM admin_users ORDER BY created_at ASC').all();
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  try {
    const { username, password } = await request.json() as { username: string; password: string };

    if (!username || username.trim().length < 3) {
      return NextResponse.json({ error: 'Логин минимум 3 символа' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Пароль минимум 6 символов' }, { status: 400 });
    }

    const existing = db.prepare('SELECT id FROM admin_users WHERE username = ?').get(username.trim());
    if (existing) {
      return NextResponse.json({ error: 'Пользователь с таким логином уже существует' }, { status: 409 });
    }

    const id = uuidv4();
    db.prepare('INSERT INTO admin_users (id, username, password_hash) VALUES (?, ?, ?)').run(
      id,
      username.trim(),
      hashPassword(password)
    );

    return NextResponse.json({ success: true, id });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
