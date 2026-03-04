import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const apartment = db.prepare(`
      SELECT * FROM apartments WHERE id = ? AND is_active = 1
    `).get(id) as any;

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
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching apartment:', error);
    return NextResponse.json({ error: 'Failed to fetch apartment' }, { status: 500 });
  }
}