import { db } from '@/lib/db';
import { ApartmentClient } from '@/lib/types';
import ApartmentsClient from './ApartmentsClient';

// ОТКЛЮЧАЕМ статическую генерацию
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
  // Загружаем ТОЛЬКО активные апартаменты из БД
  const apartments = db.prepare(`
    SELECT * FROM apartments WHERE is_active = 1 ORDER BY price_base ASC
  `).all() as ApartmentRow[];

  // Преобразуем в соответствии с типом ApartmentClient
  const formattedApartments: ApartmentClient[] = apartments.map(apt => ({
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
    images: apt.images ? JSON.parse(apt.images) : ['/images/placeholder.jpg'],
    created_at: apt.created_at,
    updated_at: apt.updated_at
  }));

  return <ApartmentsClient initialApartments={formattedApartments} />;
}