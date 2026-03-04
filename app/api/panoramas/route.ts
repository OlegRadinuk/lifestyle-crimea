import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const apartments = db.prepare(`
      SELECT id, title, max_guests, area, has_terrace, features 
      FROM apartments 
      WHERE is_active = 1
      ORDER BY price_base ASC
    `).all() as any[];

    const panoramas = apartments.map(apt => {
      const features = apt.features ? JSON.parse(apt.features) : [];
      
      return {
        id: apt.id,
        title: apt.title,
        image: `/panoramas/${apt.id}.webp`,
        maxGuests: apt.max_guests,
        meta: [
          `До ${apt.max_guests} гостей`,
          apt.area ? `${apt.area} м²` : null,
          ...features.slice(0, 2),
          apt.has_terrace ? 'Терраса' : null,
        ].filter(Boolean),
      };
    });

    return NextResponse.json(panoramas);
  } catch (error) {
    console.error('Error fetching panoramas:', error);
    return NextResponse.json({ error: 'Failed to fetch panoramas' }, { status: 500 });
  }
}