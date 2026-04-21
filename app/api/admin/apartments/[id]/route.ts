import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkAdminAuth } from '@/lib/admin-auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

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
      breakfast_price: Number(apartment.breakfast_price || 0),
      view: apartment.view || 'sea',
      has_terrace: Boolean(apartment.has_terrace),
      features: features,
      images: images,
      is_active: Boolean(apartment.is_active),
      sort_order: Number(apartment.sort_order || 0),
      images_count: imagesCount,
      hot_deal_enabled: Boolean(apartment.hot_deal_enabled),
      hot_deal_discount: Number(apartment.hot_deal_discount ?? 10),
      lunch_price: Number(apartment.lunch_price || 0),
      dinner_price: Number(apartment.dinner_price || 0),
      custom_meal_description: apartment.custom_meal_description || '',
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
  const authError = checkAdminAuth(request);
  if (authError) return authError;

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

    if (data.breakfast_price !== undefined) {
      updates.push('breakfast_price = ?');
      values.push(data.breakfast_price);
    }

    if (data.sort_order !== undefined) {
      updates.push('sort_order = ?');
      values.push(data.sort_order);
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

    if (data.hot_deal_enabled !== undefined) {
      updates.push('hot_deal_enabled = ?');
      values.push(data.hot_deal_enabled ? 1 : 0);
    }

    if (data.hot_deal_discount !== undefined) {
      updates.push('hot_deal_discount = ?');
      values.push(Number(data.hot_deal_discount));
    }

    if (data.lunch_price !== undefined) {
      updates.push('lunch_price = ?');
      values.push(data.lunch_price);
    }

    if (data.dinner_price !== undefined) {
      updates.push('dinner_price = ?');
      values.push(data.dinner_price);
    }

    if (data.custom_meal_description !== undefined) {
      updates.push('custom_meal_description = ?');
      values.push(data.custom_meal_description);
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const apartment = db.prepare('SELECT id FROM apartments WHERE id = ? AND deleted_at IS NULL').get(id);
    if (!apartment) {
      return NextResponse.json({ error: 'Apartment not found' }, { status: 404 });
    }

    db.prepare('UPDATE apartments SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting apartment:', error);
    return NextResponse.json({ error: 'Failed to delete apartment' }, { status: 500 });
  }
}