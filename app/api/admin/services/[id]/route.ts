import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { serviceItemsService } from '@/lib/db';
import { checkAdminAuth } from '@/lib/admin-auth';
import { ServiceItemUpdateSchema } from '../schema';

// GET /api/admin/services/[id]
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  const { id } = await params;
  const item = serviceItemsService.getById(id);
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(item);
}

// PATCH /api/admin/services/[id] — обновить
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  const { id } = await params;

  const existing = serviceItemsService.getById(id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const body = await request.json();
    const parsed = ServiceItemUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join('; ');
      return NextResponse.json({ error: msg || 'Некорректные данные', issues: parsed.error.issues }, { status: 400 });
    }

    const next = parsed.data;
    const updated = serviceItemsService.update(id, {
      ...next,
      // Пустую строку иконки трактуем как «нет иконки» (фолбэк на странице).
      icon: next.icon === undefined ? undefined : (next.icon ? next.icon : null),
      title: next.title === undefined ? undefined : next.title.trim(),
    });

    revalidatePath('/services');

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating service item:', error);
    const message = error instanceof Error ? error.message : 'Failed to update service item';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// DELETE /api/admin/services/[id]
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  const { id } = await params;

  const ok = serviceItemsService.delete(id);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  revalidatePath('/services');

  return NextResponse.json({ success: true });
}
