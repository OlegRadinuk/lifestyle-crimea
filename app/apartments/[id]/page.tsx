import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { ApartmentClient } from '@/lib/types';
import ApartmentDetails from './ApartmentDetails';

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

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ApartmentPage({ params }: PageProps) {
  const { id } = await params;

  const apartment = db.prepare(`
    SELECT * FROM apartments WHERE id = ? AND is_active = 1
  `).get(id) as ApartmentRow | undefined;

  if (!apartment) {
    notFound();
  }

  // Преобразуем в клиентский формат
  const formattedApartment: ApartmentClient = {
    ...apartment,
    has_terrace: Boolean(apartment.has_terrace),
    is_active: Boolean(apartment.is_active),
    features: apartment.features ? JSON.parse(apartment.features) : [],
    images: apartment.images ? JSON.parse(apartment.images) : ['/images/placeholder.jpg'],
  };

  return <ApartmentDetails apartment={formattedApartment} />;
}