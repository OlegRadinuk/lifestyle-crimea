import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const apartmentId = searchParams.get('apartment_id');

  try {
    let query = `
      SELECT 
        bd.id,
        bd.apartment_id,
        a.title as apartment_title,
        'Travelline' as guest_name,
        '-' as guest_phone,
        bd.start_date as check_in,
        bd.end_date as check_out,
        2 as guests_count,
        0 as total_price,
        'confirmed' as status,
        'none' as prepaid_status,
        0 as prepaid_amount,
        'travelline' as source,
        bd.booking_number as external_id,
        bd.created_at
      FROM blocked_dates bd
      JOIN apartments a ON bd.apartment_id = a.id
      WHERE 1=1
    `;
    
    const params: any[] = [];

    if (apartmentId) {
      query += ` AND bd.apartment_id = ?`;
      params.push(apartmentId);
    }

    query += ` ORDER BY bd.start_date DESC`;

    const bookings = db.prepare(query).all(...params);

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching blocked bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch blocked bookings' }, { status: 500 });
  }
}