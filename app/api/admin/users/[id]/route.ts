import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkAdminAuth, verifySession, getTokenFromRequest, ADMIN_TOKEN_COOKIE } from '@/lib/admin-auth';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  const { id } = await params;

  const token = getTokenFromRequest(request);
  const currentUserId = verifySession(token);

  if (currentUserId === id) {
    return NextResponse.json({ error: 'Нельзя удалить самого себя' }, { status: 400 });
  }

  const total = (db.prepare('SELECT COUNT(*) as count FROM admin_users').get() as { count: number }).count;
  if (total <= 1) {
    return NextResponse.json({ error: 'Нельзя удалить последнего пользователя' }, { status: 400 });
  }

  db.prepare('DELETE FROM admin_sessions WHERE user_id = ?').run(id);
  db.prepare('DELETE FROM admin_users WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
