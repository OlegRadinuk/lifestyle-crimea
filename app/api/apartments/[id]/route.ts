import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Получаем апартамент из БД (без проверки is_active, чтобы видеть даже неактивные)
    const apartment = db.prepare(`
      SELECT * FROM apartments WHERE id = ?
    `).get(id) as any;

    if (!apartment) {
      return NextResponse.json(
        { error: 'Apartment not found' }, 
        { status: 404 }
      );
    }

    // Получаем фото из таблицы apartment_images (управляется через админку)
    let images: string[] = [];
    try {
      const imageRows = db.prepare(`
        SELECT url FROM apartment_images
        WHERE apartment_id = ?
        ORDER BY sort_order
      `).all(id);
      images = imageRows.map((img: any) => img.url);
    } catch (e) {
      images = [];
    }

    // Форматируем данные
    const formatted = {
      id: apartment.id,
      title: apartment.title,
      short_description: apartment.short_description,
      description: apartment.description,
      max_guests: apartment.max_guests,
      area: apartment.area,
      price_base: Number(apartment.price_base),
      view: apartment.view,
      has_terrace: Boolean(apartment.has_terrace),
      features: apartment.features ? JSON.parse(apartment.features) : [],
      images: images,
      is_active: Boolean(apartment.is_active),
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching apartment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch apartment' }, 
      { status: 500 }
    );
  }
}