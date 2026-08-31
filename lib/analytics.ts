/* Яндекс.Метрика — счётчик 108341964 (lifestyleapart, lovelifestyle.ru).
 *
 * Два правила, из которых вырос этот файл:
 *
 * 1. Счётчик грузится ТОЛЬКО после «Принять» в cookie-баннере. Баннер обещает
 *    выбор — значит выбор должен что-то менять, иначе он декоративный, а форма
 *    брони уже собирает персданные, и на проверке это слабое место.
 *
 * 2. Без NEXT_PUBLIC_YM_ID весь модуль — no-op. Так сборка без переменной
 *    (локальная разработка, превью) ничего не отправляет и ничего не ломает.
 *
 * Идентификаторы целей ниже ДОЛЖНЫ совпадать с целями в кабинете счётчика.
 * Заведены 29.08.2026, тип «Целевое событие», условие «Совпадает».
 */

export const YM_ID = Number(process.env.NEXT_PUBLIC_YM_ID) || 0;

/* Ключ пишет CookieBanner. Событие — чтобы счётчик поднялся сразу после
   согласия, а не со следующей загрузки страницы. */
export const CONSENT_KEY = 'cookie_consent';
export const CONSENT_EVENT = 'cookie-consent-changed';

export type ConsentValue = 'all' | 'essential';

export function readConsent(): ConsentValue | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    return value === 'all' || value === 'essential' ? value : null;
  } catch {
    /* приватный режим, отключённые куки, iframe со строгой политикой —
       localStorage бросает на чтении. Нет согласия — нет аналитики. */
    return null;
  }
}

export function analyticsAllowed(): boolean {
  return readConsent() === 'all';
}

export type YmGoal =
  | 'booking_daily'      // 603423668 — успешная посуточная бронь
  | 'booking_longterm'   // 603424006 — заявка на долгосрок
  | 'booking_form_open'  // 603424254 — открыл форму бронирования
  | 'calendar_open'      // 603424445 — открыл календарь дат
  | 'phone_click';       // 603424517 — клик по ссылке tel:

/* Заглушка Метрики: до загрузки tag.js копит вызовы в .a, после загрузки
   скрипт их разбирает. В очереди лежат именно IArguments — tag.js обычный
   массив не принимает и очередь так и остаётся неразобранной (проверено). */
export type YmFn = ((...args: unknown[]) => void) & {
  a?: IArguments[];
  l?: number;
};

declare global {
  interface Window {
    ym?: YmFn;
  }
}

/* В params не передаём ничего, что относится к человеку: только цена, срок,
   id апартамента. Имя, телефон и email в Метрику не уходят. */
export function reachGoal(goal: YmGoal, params?: Record<string, unknown>) {
  if (!YM_ID || typeof window === 'undefined' || !window.ym) return;
  window.ym(YM_ID, 'reachGoal', goal, params);
}

export function hit(url: string, referer?: string) {
  if (!YM_ID || typeof window === 'undefined' || !window.ym) return;
  /* Четвёртым аргументом не передаём undefined — зовём с тремя. */
  if (referer) window.ym(YM_ID, 'hit', url, { referer });
  else window.ym(YM_ID, 'hit', url);
}
