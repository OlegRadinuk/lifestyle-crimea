import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import ApartmentForm from './ApartmentForm';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ApartmentEditPage({ params }: PageProps) {
  const { id } = await params;

  // Получаем данные апартамента
  const apartment = db.prepare('SELECT * FROM apartments WHERE id = ?').get(id) as any;

  if (!apartment) {
    notFound();
  }

  // Преобразуем JSON строки обратно в массивы
  const formattedApartment = {
    ...apartment,
    features: apartment.features ? JSON.parse(apartment.features) : [],
    images: apartment.images ? JSON.parse(apartment.images) : [],
    has_terrace: Boolean(apartment.has_terrace),
    is_active: Boolean(apartment.is_active),
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Редактирование: {formattedApartment.title}</h1>
        <Link href="/admin/apartments" className="admin-button">← Назад</Link>
      </div>

      {formattedApartment && (
        <ApartmentForm apartment={formattedApartment} />
      )}
    </div>
  );
}