import { NextResponse } from 'next/server';
import { generateSessionToken } from '@/lib/admin-auth';

export async function POST(request: Request) {
  try {
    const { password } = await request.json() as { password: string };

    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret) {
      return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
    }

    if (!password || password !== adminSecret) {
      return NextResponse.json({ error: 'Неверный пароль' }, { status: 401 });
    }

    const sessionToken = generateSessionToken(adminSecret);
    const response = NextResponse.json({ success: true });

    response.cookies.set('admin_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('admin_token');
  return response;
}
