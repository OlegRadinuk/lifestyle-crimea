import { notFound } from 'next/navigation';
import { APARTMENTS } from '@/data/apartments';
import ClientApartmentWrapper from './ClientApartmentWrapper';
import './apartment.css';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  const apartment = APARTMENTS.find(a => a.id === id);

  if (!apartment) notFound();

  return <ClientApartmentWrapper apartment={apartment} />;
}