import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkAdminAuth } from '@/lib/admin-auth';

export async function GET(request: Request) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  try {
    const bookings = db.prepare(`
      SELECT
        bd.id,
        bd.apartment_id,
        a.title AS apartment_title,
        bd.start_date AS check_in,
        bd.end_date   AS check_out,
        bd.booking_number AS external_id,
        bd.source,
        bd.created_at
      FROM blocked_dates bd
      LEFT JOIN apartments a ON a.id = bd.apartment_id
      WHERE bd.source = 'travelline'
      ORDER BY bd.start_date DESC
      LIMIT 500
    `).all();

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching blocked bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}
