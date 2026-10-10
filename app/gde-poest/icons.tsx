/**
 * Иконки для страницы /gde-poest.
 *
 * Готовые иконки переиспользуются из ../services/icons — не дублируем.
 * Здесь только недостающие: IconMapPin и IconRestaurant.
 *
 * Стиль: viewBox 0 0 32 32, stroke="currentColor", strokeWidth 1.5,
 * fill="none", aria-hidden="true" — идентично services/icons.tsx.
 */

export {
  IconCoffee,
  IconStore,
  IconBreakfast,
  IconPhone,
  IconArrowRight,
  IconInfo,
} from '../services/icons';

interface IconProps {
  className?: string;
}

/** Метка на карте — для кнопок «Маршрут» и адресных строк */
export function IconMapPin({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M16 4C10.477 4 6 8.477 6 14C6 20.5 16 28 16 28C16 28 26 20.5 26 14C26 8.477 21.523 4 16 4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="14" r="4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/** Столовые приборы — для карточек кафе и ресторанов */
export function IconRestaurant({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Вилка слева: ручка + 3 зубца */}
      <path d="M10 28V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M8 4v7a2 2 0 0 0 4 0V4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8 4v5M10 4v5M12 4v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* Нож справа */}
      <path
        d="M22 4c0 5 4 6 4 10v14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M22 4v24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
