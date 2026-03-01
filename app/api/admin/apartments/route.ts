import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const simple = searchParams.get('simple') === 'true';

  try {
    if (simple) {
      const apartments = db.prepare('SELECT id, title FROM apartments ORDER BY title').all();
      return NextResponse.json(apartments);
    }

    const apartments = db.prepare(`
      SELECT a.*, 
        (SELECT COUNT(*) FROM bookings WHERE apartment_id = a.id AND status = 'confirmed') as bookings_count,
        (SELECT COUNT(*) FROM ics_sources WHERE apartment_id = a.id AND is_active = 1) as sources_count
      FROM apartments a
      ORDER BY a.created_at DESC
    `).all();

    return NextResponse.json(apartments);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch apartments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const id = data.id || uuidv4();

    const stmt = db.prepare(`
      INSERT INTO apartments (id, title, max_guests, price_base, description, short_description, area)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.title,
      data.max_guests,
      data.price_base,
      data.description || null,
      data.short_description || null,
      data.area || null
    );

    // Генерируем токен для экспорта
    const token = uuidv4().replace(/-/g, '');
    db.prepare('INSERT INTO export_tokens (id, apartment_id, token) VALUES (?, ?, ?)').run(
      uuidv4(), id, token
    );

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create apartment' }, { status: 500 });
  }
}