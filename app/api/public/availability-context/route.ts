import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
  'Content-Type': 'text/plain; charset=utf-8',
};

interface ApartmentRow {
  id: string;
  title: string;
}

interface BookingPeriod {
  check_in: string;
  check_out: string;
}

function formatDate(isoDate: string): string {
  // isoDate: "YYYY-MM-DD"
  const [year, month, day] = isoDate.split('-');
  return `${day}.${month}.${year}`;
}

export async function GET() {
  try {
    const apartments = db
      .prepare(
        `SELECT id, title FROM apartments
         WHERE is_active = 1 AND deleted_at IS NULL
         ORDER BY title`,
      )
      .all() as ApartmentRow[];

    const periodQuery = db.prepare(`
      SELECT check_in, check_out FROM bookings
      WHERE apartment_id = ?
        AND status != 'cancelled'
        AND check_out > date('now')
        AND check_in  < date('now', '+60 days')
      UNION ALL
      SELECT check_in, check_out FROM external_bookings
      WHERE apartment_id = ?
        AND check_out > date('now')
        AND check_in  < date('now', '+60 days')
      UNION ALL
      SELECT start_date AS check_in, end_date AS check_out FROM blocked_dates
      WHERE apartment_id = ?
        AND end_date > date('now')
        AND start_date < date('now', '+60 days')
      ORDER BY check_in
    `);

    const today = new Date();
    const dateLabel = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;

    const lines: string[] = [
      'АКТУАЛЬНАЯ ЗАНЯТОСТЬ АПАРТАМЕНТОВ',
      `Данные на: ${dateLabel}`,
      'Горизонт: ближайшие 60 дней',
      '',
    ];

    for (const apt of apartments) {
      const periods = periodQuery.all(apt.id, apt.id, apt.id) as BookingPeriod[];

      lines.push(apt.title);

      if (periods.length === 0) {
        lines.push('Свободно на все 60 дней');
      } else {
        const formatted = periods
          .map((p) => `${formatDate(p.check_in)}–${formatDate(p.check_out)}`)
          .join(', ');
        lines.push(`Занято: ${formatted}`);
      }

      lines.push('');
    }

    lines.push('---');
    lines.push(
      'ВАЖНО: если гость спрашивает о датах НЕ из этого списка (более 60 дней вперёд) — скажи что не можешь проверить и направь к менеджеру.',
    );

    return new NextResponse(lines.join('\n'), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (err) {
    console.error('[/api/public/availability-context] Error:', err);
    return new NextResponse('Internal server error', {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
