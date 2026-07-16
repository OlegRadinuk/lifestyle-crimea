import type { Metadata } from 'next';
import { db } from '@/lib/db';
import ApartmentsClient from './ApartmentsClient';
import { ApartmentClient } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * У каталога НЕ БЫЛО своих метаданных — он молча наследовал title главной,
 * то есть две самые важные страницы сайта конкурировали за один запрос
 * («апартаменты в Алуште») и мешали друг другу. Здесь целимся в
 * транзакционный интент: человек уже хочет снять и выбирает вариант.
 *
 * Число апартаментов — константа APARTMENTS_COUNT (40), а НЕ COUNT(*) из БД:
 * активных записей 44, но часть из них — мусор/дубли (4 записи с UUID вместо
 * слага, см. риск в паспорте проекта). Пока база не вычищена, динамический
 * счётчик врал бы гостю на 4 апартамента. Вычистим мусор — вернуть COUNT(*).
 * Цену тянем из БД: она меняется по сезонам и обязана быть живой.
 */
const APARTMENTS_COUNT = 40;

export async function generateMetadata(): Promise<Metadata> {
  let minPrice = 0;
  try {
    const row = db.prepare(`
      SELECT MIN(price_base) AS p
      FROM apartments
      WHERE is_active = 1 AND (deleted_at IS NULL OR deleted_at = '')
    `).get() as { p: number | null };
    minPrice = row?.p ?? 0;
  } catch {
    // БД недоступна — отдаём метаданные без цены, страница важнее
  }

  const priceText = minPrice > 0 ? ` от ${minPrice.toLocaleString('ru-RU')} ₽/сутки.` : '';

  const title = 'Снять апартаменты в Алуште посуточно — у моря, с бассейном';
  const description =
    `${APARTMENTS_COUNT} апартаментов у моря в Алуште${priceText} Вид на море, балкон, кухня, до пляжа 650 м. ` +
    'Бассейны круглый год и аквазона. Свободные даты онлайн, бронирование напрямую без комиссии.';

  return {
    title: { absolute: `${title} | «Стиль Жизни»` },
    description,
    keywords:
      'снять апартаменты в алуште, апартаменты алушта посуточно, апартаменты у моря алушта, ' +
      'жильё в алуште посуточно, апартаменты с видом на море алушта, забронировать апартаменты алушта',
    alternates: { canonical: 'https://lovelifestyle.ru/apartments' },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'ru_RU',
      url: 'https://lovelifestyle.ru/apartments',
      siteName: 'Стиль Жизни, Алушта',
      images: [
        {
          url: 'https://lovelifestyle.ru/og-image.jpg',
          width: 1200,
          height: 630,
          alt: 'Апартаменты в Алуште — апарт-отель «Стиль Жизни»',
        },
      ],
    },
    robots: {
      index: true,
      follow: true,
      'max-snippet': 150,
      'max-image-preview': 'large',
    },
  };
}

async function getApartments(): Promise<ApartmentClient[]> {
  try {
    // Получаем все активные апартаменты
    const apartments = db.prepare(`
      SELECT * FROM apartments WHERE is_active = 1 AND deleted_at IS NULL ORDER BY price_base ASC
    `).all();

    // Для каждого апартамента получаем фото
    const formatted = await Promise.all(apartments.map(async (apt: any) => {
      // Получаем фото из отдельной таблицы
      let images: string[] = [];
      try {
        const imageRows = db.prepare(`
          SELECT url FROM apartment_images 
          WHERE apartment_id = ? 
          ORDER BY sort_order
        `).all(apt.id);
        
        images = imageRows.map((img: any) => img.url);
      } catch (e) {
        // Если таблицы нет или ошибка, пробуем получить из JSON поля
        if (apt.images) {
          try {
            images = JSON.parse(apt.images);
          } catch (e) {
            images = [];
          }
        }
      }

      const seasons = db.prepare(
        'SELECT id, name, date_from, date_to, price_per_night FROM apartment_pricing_seasons WHERE apartment_id = ? ORDER BY date_from ASC'
      ).all(apt.id) as { id: string; name: string; date_from: string; date_to: string; price_per_night: number }[];

      return {
        id: apt.id,
        title: apt.title,
        short_description: apt.short_description,
        description: apt.description,
        max_guests: apt.max_guests,
        area: apt.area,
        price_base: Number(apt.price_base),
        view: apt.view,
        has_terrace: Boolean(apt.has_terrace),
        features: apt.features ? JSON.parse(apt.features) : [],
        images: images.length > 0 ? images : ['/images/placeholder.svg'],
        is_active: Boolean(apt.is_active),
        hot_deal_enabled: Boolean(apt.hot_deal_enabled),
        hot_deal_discount: Number(apt.hot_deal_discount ?? 10),
        hot_deal_date_from: apt.hot_deal_date_from || null,
        hot_deal_date_to: apt.hot_deal_date_to || null,
        seasons,
      };
    }));

    return formatted;
  } catch (error) {
    console.error('Error fetching apartments:', error);
    return [];
  }
}

export default async function ApartmentsPage() {
  const initialApartments = await getApartments();
  
  
  return <ApartmentsClient initialApartments={initialApartments} />;
}