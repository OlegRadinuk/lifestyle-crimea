import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  slug: z.string().min(1).max(100),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'from must be YYYY-MM-DD'),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'to must be YYYY-MM-DD'),
});

interface ApartmentRow {
  id: string;
  title: string;
}

interface CountRow {
  count: number;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const parsed = QuerySchema.safeParse({
      slug: searchParams.get('slug') ?? '',
      from: searchParams.get('from') ?? '',
      to: searchParams.get('to') ?? '',
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: parsed.error.flatten().fieldErrors },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const { slug, from, to } = parsed.data;

    // Validate logical date order
    if (from >= to) {
      return NextResponse.json(
        { error: "'from' must be before 'to'" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    // Look up apartment by id (slug IS the id in this schema)
    const apartment = db.prepare(`
      SELECT id, title
      FROM apartments
      WHERE id = ? AND is_active = 1 AND deleted_at IS NULL
    `).get(slug) as ApartmentRow | undefined;

    if (!apartment) {
      return NextResponse.json(
        { error: 'Apartment not found', slug },
        { status: 404, headers: CORS_HEADERS },
      );
    }

    /* Standard overlap: занято на [from, to) если end > from AND start < to.
       blocked_dates (синк Travelline) — ГЛАВНЫЙ источник занятости: именно по нему
       живёт публичная страница (/api/availability-travelline). Без него ассистент
       считал свободным всё, что забронировано через Travelline (там 68 будущих
       блоков), т.к. `bookings` почти пуста, а `external_bookings` пуста совсем. */
    const { count } = db.prepare(`
      SELECT COUNT(*) as count FROM (
        SELECT id FROM blocked_dates
        WHERE apartment_id = ?
          AND end_date > ?
          AND start_date < ?
        UNION ALL
        SELECT id FROM bookings
        WHERE apartment_id = ?
          AND status != 'cancelled'
          AND check_out > ?
          AND check_in < ?
        UNION ALL
        SELECT id FROM external_bookings
        WHERE apartment_id = ?
          AND check_out > ?
          AND check_in < ?
      )
    `).get(
      apartment.id, from, to,
      apartment.id, from, to,
      apartment.id, from, to,
    ) as CountRow;

    const fromDate = new Date(from + 'T00:00:00Z');
    const toDate = new Date(to + 'T00:00:00Z');
    const nights = Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));

    return NextResponse.json(
      {
        available: count === 0,
        apartment_name: apartment.title,
        from,
        to,
        nights,
      },
      { status: 200, headers: CORS_HEADERS },
    );
  } catch (err) {
    console.error('[/api/public/availability] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
