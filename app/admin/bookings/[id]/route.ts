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
      JOIN apartments a ON b.apartment_id = a.id
      WHERE b.id = ?
    `).get(id);

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json(booking);
  } catch (error) {
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
    
    const updates: string[] = [];
    const values: any[] = [];

    if (data.status) {
      updates.push('status = ?');
      values.push(data.status);
    }

    if (data.prepaid_amount !== undefined) {
      updates.push('prepaid_amount = ?');
      values.push(data.prepaid_amount);
    }

    if (data.prepaid_status) {
      updates.push('prepaid_status = ?');
      values.push(data.prepaid_status);
    }

    if (data.manager_notes !== undefined) {
      updates.push('manager_notes = ?');
      values.push(data.manager_notes);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    
    const query = `UPDATE bookings SET ${updates.join(', ')} WHERE id = ?`;
    values.push(id);

    db.prepare(query).run(...values);

    // Логируем изменение
    db.prepare(`
      INSERT INTO booking_history (id, booking_id, action, new_value, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(uuidv4(), id, 'update', JSON.stringify(data), 'admin');

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    db.prepare('DELETE FROM bookings WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 });
  }
}