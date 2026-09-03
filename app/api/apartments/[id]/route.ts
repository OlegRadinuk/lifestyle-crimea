import { NextResponse } from 'next/server';
import { db, settingsService, longTermService, findApartmentByIdOrSlug } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: param } = await params;

  /* Принимаем и слаг («deep-music»), и внутренний id («ls-deep-music»).
     После перевода адресов на человеческие слаги хедер продолжал дёргать
     этот эндпоинт куском пути из URL, получал 404 и не рисовал кнопку
     бронирования вовсе: на карточке апартамента не было ни «Проверить
     доступность», ни модалки — только «Вернуться к списку». */
  const id = findApartmentByIdOrSlug(param)?.id ?? param;

  try {
    // Получаем апартамент из БД (без проверки is_active, чтобы видеть даже неактивные)
    const apartment = db.prepare(`
      SELECT * FROM apartments WHERE id = ?
    `).get(id) as any;

    if (!apartment) {
      return NextResponse.json(
        { error: 'Apartment not found' },
        { status: 404 }
      );
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

    // Получаем сезоны
    const seasons = db.prepare(
      'SELECT id, name, date_from, date_to, price_per_night FROM apartment_pricing_seasons WHERE apartment_id = ? ORDER BY date_from ASC'
    ).all(id);

    // Форматируем данные
    const formatted = {
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
      breakfast_price: Number(apartment.breakfast_price || 0),
      lunch_price: Number(apartment.lunch_price || 0),
      dinner_price: Number(apartment.dinner_price || 0),
      custom_meal_price: Number(apartment.custom_meal_price || 0),
      custom_meal_description: apartment.custom_meal_description || null,
      hot_deal_enabled: Boolean(apartment.hot_deal_enabled),
      hot_deal_discount: Number(apartment.hot_deal_discount ?? 10),
      hot_deal_date_from: apartment.hot_deal_date_from || null,
      hot_deal_date_to: apartment.hot_deal_date_to || null,
      seasons: seasons,
      /* Тарифы длительной аренды — календарю, чтобы при выборе длинного срока
         он показывал месячную цену вместо суммы за ночи. */
      long_term_enabled: Boolean(apartment.long_term_enabled),
      long_term_min_days: settingsService.getLongTermMinDays(),
      long_term_terms: longTermService.listActiveTerms().map(t => ({
        id: t.id,
        months: t.months,
        label: t.label,
      })),
      long_term_prices: longTermService.pricesForApartment(id),
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching apartment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch apartment' },
      { status: 500 }
    );
  }
}
