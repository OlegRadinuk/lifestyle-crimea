import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json() as { password: string };

    const adminSecret = process.env.ADMIN_SECRET ?? 'admin123';

    if (!password || password !== adminSecret) {
      return NextResponse.json({ error: 'Неверный пароль' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });

    // Устанавливаем httpOnly cookie — не доступна из JS
    response.cookies.set('admin_token', adminSecret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 дней
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
