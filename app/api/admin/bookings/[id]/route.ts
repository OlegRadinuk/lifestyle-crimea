import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const booking = db.prepare(`
      SELECT b.*, a.title as apartment_title 
      FROM bookings b
      LEFT JOIN apartments a ON b.apartment_id = a.id
      WHERE b.id = ?
    `).get(id);

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const data = await request.json();
    
    // Проверяем существование брони
    const exists = db.prepare('SELECT id FROM bookings WHERE id = ?').get(id);
    if (!exists) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    
    const updates: string[] = [];
    const values: any[] = [];

    // Разрешенные поля для обновления
    const allowedFields = [
      'status', 'check_in', 'check_out', 'guests_count',
      'total_price', 'guest_name', 'guest_phone', 'guest_email',
      'prepaid_amount', 'prepaid_status', 'manager_notes'
    ];

    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(data[field]);
      }
    });

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE bookings SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...values);

    // Логируем изменение
    try {
      db.prepare(`
        INSERT INTO booking_history (id, booking_id, action, new_value, created_by)
        VALUES (?, ?, ?, ?, ?)
      `).run(uuidv4(), id, 'update', JSON.stringify(data), 'admin');
    } catch (e) {
      // Игнорируем ошибку, если таблицы нет
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const result = db.prepare('DELETE FROM bookings WHERE id = ?').run(id);
    
    if (result.changes === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 });
  }
}