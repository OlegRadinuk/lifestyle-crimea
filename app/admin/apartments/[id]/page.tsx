import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import ApartmentForm from './ApartmentForm';

type PageProps = {
  params: Promise<{ id: string }>;
};

// Server Action для сохранения
async function saveApartment(formData: FormData) {
  'use server';
  
  const id = formData.get('id') as string;
  
  const updates: string[] = [];
  const values: any[] = [];

  const fields = [
    'title', 'short_description', 'description', 'max_guests',
    'area', 'price_base', 'view', 'has_terrace', 'is_active'
  ];

  fields.forEach(field => {
    const value = formData.get(field);
    if (value !== null) {
      updates.push(`${field} = ?`);
      
      if (field === 'has_terrace' || field === 'is_active') {
        values.push(value === 'on' ? 1 : 0);
      } else if (field === 'max_guests' || field === 'area' || field === 'price_base') {
        values.push(Number(value));
      } else {
        values.push(value);
      }
    }
  });

  // Особенности (features) приходят как массив
  const features = formData.getAll('features[]');
  updates.push('features = ?');
  values.push(JSON.stringify(features));

  // Изображения (пока заглушка)
  updates.push('images = ?');
  values.push(JSON.stringify([]));

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  const query = `UPDATE apartments SET ${updates.join(', ')} WHERE id = ?`;
  db.prepare(query).run(...values);

  revalidatePath(`/admin/apartments/${id}`);
  redirect(`/admin/apartments/${id}?success=true`);
}

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
        <ApartmentForm apartment={formattedApartment} action={saveApartment} />
      )}
    </div>
  );
}