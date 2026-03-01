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

    // Преобразуем JSON строки
    const formatted = {
      id: apartment.id,
      title: apartment.title,
      short_description: apartment.short_description,
      description: apartment.description,
      max_guests: apartment.max_guests,
      area: apartment.area,
      price_base: apartment.price_base,
      view: apartment.view,
      has_terrace: apartment.has_terrace === 1,
      features: apartment.features ? JSON.parse(apartment.features) : [],
      images: apartment.images ? JSON.parse(apartment.images) : [],
      is_active: apartment.is_active === 1,
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

    const fields = [
      'title', 'short_description', 'description', 'max_guests',
      'area', 'price_base', 'view', 'has_terrace', 'features', 'images', 'is_active'
    ];

    fields.forEach(field => {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        
        if (field === 'features' || field === 'images') {
          values.push(JSON.stringify(data[field]));
        } else if (field === 'has_terrace' || field === 'is_active') {
          values.push(data[field] ? 1 : 0);
        } else {
          values.push(data[field]);
        }
      }
    });

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