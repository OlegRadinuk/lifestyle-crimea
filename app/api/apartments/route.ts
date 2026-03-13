import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ОТКЛЮЧАЕМ кэширование
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    // Получаем все активные апартаменты
    const apartments = db.prepare(`
      SELECT * FROM apartments WHERE is_active = 1 ORDER BY price_base ASC
    `).all();

    // Для каждого апартамента получаем фото
    const formatted = await Promise.all(apartments.map(async (apt: any) => {
      // Получаем фото из отдельной таблицы
      let images: string[] = [];
      try {
        const imageRows = db.prepare(`
          SELECT url FROM apartment_images 
          WHERE apartment_id = ? 
          ORDER BY sort_order
        `).all(apt.id);
        
        images = imageRows.map((img: any) => img.url);
      } catch (e) {
        // Если таблицы нет или ошибка, пробуем получить из JSON поля
        if (apt.images) {
          try {
            images = JSON.parse(apt.images);
          } catch (e) {
            images = [];
          }
        }
      }

      return {
        id: apt.id,
        title: apt.title,
        short_description: apt.short_description,
        description: apt.description,
        max_guests: apt.max_guests,
        area: apt.area,
        price_base: Number(apt.price_base),
        view: apt.view,
        has_terrace: Boolean(apt.has_terrace),
        features: apt.features ? JSON.parse(apt.features) : [],
        images: images.length > 0 ? images : ['/images/placeholder.jpg'],
        is_active: Boolean(apt.is_active),
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