import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import ApartmentClient from './ApartmentClient';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ApartmentPage({ params }: PageProps) {
  const { id } = await params;

  const apartment = db.prepare(`
    SELECT * FROM apartments WHERE id = ?
  `).get(id) as any;

  if (!apartment) {
    notFound();
  }

  // Преобразуем JSON-поля
  const formatted = {
    ...apartment,
    features: apartment.features ? JSON.parse(apartment.features) : [],
    images: apartment.images ? JSON.parse(apartment.images) : [],
    has_terrace: Boolean(apartment.has_terrace),
    is_active: Boolean(apartment.is_active),
  };

  return <ApartmentClient apartment={formatted} />;
}