import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { db } from '@/lib/db';
import ClientApartmentWrapper from './ClientApartmentWrapper';

type PageProps = {
  params: Promise<{ id: string }>;
};

// Отключаем кэширование
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Функция для генерации мета-тегов
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  const apartment = db.prepare(`
    SELECT title, short_description, description, max_guests, area, view, features, price_base
    FROM apartments WHERE id = ? AND is_active = 1
  `).get(id) as any;

  if (!apartment) {
    return {
      title: 'Апартамент не найден | Life Style Crimea',
      robots: { index: false },
    };
  }

  // Парсим features если есть
  let featuresList: string[] = [];
  try {
    featuresList = apartment.features ? JSON.parse(apartment.features) : [];
  } catch (e) {
    featuresList = [];
  }

  // Определяем текст вида
  const viewMap: Record<string, string> = {
    sea: 'с видом на море',
    mountain: 'с видом на горы',
    city: 'с видом на город',
    garden: 'с видом во двор',
    mixed: 'с видом на море и горы',
  };
  const viewText = viewMap[apartment.view] || 'с видом на море';

  // Формируем ключевые особенности для description (не более 3)
  const topFeatures = featuresList.slice(0, 3).join(', ');
  
  // Формируем title
  const title = `${apartment.title} | Апартаменты в Алуште ${viewText} | Life Style Crimea`;

  // Формируем description (макс 160 символов)
  let description = `${apartment.title} в Алуште. ${apartment.area} м², до ${apartment.max_guests} гостей. ${viewText.charAt(0).toUpperCase() + viewText.slice(1)}.`;
  if (topFeatures) {
    description += ` В номере: ${topFeatures}.`;
  }
  description += ` Бронирование онлайн, лучшие цены напрямую.`;

  // Обрезаем если длиннее 155 символов
  if (description.length > 155) {
    description = description.slice(0, 152) + '...';
  }

  // Формируем ключевые слова
  const keywords = [
    apartment.title,
    'апартаменты алушта',
    viewText,
    `апартаменты ${apartment.area} м²`,
    `апартаменты на ${apartment.max_guests} гостей`,
    ...featuresList.slice(0, 5),
    'life style crimea',
    'стиль жизни с любовью',
  ].join(', ');

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'ru_RU',
      images: [
        {
          url: `/images/apartments/${id}/1.webp`,
          width: 1200,
          height: 630,
          alt: apartment.title,
        },
      ],
    },
    alternates: {
      canonical: `https://lovelifestyle.ru/apartments/${id}`,
    },
    robots: {
      index: true,
      follow: true,
      'max-snippet': 150,
      'max-image-preview': 'large',
    },
  };
}

export default async function ApartmentPage({ params }: PageProps) {
  const { id } = await params;

  const apartment = db.prepare(`
    SELECT * FROM apartments WHERE id = ? AND is_active = 1
  `).get(id) as any;

  if (!apartment) {
    notFound();
  }

  // Получаем фото
  let images: string[] = [];
  try {
    const imageRows = db.prepare(`
      SELECT url FROM apartment_images 
      WHERE apartment_id = ? 
      ORDER BY sort_order
    `).all(id);
    images = imageRows.map((img: any) => img.url);
  } catch (e) {
    if (apartment.images) {
      try {
        images = JSON.parse(apartment.images);
      } catch (e) {
        images = [];
      }
    }
  }

  const formattedApartment = {
    id: apartment.id,
    title: apartment.title,
    short_description: apartment.short_description,
    description: apartment.description,
    max_guests: apartment.max_guests,
    area: apartment.area,
    price_base: Number(apartment.price_base),
    view: apartment.view,
    has_terrace: Boolean(apartment.has_terrace),
    features: apartment.features ? JSON.parse(apartment.features) : [],
    images: images.length > 0 ? images : ['/images/placeholder.jpg'],
    is_active: Boolean(apartment.is_active),
  };

  return <ClientApartmentWrapper key={id} apartment={formattedApartment} />;
}