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
      SELECT * FROM apartments ORDER BY title
    `).all();

    // Преобразуем JSON поля
    const formatted = apartments.map((apt: any) => ({
      ...apt,
      features: apt.features ? JSON.parse(apt.features) : [],
      images: apt.images ? JSON.parse(apt.images) : [],
      is_active: Boolean(apt.is_active),
      has_terrace: Boolean(apt.has_terrace),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching apartments:', error);
    return NextResponse.json({ error: 'Failed to fetch apartments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const id = uuidv4();

    const stmt = db.prepare(`
      INSERT INTO apartments (
        id, title, short_description, description, max_guests,
        area, price_base, view, has_terrace, features, images, is_active,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    stmt.run(
      id,
      data.title || '',
      data.short_description || null,
      data.description || null,
      data.max_guests || 2,
      data.area || null,
      data.price_base || 0,
      data.view || 'sea',
      data.has_terrace ? 1 : 0,
      data.features ? JSON.stringify(data.features) : '[]',
      data.images ? JSON.stringify(data.images) : '[]',
      data.is_active ? 1 : 0,
    );

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error creating apartment:', error);
    return NextResponse.json({ error: 'Failed to create apartment' }, { status: 500 });
  }
}