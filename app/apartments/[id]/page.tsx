import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import ApartmentDetails from './ApartmentDetails';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ApartmentPage({ params }: PageProps) {
  const { id } = await params;

  const apartment = db.prepare(`
    SELECT * FROM apartments WHERE id = ? AND is_active = 1
  `).get(id);

  if (!apartment) {
    notFound();
  }

  // Парсим JSON поля
  const formattedApartment = {
    ...apartment,
    features: apartment.features ? JSON.parse(apartment.features) : [],
    images: apartment.images ? JSON.parse(apartment.images) : [],
  };

  return <ApartmentDetails apartment={formattedApartment} />;
}