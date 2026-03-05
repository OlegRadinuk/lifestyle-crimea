import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import ClientApartmentWrapper from './ClientApartmentWrapper';

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

  // Преобразуем в формат, совместимый с Hero
  const formattedApartment = {
    id: apartment.id,
    title: apartment.title,
    shortDescription: apartment.short_description || '',
    description: apartment.description || '',
    maxGuests: apartment.max_guests,
    area: apartment.area || 0,
    priceBase: apartment.price_base,
    view: apartment.view || 'sea',
    hasTerrace: Boolean(apartment.has_terrace),
    features: apartment.features ? JSON.parse(apartment.features) : [],
    images: apartment.images ? JSON.parse(apartment.images) : ['/images/placeholder.jpg'],
  };

  return <ClientApartmentWrapper apartment={formattedApartment} />;
}