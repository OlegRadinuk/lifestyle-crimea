import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkAdminAuth } from '@/lib/admin-auth';

export async function GET(request: Request) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const apartmentId = searchParams.get('apartment_id');
  const trash = searchParams.get('trash') === '1';

  try {
    let query = `
      SELECT b.*, a.title as apartment_title 
      FROM bookings b
      JOIN apartments a ON b.apartment_id = a.id
      WHERE ${trash ? 'b.deleted_at IS NOT NULL' : 'b.deleted_at IS NULL'}
    `;
    const params: any[] = [];

    if (status && status !== 'all') {
      query += ` AND b.status = ?`;
      params.push(status);
    }

    if (apartmentId) {
      query += ` AND b.apartment_id = ?`;
      params.push(apartmentId);
    }

    query += trash ? ` ORDER BY b.deleted_at DESC` : ` ORDER BY b.check_in DESC`;

    const bookings = db.prepare(query).all(...params);

    // Преобразуем числа
    const formatted = bookings.map((booking: any) => ({
      ...booking,
      total_price: Number(booking.total_price),
      prepaid_amount: Number(booking.prepaid_amount || 0),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}