import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// GET /api/admin/bookings
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

    query += ` ORDER BY b.check_in ASC`;

    const bookings = db.prepare(query).all(...params);
    return NextResponse.json(bookings);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

// POST /api/admin/bookings (ручное бронирование)
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const id = uuidv4();

    // Проверка доступности
    const checkStmt = db.prepare(`
      SELECT COUNT(*) as count FROM (
        SELECT check_in, check_out FROM bookings 
        WHERE apartment_id = ? AND status = 'confirmed'
        AND check_in < ? AND check_out > ?
        UNION ALL
        SELECT check_in, check_out FROM external_bookings 
        WHERE apartment_id = ? 
        AND check_in < ? AND check_out > ?
      )
    `);

    const result = checkStmt.get(
      data.apartmentId, data.checkOut, data.checkIn,
      data.apartmentId, data.checkOut, data.checkIn
    ) as { count: number };

    if (result.count > 0) {
      return NextResponse.json({ error: 'Dates are not available' }, { status: 409 });
    }

    // Создание брони
    const stmt = db.prepare(`
      INSERT INTO bookings (
        id, apartment_id, guest_name, guest_phone, guest_email,
        check_in, check_out, guests_count, total_price, status, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.apartmentId,
      data.guestName,
      data.guestPhone,
      data.guestEmail || null,
      data.checkIn,
      data.checkOut,
      data.guestsCount,
      data.totalPrice,
      data.status || 'confirmed',
      'manual'
    );

    // Логируем создание
    db.prepare(`
      INSERT INTO booking_history (id, booking_id, action, new_value, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(uuidv4(), id, 'create', JSON.stringify(data), 'admin');

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}