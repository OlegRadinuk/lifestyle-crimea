import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const simple = searchParams.get('simple') === 'true';

  try {
    if (simple) {
      // Для выпадающих списков - только id и название
      const apartments = db.prepare(`
        SELECT id, title FROM apartments ORDER BY title
      `).all();
      return NextResponse.json(apartments);
    }

    // Полный список для админки
    const apartments = db.prepare(`
      SELECT * FROM apartments ORDER BY title
    `).all();

    // Добавляем количество фото для каждого
    const formatted = await Promise.all(apartments.map(async (apt: any) => {
      // Получаем количество фото
      let imagesCount = 0;
      try {
        const count = db.prepare(`
          SELECT COUNT(*) as count FROM apartment_images WHERE apartment_id = ?
        `).get(apt.id) as { count: number };
        imagesCount = count?.count || 0;
      } catch (e) {
        console.log('Error getting images count:', e);
      }

      return {
        id: apt.id,
        title: apt.title,
        short_description: apt.short_description,
        max_guests: apt.max_guests,
        price_base: Number(apt.price_base),
        is_active: Boolean(apt.is_active),
        images_count: imagesCount,
        created_at: apt.created_at,
        updated_at: apt.updated_at,
      };
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching apartments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch apartments' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const id = uuidv4();

    console.log('🏗️ Creating new apartment:', data);

    // Значения по умолчанию
    const title = data.title || 'Новый апартамент';
    const max_guests = data.max_guests || 2;
    const price_base = data.price_base || 5000;
    const view = data.view || 'sea';
    const has_terrace = data.has_terrace ? 1 : 0;
    const is_active = data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1;
    const features = data.features ? JSON.stringify(data.features) : '[]';
    const images = data.images ? JSON.stringify(data.images) : '[]';

    const stmt = db.prepare(`
      INSERT INTO apartments (
        id, title, short_description, description, max_guests,
        area, price_base, view, has_terrace, features, images, is_active,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    stmt.run(
      id,
      title,
      data.short_description || null,
      data.description || null,
      max_guests,
      data.area || null,
      price_base,
      view,
      has_terrace,
      features,
      images,
      is_active
    );

    console.log('✅ Apartment created with ID:', id);

    return NextResponse.json({ 
      success: true, 
      id,
      message: 'Апартамент успешно создан'
    });
    
  } catch (error) {
    console.error('❌ Error creating apartment:', error);
    return NextResponse.json(
      { error: 'Failed to create apartment' }, 
      { status: 500 }
    );
  }
}