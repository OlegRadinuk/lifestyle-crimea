import { notFound } from 'next/navigation';
import { APARTMENTS } from '@/data/apartments';
import ClientApartmentWrapper from './ClientApartmentWrapper';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ApartmentPage({ params }: PageProps) {
  const { id } = await params;

  // Ищем апартамент в статических данных
  const apartment = APARTMENTS.find(a => a.id === id);

  if (!apartment) {
    notFound();
  }

  return <ClientApartmentWrapper apartment={apartment} />;
}