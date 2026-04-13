import { NextResponse } from 'next/server';

const ADMIN_TOKEN_COOKIE = 'admin_token';

/**
 * Проверяет авторизацию для admin API роутов.
 * Возвращает NextResponse с 401 если не авторизован, null если ок.
 *
 * Авторизация: cookie `admin_token` = значение из env ADMIN_SECRET
 * (или 'admin123' если ADMIN_SECRET не задан — для обратной совместимости).
 */
export function checkAdminAuth(request: Request): NextResponse | null {
  const adminSecret = process.env.ADMIN_SECRET ?? 'admin123';

  // Читаем cookie из заголовка
  const cookieHeader = request.headers.get('cookie') ?? '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k, v.join('=')];
    })
  );

  const token = cookies[ADMIN_TOKEN_COOKIE];

  if (!token || token !== adminSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}
