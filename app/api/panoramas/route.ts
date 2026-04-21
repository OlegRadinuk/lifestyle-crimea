import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Получаем апартаменты, у которых есть панорама
    const apartments = db.prepare(`
      SELECT id, title, panorama_image, max_guests, price_base, area, view
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

      const viewLabel =
        apt.view === 'sea' ? 'Вид на море'
        : apt.view === 'mountain' ? 'Вид на горы'
        : 'Тихий дворик';

      const meta = [
        `До ${apt.max_guests} гостей`,
        apt.area ? `${apt.area} м²` : null,
        viewLabel,
      ].filter(Boolean) as string[];

      return {
        id: apt.id,
        title: apt.title,
        image: imagePath,
        maxGuests: apt.max_guests,
        price_base: apt.price_base,
        meta,
      };
    });

    return NextResponse.json(panoramas);
  } catch (error) {
    console.error('Error fetching panoramas:', error);
    return NextResponse.json({ error: 'Failed to fetch panoramas' }, { status: 500 });
  }
}
