import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ apartmentId: string }> }
) {
  try {
    const { apartmentId } = await params;
    const { searchParams } = new URL(request.url);
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');

    // Если переданы конкретные даты - проверяем доступность
    if (checkIn && checkOut) {
      const blocked = db.prepare(`
        SELECT COUNT(*) as count
        FROM blocked_dates
        WHERE apartment_id = ?
        AND start_date < ?
        AND end_date > ?
      `).get(apartmentId, checkOut, checkIn) as { count: number };

      return NextResponse.json({
        apartmentId,
        checkIn,
        checkOut,
        isAvailable: blocked.count === 0,
        source: 'travelline'
      });
    }

    // Иначе возвращаем все заблокированные даты из Travelline
    const blockedDates = db.prepare(`
      SELECT start_date as start, end_date as end, source
      FROM blocked_dates
      WHERE apartment_id = ?
      AND end_date >= date('now')
      ORDER BY start_date
    `).all(apartmentId);

    return NextResponse.json({
      apartmentId,
      blockedDates,
      source: 'travelline'
    });
  } catch (error) {
    console.error('Error in Travelline availability API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}