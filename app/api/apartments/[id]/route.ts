import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Убираем условие is_active = 1
    const apartment = db.prepare(`
      SELECT * FROM apartments WHERE id = ?
    `).get(id) as any;

    if (!apartment) {
      return NextResponse.json({ error: 'Apartment not found' }, { status: 404 });
    }

    // Получаем изображения апартамента из отдельной таблицы (если есть)
    let images = [];
    try {
      images = db.prepare(`
        SELECT url FROM apartment_images 
        WHERE apartment_id = ? 
        ORDER BY sort_order
      `).all(id).map((img: any) => img.url);
    } catch (e) {
      // Если таблицы нет или ошибка, используем images из JSON поля
      if (apartment.images) {
        try {
          images = JSON.parse(apartment.images);
        } catch (e) {
          images = [];
        }
      }
    }

    // Преобразуем JSON поля
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
      panorama_image: apartment.panorama_image || null,
      is_active: Boolean(apartment.is_active),
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching apartment:', error);
    return NextResponse.json({ error: 'Failed to fetch apartment' }, { status: 500 });
  }
}