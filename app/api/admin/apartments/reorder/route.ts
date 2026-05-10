import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { checkAdminAuth } from '@/lib/admin-auth';

const ReorderItemSchema = z.object({
  id: z.string().min(1),
  sort_order: z.number().int().min(0),
});

const ReorderBodySchema = z.array(ReorderItemSchema).min(1);

export async function POST(request: Request) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = ReorderBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.issues }, { status: 400 });
  }

  const items = parsed.data;

  try {
    const stmt = db.prepare(
      'UPDATE apartments SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    );

    const reorder = db.transaction(
      (rows: Array<{ id: string; sort_order: number }>) => {
        for (const row of rows) {
          stmt.run(row.sort_order, row.id);
        }
      }
    );

    reorder(items);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering apartments:', error);
    return NextResponse.json(
      { error: 'Failed to reorder apartments' },
      { status: 500 }
    );
  }
}
