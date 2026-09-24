import { NextResponse } from 'next/server';
import { db, settingsService } from '@/lib/db';

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

interface AptPriceRow {
  title: string;
  price_base: number;
  price_per_night: number | null;
}

interface LongTermPriceRow {
  apartment_id: string;
  term_id: string;
  price_per_month: number;
  months: number;
  label: string | null;
}

interface LongTermTermStatRow {
  term_id: string;
  label: string | null;
  months: number;
  sort_order: number;
  min_price: number;
  max_price: number;
}

interface LongTermCountRow {
  cnt: number;
}

// Форматирует число с пробелами тысяч: 12500 → "12 500"
function fmtPrice(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
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

    // --- БЛОК 2: Цены посуточно на сегодня ---
    // Логика совпадает с currentNightlyPrice в ApartmentsClient.tsx:
    // берём сезон, действующий сегодня; если сезона нет — фолбэк на price_base.
    // date('now') в SQLite — UTC; сервер работает в UTC, поэтому с 00:00 до 03:00 МСК
    // он возвращал бы дату вчерашнего дня и цену старого сезона. Аналогичная причина
    // описана в блоке занятости выше (now = UTC+3 через toLocaleString).
    // Используем date('now', '+3 hours') — то же смещение +3 ч, что и в блоке занятости.
    try {
      const aptPrices = db.prepare(`
        SELECT
          a.title,
          a.price_base,
          (SELECT s.price_per_night
           FROM apartment_pricing_seasons s
           WHERE s.apartment_id = a.id
             AND date('now', '+3 hours') BETWEEN s.date_from AND s.date_to
           LIMIT 1) AS price_per_night
        FROM apartments a
        WHERE a.is_active = 1 AND a.deleted_at IS NULL
        ORDER BY COALESCE(
          (SELECT s2.price_per_night
           FROM apartment_pricing_seasons s2
           WHERE s2.apartment_id = a.id
             AND date('now', '+3 hours') BETWEEN s2.date_from AND s2.date_to
           LIMIT 1),
          a.price_base
        ) ASC
      `).all() as AptPriceRow[];

      if (aptPrices.length > 0) {
        const effective = aptPrices.map(r => r.price_per_night ?? r.price_base);
        const minP = Math.min(...effective);
        const maxP = Math.max(...effective);

        lines.push('');
        lines.push('=== ЦЕНЫ ПОСУТОЧНО НА СЕГОДНЯ ===');
        lines.push(`Диапазон: от ${fmtPrice(minP)} до ${fmtPrice(maxP)} ₽ за ночь`);
        lines.push('');
        for (const r of aptPrices) {
          const p = r.price_per_night ?? r.price_base;
          lines.push(`${r.title} — ${fmtPrice(p)} ₽/ночь`);
        }
        lines.push('');
        lines.push('Цены актуальны на сегодня по данным из системы управления (сезонные тарифы).');
        lines.push('Называй гостю точную цену из этого списка — она совпадает с ценой на сайте.');
      }
    } catch (err) {
      console.error('[/api/public/context] prices block error:', err);
    }

    // --- БЛОК 3: Долгосрочная аренда ---
    try {
      const minDays = settingsService.getLongTermMinDays();

      const ltCount = db.prepare(`
        SELECT COUNT(*) AS cnt FROM apartments
        WHERE is_active = 1 AND deleted_at IS NULL AND long_term_enabled = 1
      `).get() as LongTermCountRow;

      if (ltCount.cnt > 0) {
        // Агрегация по срокам: только активные сроки, у которых есть цены
        // по активным долгосрочным апартаментам; сроки без цен (напр. «Год») — не попадают.
        const termStats = db.prepare(`
          SELECT
            ltt.id AS term_id,
            ltt.label,
            ltt.months,
            ltt.sort_order,
            MIN(alp.price_per_month) AS min_price,
            MAX(alp.price_per_month) AS max_price
          FROM long_term_terms ltt
          JOIN apartment_long_term_prices alp ON alp.term_id = ltt.id
          JOIN apartments a ON a.id = alp.apartment_id
          WHERE ltt.is_active = 1
            AND a.is_active = 1 AND a.deleted_at IS NULL
            AND a.long_term_enabled = 1
          GROUP BY ltt.id, ltt.label, ltt.months, ltt.sort_order
          ORDER BY ltt.sort_order, ltt.months
        `).all() as LongTermTermStatRow[];

        if (termStats.length > 0) {
          const allMin = Math.min(...termStats.map(t => t.min_price));
          const allMax = Math.max(...termStats.map(t => t.max_price));

          // Скидка за длинный срок: сравниваем min_price первого и последнего срока по months
          const sorted = [...termStats].sort((a, b) => a.months - b.months);
          const hasDiscount = sorted.length >= 2 &&
            sorted[sorted.length - 1].min_price < sorted[0].min_price;

          lines.push('');
          lines.push('=== ДОЛГОСРОЧНАЯ АРЕНДА ===');
          lines.push(`Минимальный срок: от ${minDays} суток.`);
          lines.push(`Доступно апартаментов: ${ltCount.cnt}.`);
          lines.push(`Общий диапазон: от ${fmtPrice(allMin)} до ${fmtPrice(allMax)} ₽/месяц.`);
          lines.push('');
          // Разбивка по срокам (в порядке sort_order из справочника)
          for (const t of termStats) {
            const label = t.label ?? `${t.months} мес.`;
            lines.push(`${label}: от ${fmtPrice(t.min_price)} до ${fmtPrice(t.max_price)} ₽/месяц`);
          }
          if (hasDiscount) {
            lines.push('');
            lines.push('Чем длиннее срок, тем ниже месячная плата.');
          }
          lines.push('По отдельным апартаментам могут быть ограничения по срокам — детали у менеджера.');
          lines.push('Для записи на долгосрок — передай контакт менеджеру или предложи перезвонить.');
        }
      }
    } catch (err) {
      console.error('[/api/public/context] long_term block error:', err);
    }

    // --- БЛОК 4: Покупка апартаментов (инвестиции) ---
    try {
      lines.push('');
      lines.push('=== ПОКУПКА АПАРТАМЕНТОВ / ИНВЕСТИЦИИ ===');
      lines.push('Апартаменты «Стиль Жизни» можно не только снять, но и приобрести в собственность.');
      lines.push('Комплекс позиционируется как инвестиция в крымскую недвижимость с арендным доходом.');
      lines.push('Цены продажи и условия покупки — только у менеджера; называть цифры не нужно.');
      lines.push('Подробнее о концепции: https://lovelifestyle.ru/concept');
    } catch (err) {
      console.error('[/api/public/context] concept block error:', err);
    }

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
