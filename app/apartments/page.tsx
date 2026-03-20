import { Metadata } from 'next';
import { db } from '@/lib/db';
import { ApartmentClient } from '@/lib/types';
import ApartmentsClient from './ApartmentsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export const metadata: Metadata = {
  title: 'Все апартаменты в Алуште | Каталог номеров | Life Style Crimea',
  description: '38 дизайнерских апартаментов в Алуште. Студии и номера с отдельной спальней. Вид на море, террасы, полностью укомплектованы. Выберите идеальный вариант для отдыха.',
  keywords: 'апартаменты алушта, каталог апартаментов, снять апартаменты, апартаменты с видом на море, студия алушта',
  alternates: {
    canonical: 'https://lovelifestyle.ru/apartments',
  },
};

interface ApartmentRow {
  id: string;
  title: string;
  short_description: string | null;
  description: string | null;
  max_guests: number;
  area: number | null;
  price_base: number;
  view: string | null;
  has_terrace: number;
  is_active: number;
  features: string | null;
  images: string | null;
  created_at: string;
  updated_at: string;
}

export default async function ApartmentsPage() {
  const apartments = db.prepare(`
    SELECT * FROM apartments WHERE is_active = 1 ORDER BY price_base ASC
  `).all() as ApartmentRow[];

  const formattedApartments: ApartmentClient[] = await Promise.all(
    apartments.map(async (apt) => {
      let images: string[] = [];
      
      try {
        const imageRows = db.prepare(`
          SELECT url FROM apartment_images 
          WHERE apartment_id = ? 
          ORDER BY sort_order
        `).all(apt.id);
        images = imageRows.map((img: any) => img.url);
      } catch (e) {
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
        price_base: apt.price_base,
        view: apt.view,
        has_terrace: Boolean(apt.has_terrace),
        is_active: Boolean(apt.is_active),
        features: apt.features ? JSON.parse(apt.features) : [],
        images: images.length > 0 ? images : ['/images/placeholder.jpg'],
        created_at: apt.created_at,
        updated_at: apt.updated_at,
      };
    })
  );

  return <ApartmentsClient initialApartments={formattedApartments} key={Date.now()} />;
}