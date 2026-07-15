import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Русские названия месяцев
const MONTHS_RU = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

// Русские названия дней недели
const WEEKDAYS_RU = [
  'воскресенье', 'понедельник', 'вторник', 'среда',
  'четверг', 'пятница', 'суббота',
];

// Форматирует Date (МСК) → "2 мая"
function formatDateShort(d: Date): string {
  return `${d.getDate()} ${MONTHS_RU[d.getMonth()]}`;
}

// Форматирует Date (МСК) → "YYYY-MM-DD"
function formatDateSql(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Возвращает новый Date (МСК) + offsetDays
function addDays(base: Date, offsetDays: number): Date {
  const result = new Date(base);
  result.setDate(result.getDate() + offsetDays);
  return result;
}

interface OccupiedRow {
  apartment_id: string;
  title: string;
}

interface HotDealRow {
  title: string;
  hot_deal_discount: number;
  hot_deal_date_to: string | null;
}

interface CountRow {
  total: number;
}

export async function GET() {
  try {
    // Текущий момент в часовом поясе МСК (UTC+3)
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));

    // --- Вычисляем даты ближайших и следующих выходных ---
    const day = now.getDay(); // 0=Sun, 6=Sat
    const daysToSat = day === 6 ? 0 : (6 - day + 7) % 7;

    const thisSat = addDays(now, daysToSat);
    const thisSun = addDays(thisSat, 1);
    const nextSat = addDays(thisSat, 7);
    const nextSun = addDays(nextSat, 1);

    // Для SQL: выходные — это интервал [Sat, Mon), чтобы захватить обе ночи
    const thisSatSql = formatDateSql(thisSat);
    const thisMon = formatDateSql(addDays(thisSun, 1));
    const nextSatSql = formatDateSql(nextSat);
    const nextMon = formatDateSql(addDays(nextSun, 1));

    // --- Запрос: общее количество активных апартаментов ---
    const { total: totalApartments } = db.prepare(`
      SELECT COUNT(*) as total
      FROM apartments
      WHERE is_active = 1 AND deleted_at IS NULL
    `).get() as CountRow;

    /* --- Занятость на интервал [from, to) ---
       ВАЖНО: занятость этого проекта разложена по ТРЁМ таблицам, и раньше здесь
       читались только `bookings` (заявки с формы сайта — их почти нет) — поэтому
       ассистент рапортовал «свободно 44 из 44», хотя Travelline держал номера
       занятыми (на 18–19 июля: реально занято 10, отдавали 0). Гость получал
       заведомо ложный ответ → риск двойного бронирования.
       Теперь смотрим все три источника, как и сам сайт:
         • blocked_dates      — синк Travelline, ГЛАВНЫЙ источник (start_date/end_date)
         • bookings           — собственные брони с сайта (check_in/check_out)
         • external_bookings  — импорт iCal (сейчас пусто, но пусть будет)
       Семантика пересечения — ровно как в /api/availability-travelline,
       по которому живёт публичная страница: start < to AND end > from. */
    const occupiedFor = (fromSql: string, toSql: string) =>
      db.prepare(`
        SELECT DISTINCT a.id AS apartment_id, a.title
        FROM apartments a
        WHERE a.is_active = 1
          AND a.deleted_at IS NULL
          AND (
            EXISTS (
              SELECT 1 FROM blocked_dates bd
              WHERE bd.apartment_id = a.id
                AND bd.start_date < ? AND bd.end_date > ?
            )
            OR EXISTS (
              SELECT 1 FROM bookings b
              WHERE b.apartment_id = a.id
                AND b.status != 'cancelled'
                AND b.check_in < ? AND b.check_out > ?
            )
            OR EXISTS (
              SELECT 1 FROM external_bookings eb
              WHERE eb.apartment_id = a.id
                AND eb.check_in < ? AND eb.check_out > ?
            )
          )
        ORDER BY a.title
      `).all(toSql, fromSql, toSql, fromSql, toSql, fromSql) as OccupiedRow[];

    // --- Занятые апартаменты на ближайшие выходные ---
    const occupiedThisWeekend = occupiedFor(thisSatSql, thisMon);

    // --- Занятые апартаменты на следующие выходные ---
    const occupiedNextWeekend = occupiedFor(nextSatSql, nextMon);

    // --- Запрос: горячие предложения ---
    const hotDeals = db.prepare(`
      SELECT title, hot_deal_discount, hot_deal_date_to
      FROM apartments
      WHERE hot_deal_enabled = 1
        AND is_active = 1
        AND deleted_at IS NULL
        AND (hot_deal_date_to IS NULL OR hot_deal_date_to >= date('now'))
    `).all() as HotDealRow[];

    // --- Форматирование времени ---
    const timeStr = now.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Moscow',
    });
    const weekdayStr = WEEKDAYS_RU[now.getDay()];
    const dateStr = `${now.getDate()} ${MONTHS_RU[now.getMonth()]} ${now.getFullYear()}`;

    // --- Сборка текста ---
    const lines: string[] = [];

    lines.push(
      `=== Данные о доступности апартаментов (актуально: ${weekdayStr}, ${dateStr}, ${timeStr} МСК) ===`,
      '',
      'Для проверки конкретного апартамента используй: GET https://lovelifestyle.ru/api/public/availability?slug=[slug]&from=YYYY-MM-DD&to=YYYY-MM-DD',
      'Пример: https://lovelifestyle.ru/api/public/availability?slug=ls-black-strong&from=2025-05-10&to=2025-05-12',
      '',
    );

    // Ближайшие выходные
    const thisWeekendLabel = `${formatDateShort(thisSat)}–${formatDateShort(thisSun)}`;
    const thisFreeCount = totalApartments - occupiedThisWeekend.length;
    lines.push(`БЛИЖАЙШИЕ ВЫХОДНЫЕ (${thisWeekendLabel}):`);
    lines.push(`Свободно ${thisFreeCount} апартаментов из ${totalApartments}.`);
    if (occupiedThisWeekend.length > 0) {
      const titles = occupiedThisWeekend.map(r => r.title).join(', ');
      lines.push(`Занятые: ${titles}`);
    } else {
      lines.push('Все апартаменты свободны.');
    }

    lines.push('');

    // Следующие выходные
    const nextWeekendLabel = `${formatDateShort(nextSat)}–${formatDateShort(nextSun)}`;
    const nextFreeCount = totalApartments - occupiedNextWeekend.length;
    lines.push(`СЛЕДУЮЩИЕ ВЫХОДНЫЕ (${nextWeekendLabel}):`);
    lines.push(`Свободно ${nextFreeCount} апартаментов из ${totalApartments}.`);
    if (occupiedNextWeekend.length > 0) {
      const titles = occupiedNextWeekend.map(r => r.title).join(', ');
      lines.push(`Занятые: ${titles}`);
    } else {
      lines.push('Все апартаменты свободны.');
    }

    // Горячие предложения
    if (hotDeals.length > 0) {
      lines.push('');
      lines.push('ГОРЯЧИЕ ПРЕДЛОЖЕНИЯ (активные скидки):');
      for (const deal of hotDeals) {
        const until = deal.hot_deal_date_to
          ? ` (действует до ${formatDateShort(new Date(deal.hot_deal_date_to + 'T00:00:00'))})`
          : '';
        lines.push(`• ${deal.title}: скидка ${deal.hot_deal_discount}%${until}`);
      }
    }

    lines.push('');
    lines.push(
      'Если гость спрашивает о конкретных датах — ориентируйся на эти данные. ' +
      'Если апартамент не в списке занятых — он свободен.',
    );

    const text = lines.join('\n');

    return new NextResponse(text, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (err) {
    console.error('[/api/public/context] Error:', err);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

// Preflight для OPTIONS (CORS)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
