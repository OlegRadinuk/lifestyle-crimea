import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { db } from '@/lib/db';
import ClientApartmentWrapper from './ClientApartmentWrapper';

type PageProps = {
  params: Promise<{ id: string }>;
};

// ISR: пере-генерируем страницу раз в сутки (данные апартамента меняются редко)
// Для реального времени (наличие, цены) используется клиентский API
export const revalidate = 86400;

// Пре-генерируем все активные страницы апартаментов при сборке
export async function generateStaticParams() {
  const apartments = db.prepare(
    "SELECT id FROM apartments WHERE is_active = 1 AND (deleted_at IS NULL OR deleted_at = '')"
  ).all() as { id: string }[];
  return apartments.map((a) => ({ id: a.id }));
}

// Функция для генерации мета-тегов
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  const apartment = db.prepare(`
    SELECT title, short_description, description, max_guests, area, view, features, price_base
    FROM apartments WHERE id = ? AND is_active = 1 AND (deleted_at IS NULL OR deleted_at = '')
  `).get(id) as any;

  if (!apartment) {
    return {
      title: 'Апартамент не найден',
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

  // Человекочитаемое название (убираем LS- префикс для title)
  const displayName = apartment.title.replace(/^LS-(?:LUX-|ART-)?/i, '').trim();

  /* Title ведёт ЗАПРОСОМ, а не внутренним именем.
     Было: «Апартаменты «SPACE» с видом на море | 36 м² | Алушта» — первые
     слова тайтла весят больше всего, а «SPACE»/«COFFEE ICE CREAM» никто не
     ищет: это наши артикулы, а не язык гостя. Стало: сначала то, что человек
     набирает («апартаменты с видом на море в Алуште»), потом площадь и число
     гостей — они же различают карточки между собой, — и лишь в конце имя.
     `absolute` — чтобы шаблон layout не дописывал хвост и не резал длину
     (в выдаче видно ~60-70 символов). Этаж НЕ берём: поле floor у всех 44
     равно 1 (никогда не заполнялось), реальный этаж есть только в тексте. */
  const title = {
    absolute: `Апартаменты ${viewText} в Алуште, ${apartment.area} м² — «${displayName}»`,
  };

  // Формируем description — используем short_description из БД если есть
  let description: string;
  if (apartment.short_description) {
    description = apartment.short_description.length > 155
      ? apartment.short_description.slice(0, 152) + '...'
      : apartment.short_description;
  } else {
    const topFeatures = featuresList.slice(0, 3).join(', ');
    description = `Апартаменты в Алуште ${viewText}. ${apartment.area} м², до ${apartment.max_guests} гостей.`;
    if (topFeatures) description += ` ${topFeatures}.`;
    description += ` Бронирование напрямую, лучшие цены.`;
    if (description.length > 155) description = description.slice(0, 152) + '...';
  }

  /* Ключевые слова — язык гостя, а не наши артикулы.
     Было `апартаменты space алушта` и `стиль жизни с любовью` — таких запросов
     не существует. Цель карточки — длинный хвост («апартаменты 36 м² с видом
     на море Алушта»), голову («апартаменты Алушта») тянут / и /apartments. */
  const keywords = [
    `апартаменты ${viewText} алушта`,
    `апартаменты в алуште на ${apartment.max_guests} гостей`,
    `апартаменты ${apartment.area} м² алушта`,
    'снять апартаменты в алуште посуточно',
    'апартаменты у моря алушта',
    ...featuresList.slice(0, 4),
  ].join(', ');

  return {
    title,
    description,
    keywords,
    openGraph: {
      title: title.absolute,
      description,
      type: 'website',
      locale: 'ru_RU',
      siteName: 'Стиль Жизни, Алушта',
      url: `https://lovelifestyle.ru/apartments/${id}`,
      images: [
        {
          url: `https://lovelifestyle.ru/images/apartments/${id}/1.webp`,
          width: 1200,
          height: 630,
          alt: `Апартаменты ${displayName} ${viewText} — Алушта, апарт-отель «Стиль Жизни»`,
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
    SELECT * FROM apartments WHERE id = ? AND is_active = 1 AND (deleted_at IS NULL OR deleted_at = '')
  `).get(id) as any;

  if (!apartment) {
    notFound();
  }

  // Получаем фото из таблицы apartment_images (управляется через админку)
  let images: string[] = [];
  try {
    const imageRows = db.prepare(`
      SELECT url FROM apartment_images
      WHERE apartment_id = ?
      ORDER BY sort_order
    `).all(id);
    images = imageRows.map((img: any) => img.url);
  } catch (e) {
    images = [];
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
    images: images,
    is_active: Boolean(apartment.is_active),
  };

  const viewLabels: Record<string, string> = {
    sea: 'вид на море',
    mountain: 'вид на горы',
    city: 'вид на город',
    garden: 'вид во двор',
    mixed: 'вид на море и горы',
  };

  const roomSchema = {
    '@context': 'https://schema.org',
    '@type': 'HotelRoom',
    name: apartment.title,
    description: apartment.short_description || apartment.description,
    url: `https://lovelifestyle.ru/apartments/${id}`,
    image: formattedApartment.images[0]
      ? `https://lovelifestyle.ru${formattedApartment.images[0]}`
      : 'https://lovelifestyle.ru/og-image.jpg',
    occupancy: {
      '@type': 'QuantitativeValue',
      maxValue: apartment.max_guests,
    },
    floorSize: {
      '@type': 'QuantitativeValue',
      value: apartment.area,
      unitCode: 'MTK',
    },
    bed: {
      '@type': 'BedDetails',
      numberOfBeds: 1,
    },
    amenityFeature: [
      { '@type': 'LocationFeatureSpecification', name: viewLabels[apartment.view] || 'вид на море', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Бесплатный Wi-Fi', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Кондиционер', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Кухня', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Балкон', value: Boolean(apartment.has_terrace) },
    ],
    containedInPlace: {
      '@type': 'Hotel',
      name: 'Life Style Crimea',
      url: 'https://lovelifestyle.ru',
      telephone: '8 800 777 63 08',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Западная ул., 4',
        addressLocality: 'Алушта',
        addressRegion: 'Республика Крым',
        addressCountry: 'RU',
      },
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Главная',
        item: 'https://lovelifestyle.ru',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Апартаменты',
        item: 'https://lovelifestyle.ru/apartments',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: apartment.title,
        item: `https://lovelifestyle.ru/apartments/${id}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([roomSchema, breadcrumbSchema]) }}
      />
      <ClientApartmentWrapper key={id} apartment={formattedApartment} />
    </>
  );
}