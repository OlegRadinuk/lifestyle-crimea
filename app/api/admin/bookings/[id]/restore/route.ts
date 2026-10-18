import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkAdminAuth } from '@/lib/admin-auth';

type TrashRow = {
  id: string;
  apartment_id: string;
  check_in: string;
  check_out: string;
  status: string;
  deleted_at: string | null;
};

/** POST /api/admin/bookings/[id]/restore — вернуть заявку из корзины. 409 при пересечении дат. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const booking = db
      .prepare('SELECT id, apartment_id, check_in, check_out, status, deleted_at FROM bookings WHERE id = ?')
      .get(id) as TrashRow | undefined;

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    if (!booking.deleted_at) {
      return NextResponse.json({ error: 'Заявка не в корзине' }, { status: 409 });
    }

    // Отменённая заявка даты не занимает — конфликт проверяем только для остальных.
    // Полуинтервал [check_in, check_out): check_in < :to AND check_out > :from
    if (booking.status !== 'cancelled') {
      const conflict = db
        .prepare(
          `SELECT id, check_in, check_out FROM bookings
           WHERE apartment_id = ? AND id != ?
             AND deleted_at IS NULL AND status != 'cancelled'
             AND check_in < ? AND check_out > ?
           ORDER BY check_in LIMIT 1`
        )
        .get(booking.apartment_id, booking.id, booking.check_out, booking.check_in) as
        | { id: string; check_in: string; check_out: string }
        | undefined;

      if (conflict) {
        return NextResponse.json(
          {
            error: `Нельзя восстановить: даты пересекаются с другой заявкой (${conflict.check_in} — ${conflict.check_out}) в этом же апартаменте.`,
            conflictBookingId: conflict.id,
          },
          { status: 409 }
        );
      }
    }

    db.prepare('UPDATE bookings SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error restoring booking:', error);
    return NextResponse.json({ error: 'Failed to restore booking' }, { status: 500 });
  }
}
