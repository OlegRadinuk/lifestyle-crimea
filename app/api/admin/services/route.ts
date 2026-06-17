import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { serviceItemsService } from '@/lib/db';
import { checkAdminAuth } from '@/lib/admin-auth';
import { ServiceItemCreateSchema } from './schema';

// GET /api/admin/services — список всех пунктов (для админки)
export async function GET(request: Request) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  try {
    return NextResponse.json(serviceItemsService.getAll());
  } catch (error) {
    console.error('Error fetching service items:', error);
    return NextResponse.json({ error: 'Failed to fetch service items' }, { status: 500 });
  }
}

// POST /api/admin/services — создать пункт
export async function POST(request: Request) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  try {
    const payload = await request.json();
    const parsed = ServiceItemCreateSchema.safeParse(payload);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join('; ');
      return NextResponse.json({ error: msg || 'Некорректные данные', issues: parsed.error.issues }, { status: 400 });
    }
    const v = parsed.data;

    const created = serviceItemsService.create({
      category: v.category,
      title: v.title.trim(),
      icon: v.icon ? v.icon : null,
      is_active: v.is_active,
      sort_order: v.sort_order,
    });

    revalidatePath('/services');

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating service item:', error);
    const message = error instanceof Error ? error.message : 'Failed to create service item';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
