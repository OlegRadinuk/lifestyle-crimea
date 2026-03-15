import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    console.log('🔍 API GET called for ID:', id);
    
    // Получаем конкретный апартамент по ID
    const apartment = db.prepare(`
      SELECT * FROM apartments WHERE id = ?
    `).get(id) as any;
    
    if (!apartment) {
      console.log('❌ Apartment not found:', id);
      return NextResponse.json({ error: 'Apartment not found' }, { status: 404 });
    }

    // Получаем количество фото
    let imagesCount = 0;
    try {
      const count = db.prepare(`
        SELECT COUNT(*) as count FROM apartment_images WHERE apartment_id = ?
      `).get(id) as { count: number };
      imagesCount = count?.count || 0;
    } catch (e) {
      console.log('⚠️ Error getting images count:', e);
    }

    // Парсим JSON поля
    let features = [];
    try {
      features = apartment.features ? JSON.parse(apartment.features) : [];
    } catch (e) {
      console.log('⚠️ Error parsing features:', e);
    }

    let images = [];
    try {
      images = apartment.images ? JSON.parse(apartment.images) : [];
    } catch (e) {
      console.log('⚠️ Error parsing images:', e);
    }

    const formattedApartment = {
      id: apartment.id,
      title: apartment.title,
      short_description: apartment.short_description,
      description: apartment.description,
      max_guests: apartment.max_guests,
      area: apartment.area,
      price_base: Number(apartment.price_base),
      view: apartment.view || 'sea',
      has_terrace: Boolean(apartment.has_terrace),
      features: features,
      images: images,
      is_active: Boolean(apartment.is_active),
      images_count: imagesCount,
      created_at: apartment.created_at,
      updated_at: apartment.updated_at,
    };

    console.log('✅ Sending apartment:', formattedApartment);
    
    return NextResponse.json(formattedApartment);
    
  } catch (error) {
    console.error('❌ Error fetching apartment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch apartment' }, 
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const data = await request.json();
    console.log('📝 Updating apartment:', id, data);
    
    const updates: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) {
      updates.push('title = ?');
      values.push(data.title);
    }

    if (data.short_description !== undefined) {
      updates.push('short_description = ?');
      values.push(data.short_description);
    }

    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }

    if (data.max_guests !== undefined) {
      updates.push('max_guests = ?');
      values.push(data.max_guests);
    }

    if (data.area !== undefined) {
      updates.push('area = ?');
      values.push(data.area);
    }

    if (data.price_base !== undefined) {
      updates.push('price_base = ?');
      values.push(data.price_base);
    }

    if (data.view !== undefined) {
      updates.push('view = ?');
      values.push(data.view);
    }

    if (data.has_terrace !== undefined) {
      updates.push('has_terrace = ?');
      values.push(data.has_terrace ? 1 : 0);
    }

    if (data.features !== undefined) {
      updates.push('features = ?');
      values.push(JSON.stringify(data.features));
    }

    if (data.images !== undefined) {
      updates.push('images = ?');
      values.push(JSON.stringify(data.images));
    }

    if (data.is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(data.is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE apartments SET ${updates.join(', ')} WHERE id = ?`;
    console.log('📝 SQL:', query);
    
    db.prepare(query).run(...values);

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('❌ Error updating apartment:', error);
    return NextResponse.json(
      { error: 'Failed to update apartment' }, 
      { status: 500 }
    );
  }
}