import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Получаем апартаменты, у которых есть панорама + добавляем price_base
    const apartments = db.prepare(`
      SELECT id, title, panorama_image, max_guests, price_base
      FROM apartments 
      WHERE is_active = 1 AND panorama_image IS NOT NULL AND panorama_image != ''
      ORDER BY sort_order
    `).all();

    // Если нет апартаментов с панорамами, возвращаем пустой массив
    if (!apartments || apartments.length === 0) {
      return NextResponse.json([]);
    }

    // Форматируем данные для панорамы
    const panoramas = apartments.map((apt: any) => {
      // Формируем путь к изображению панорамы
      const imagePath = apt.panorama_image.startsWith('/') 
        ? apt.panorama_image 
        : `/panoramas/${apt.panorama_image}`;

      return {
        id: apt.id,
        title: apt.title,
        image: imagePath,
        maxGuests: apt.max_guests,
        price_base: apt.price_base, // ← ДОБАВИЛИ
        meta: [
          `До ${apt.max_guests} гостей`,
          'Вид на море',
          'Премиум класс'
        ]
      };
    });

    return NextResponse.json(panoramas);
  } catch (error) {
    console.error('Error fetching panoramas:', error);
    return NextResponse.json({ error: 'Failed to fetch panoramas' }, { status: 500 });
  }
}