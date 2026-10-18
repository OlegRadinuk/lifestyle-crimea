import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { checkAdminAuth } from '@/lib/admin-auth';

type RawBooking = {
  id: string;
  apartment_id: string;
  guest_name: string | null;
  guest_phone: string | null;
  guest_email: string | null;
  check_in: string;
  check_out: string;
  guests_count: number;
  total_price: number;
  status: string;
  prepaid_amount: number | null;
  prepaid_status: string | null;
  source: string;
  manager_notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const booking = db.prepare(`
      SELECT b.*, a.title as apartment_title 
      FROM bookings b
      JOIN apartments a ON b.apartment_id = a.id
      WHERE b.id = ?
    `).get(id) as RawBooking | undefined;

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Преобразуем числа
    const formatted = {
      ...booking,
      total_price: Number(booking.total_price),
      prepaid_amount: Number(booking.prepaid_amount || 0),
      manager_notes: booking.manager_notes || '',
      // Удалённую заявку можно открыть (из корзины), но с флагом
      is_deleted: booking.deleted_at != null,
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const current = db.prepare('SELECT deleted_at FROM bookings WHERE id = ?').get(id) as { deleted_at: string | null } | undefined;
    if (!current) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    if (current.deleted_at) {
      return NextResponse.json({ error: 'Заявка в корзине. Сначала восстановите её.' }, { status: 409 });
    }

    const data = await request.json();
    
    const updates: string[] = [];
    const values: any[] = [];

    if (data.status) {
      updates.push('status = ?');
      values.push(data.status);
    }

    if (data.prepaid_amount !== undefined) {
      updates.push('prepaid_amount = ?');
      values.push(data.prepaid_amount);
    }

    if (data.prepaid_status) {
      updates.push('prepaid_status = ?');
      values.push(data.prepaid_status);
    }

    if (data.manager_notes !== undefined) {
      updates.push('manager_notes = ?');
      values.push(data.manager_notes);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE bookings SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...values);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/bookings/[id]            — мягкое удаление (в корзину)
 * DELETE /api/admin/bookings/[id]?permanent=1 — окончательное, только если уже в корзине
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  const { id } = await params;
  const permanent = new URL(request.url).searchParams.get('permanent') === '1';

  try {
    const existing = db.prepare('SELECT id, deleted_at FROM bookings WHERE id = ?').get(id) as
      | { id: string; deleted_at: string | null }
      | undefined;
    if (!existing) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (permanent) {
      if (!existing.deleted_at) {
        return NextResponse.json(
          { error: 'Окончательно удалить можно только заявку из корзины' },
          { status: 409 }
        );
      }
      // Комментарии удаляем явно: не полагаемся на ON DELETE CASCADE старой схемы прод-БД
      db.transaction(() => {
        db.prepare('DELETE FROM booking_comments WHERE booking_id = ?').run(id);
        db.prepare('DELETE FROM bookings WHERE id = ?').run(id);
      })();
      return NextResponse.json({ success: true, permanent: true });
    }

    if (existing.deleted_at) {
      return NextResponse.json({ success: true, alreadyDeleted: true });
    }

    db.prepare(
      'UPDATE bookings SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(id);
    return NextResponse.json({ success: true, permanent: false });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 });
  }
}
