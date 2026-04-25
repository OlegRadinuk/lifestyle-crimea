import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function GET() {
  try {
    // Active future Travelline blocks (imported via ICS sync into blocked_dates)
    const travellineBookings = (
      db
        .prepare(`SELECT COUNT(*) as count FROM blocked_dates WHERE end_date >= date('now')`)
        .get() as { count: number }
    ).count;

    // Active future bookings from the website (confirmed, check_in in the future)
    const websiteBookings = (
      db
        .prepare(
          `SELECT COUNT(*) as count FROM bookings WHERE status = 'confirmed' AND check_in >= date('now')`
        )
        .get() as { count: number }
    ).count;

    return NextResponse.json(
      {
        travelline_bookings: travellineBookings,
        website_bookings: websiteBookings,
        total_active: travellineBookings + websiteBookings,
      },
      {
        headers: CORS_HEADERS,
      }
    );
  } catch (err) {
    console.error('[/api/public/stats] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
