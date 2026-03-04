import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const apartmentId = searchParams.get('apartment_id');

  try {
    let query = `
      SELECT b.*, a.title as apartment_title 
      FROM bookings b
      JOIN apartments a ON b.apartment_id = a.id
      WHERE 1=1
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

    query += ` ORDER BY b.check_in DESC`;

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