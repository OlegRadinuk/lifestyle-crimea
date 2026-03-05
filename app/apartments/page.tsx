import { db } from '@/lib/db';
import ApartmentsClient from './ApartmentsClient';

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
  features: string | null;
  images: string | null;
}

export default async function ApartmentsPage() {
  // Загружаем ТОЛЬКО активные апартаменты из БД
  const apartments = db.prepare(`
    SELECT * FROM apartments WHERE is_active = 1 ORDER BY price_base ASC
  `).all() as ApartmentRow[];

  // Преобразуем JSON строки в массивы
  const formattedApartments = apartments.map(apt => ({
    ...apt,
    features: apt.features ? JSON.parse(apt.features) : [],
    images: apt.images ? JSON.parse(apt.images) : ['/images/placeholder.jpg'],
    hasTerrace: Boolean(apt.has_terrace),
    priceBase: apt.price_base,
    maxGuests: apt.max_guests,
    shortDescription: apt.short_description || '',
    view: (apt.view as 'sea' | 'city' | 'garden') || 'sea',
  }));

  return <ApartmentsClient initialApartments={formattedApartments} />;
}