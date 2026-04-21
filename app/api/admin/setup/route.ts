import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/admin-auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json() as { username: string; password: string };

    if (!username || username.length < 3) {
      return NextResponse.json({ error: 'Логин минимум 3 символа' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Пароль минимум 6 символов' }, { status: 400 });
    }

    const create = db.transaction(() => {
      const { count } = db.prepare('SELECT COUNT(*) as count FROM admin_users').get() as { count: number };
      if (count > 0) throw Object.assign(new Error('ALREADY_SETUP'), { code: 'ALREADY_SETUP' });
      db.prepare('INSERT INTO admin_users (id, username, password_hash) VALUES (?, ?, ?)').run(
        uuidv4(),
        username.trim(),
        hashPassword(password)
      );
    });

    try {
      create();
      return NextResponse.json({ success: true });
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ALREADY_SETUP') {
        return NextResponse.json({ error: 'Уже настроено. Используйте страницу управления пользователями.' }, { status: 403 });
      }
      throw e;
    }
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ALREADY_SETUP') {
      return NextResponse.json({ error: 'Уже настроено. Используйте страницу управления пользователями.' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
