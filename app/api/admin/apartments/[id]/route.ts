import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

type RawApartment = {
  id: string;
  title: string;
  short_description: string | null;
  description: string | null;
  max_guests: number;
  area: number | null;
  price_base: number;
  view: string;
  has_terrace: number;
  features: string | null;
  images: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const apartment = db.prepare('SELECT * FROM apartments WHERE id = ?').get(id) as RawApartment | undefined;
    
    if (!apartment) {
      return NextResponse.json({ error: 'Apartment not found' }, { status: 404 });
    }

    // Преобразуем JSON поля
    const formatted = {
      id: apartment.id,
      title: apartment.title,
      short_description: apartment.short_description,
      description: apartment.description,
      max_guests: apartment.max_guests,
      area: apartment.area,
      price_base: apartment.price_base,
      view: apartment.view,
      has_terrace: Boolean(apartment.has_terrace),
      features: apartment.features ? JSON.parse(apartment.features) : [],
      images: apartment.images ? JSON.parse(apartment.images) : [],
      is_active: Boolean(apartment.is_active),
      created_at: apartment.created_at,
      updated_at: apartment.updated_at,
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching apartment:', error);
    return NextResponse.json({ error: 'Failed to fetch apartment' }, { status: 500 });
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
    db.prepare(query).run(...values);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating apartment:', error);
    return NextResponse.json({ error: 'Failed to update apartment' }, { status: 500 });
  }
}