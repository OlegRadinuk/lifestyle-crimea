import type { Metadata } from 'next';
import { db, settingsService, longTermService } from '@/lib/db';
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
  /* Цена в сниппете должна совпадать с тем, что гость увидит на сайте СЕГОДНЯ.
     `price_base` для этого не годится: это базовая цена карточки, а поверх неё
     лежат сезоны (`apartment_pricing_seasons`). В июле 2026 база давала «от
     3 700 ₽», тогда как реальный минимум сезона — 6 500 ₽: человек приходил
     из поиска по одной цене и видел другую. Берём минимум по сезонам,
     действующим на сегодня, и только если сезонов нет — падаем на базу. */
  let minPrice = 0;
  try {
    const season = db.prepare(`
      SELECT MIN(s.price_per_night) AS p
      FROM apartment_pricing_seasons s
      JOIN apartments a ON a.id = s.apartment_id
      WHERE a.is_active = 1 AND (a.deleted_at IS NULL OR a.deleted_at = '')
        AND date('now') BETWEEN s.date_from AND s.date_to
    `).get() as { p: number | null };

    minPrice = season?.p ?? 0;

    if (!minPrice) {
      const base = db.prepare(`
        SELECT MIN(price_base) AS p
        FROM apartments
        WHERE is_active = 1 AND (deleted_at IS NULL OR deleted_at = '')
      `).get() as { p: number | null };
      minPrice = base?.p ?? 0;
    }
  } catch {
    // БД недоступна — отдаём метаданные без цены, страница важнее
  }

  const priceText = minPrice > 0 ? ` от ${minPrice.toLocaleString('ru-RU')} ₽/сутки` : '';

  /* Каталог говорит языком гостя, а не отеля. По Вордстату (регион Россия,
     июль 2026): «снять жильё в Алуште» — 3 389/мес, «квартира посуточно
     Алушта» — 1 725, а «снять апартаменты в Алуште» — всего 212. Слово
     «апартаменты» сужало охват примерно в 16 раз, поэтому ведём «жильём»,
     а бренд и «апартаменты» оставляем в хвосте — премиальность сохраняется.
     Сильные хвосты, которые нам есть чем закрыть: «недорого» (~1 600/мес)
     и «без посредников» (~470/мес, бронь напрямую). */
  const title = 'Снять жильё в Алуште посуточно у моря — апартаменты «Стиль Жизни»';
  const description =
    `${APARTMENTS_COUNT} апартаментов у моря в Алуште${priceText} — Профессорский уголок, до пляжа 650 м. ` +
    'Снять жильё или квартиру посуточно напрямую, без посредников и комиссии. ' +
    'Вид на море, балкон, кухня, бассейны круглый год. Свободные даты онлайн.';

  return {
    title: { absolute: title },
    description,
    keywords:
      'снять жильё в алуште, снять жильё в алуште посуточно, квартира посуточно алушта, ' +
      'снять квартиру в алуште посуточно, жильё в алуште недорого, снять жильё в алуште возле моря, ' +
      'жильё в алуште без посредников, апартаменты алушта посуточно, профессорский уголок алушта снять',
    alternates: { canonical: 'https://lovelifestyle.ru/apartments' },
    openGraph: {
      title: 'Снять жильё в Алуште посуточно у моря — «Стиль Жизни»',
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

    // Цены долгосрочной аренды разом по всем апартаментам — один запрос вместо 47
    const longTermPrices = longTermService.allPrices();

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
        long_term_enabled: Boolean(apt.long_term_enabled),
        long_term_price: Number(apt.long_term_price || 0),
        long_term_note: apt.long_term_note || null,
        long_term_prices: longTermPrices[apt.id] ?? {},
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
  const longTermMinDays = settingsService.getLongTermMinDays();
  const longTermTerms = longTermService.listActiveTerms().map(t => ({
    id: t.id,
    months: t.months,
    label: t.label,
  }));

  return (
    <ApartmentsClient
      initialApartments={initialApartments}
      longTermMinDays={longTermMinDays}
      longTermTerms={longTermTerms}
    />
  );
}