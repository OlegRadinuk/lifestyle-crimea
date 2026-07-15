interface IconProps {
  className?: string;
}

/* === В апартаментах === */

export function IconBalcony({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M4 12h24M4 28V12M28 28V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 16v12M16 16v12M23 16v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 12l3-6h18l3 6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function IconShower({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M10 6V4a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="20" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 12h8M11 16h14M9 20h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 24v2M16 24v2M20 24v2M24 24v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconTv({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="4" y="7" width="24" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 27h8M16 23v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 13l4 3-4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconAc({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="3" y="9" width="26" height="9" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 22c0 2-2 2-2 4M16 22c0 2-2 2-2 4M24 22c0 2-2 2-2 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconFridge({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="8" y="2" width="16" height="28" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 13h16" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 6v4M12 17v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconKettle({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M9 14h11a5 5 0 0 1 5 5c0 2-1.5 3-3 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M9 14c-1 0-2 1-2 3v6a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4v-2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M12 14V8a2 2 0 1 1 4 0v6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function IconInduction({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="3" y="6" width="26" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="11" cy="16" r="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="22" cy="16" r="4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function IconCoffee({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M6 13h17v6a7 7 0 0 1-7 7h-3a7 7 0 0 1-7-7v-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M23 15h2a3 3 0 0 1 0 6h-2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 7c0 1.5 2 1.5 2 3M16 7c0 1.5 2 1.5 2 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconWifi({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M5 13a16 16 0 0 1 22 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9.5 18a10 10 0 0 1 13 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 23a4.5 4.5 0 0 1 4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="16" cy="27" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function IconPlus({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 11v10M11 16h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* === Услуги === */

export function IconBreakfast({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="16" cy="24" rx="12" ry="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 24V14a10 10 0 0 1 20 0v10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 4V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconFullBoard({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 9v7l5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconExcursion({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M16 4l4 9-4 15-4-15 4-9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="16" cy="11" r="2.4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function IconCleaning({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 4l13 13-5 5L7 9l5-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 23l-5 5M5 25l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconIron({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M6 12c0-3 3-5 8-5h4c5 0 8 4 8 8 0 4-3 7-8 7H10a4 4 0 0 1-4-4v-6z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M9 22v3M14 22v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconLaundry({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="5" y="4" width="22" height="24" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="17" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13 17a3 3 0 0 0 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="9" cy="8" r="1" fill="currentColor" />
    </svg>
  );
}

export function IconTransfer({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M4 19l2-7a3 3 0 0 1 3-2h14a3 3 0 0 1 3 2l2 7" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M3 19h26v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4z" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="9" cy="23" r="1.6" fill="currentColor" />
      <circle cx="23" cy="23" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function IconTaxi({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M5 18l2-6a3 3 0 0 1 3-2h12a3 3 0 0 1 3 2l2 6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="3" y="18" width="26" height="6" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 10h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="9" cy="24" r="1.6" fill="currentColor" />
      <circle cx="23" cy="24" r="1.6" fill="currentColor" />
    </svg>
  );
}

/* === Инфраструктура === */

export function IconSeaWalk({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M3 24c2 0 3-2 5-2s3 2 5 2 3-2 5-2 3 2 5 2 3-2 5-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 18c2 0 3-2 5-2s3 2 5 2 3-2 5-2 3 2 5 2 3-2 5-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <circle cx="16" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function IconLounge({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M6 26V14a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v12" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 26h24M9 22V13M23 22V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconBbq({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="16" cy="16" rx="11" ry="5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 16v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 24v4M12 28h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconSport({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 16h26M16 3a18 18 0 0 1 0 26M16 3a18 18 0 0 0 0 26" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function IconPlayground({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M6 28V6M6 6l16 5-16 5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="22" cy="22" r="4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function IconParking({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="4" y="4" width="24" height="24" rx="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 22V10h5a4 4 0 0 1 0 8h-5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function IconStore({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M4 12l2-7h20l2 7" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M5 12v14a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V12" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 28v-8h8v8" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function IconCosmetics({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 12V8a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="12" width="14" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 18h14" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function IconPool({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M3 22c2 0 3-2 5-2s3 2 5 2 3-2 5-2 3 2 5 2 3-2 5-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 22V8l18-2v16" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function IconGazebo({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M16 4l13 7H3l13-7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7 11v15M25 11v15M16 11v15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 26h24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Стрелка вниз — подсказка «листайте дальше» в герое */
export function IconArrowDown({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M16 5v22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 18l9 9 9-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* === Аквазона (блок «Аквазона» на /services) ===
   В реестр SERVICE_ICONS намеренно не добавлены: реестр — это выбор иконки
   для пунктов из админки, а эти используются только в статичном блоке. */

/** Детский бассейн — мелкая чаша с кругом */
export function IconPoolKids({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M5 19h22v4a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5v-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M3 19h26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="16" cy="11" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 11h10M16 6c1.8 2.2 1.8 7.8 0 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Джакузи — чаша с пузырьками */
export function IconJacuzzi({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M4 17h24v5a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6v-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M2 17h28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="11" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.5" cy="5.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="22" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/** Шезлонг под зонтом */
export function IconSunbed({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M3 24h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 24l2-5h11l-1.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7 19l4.5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 24v4M17 24v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M24 28V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17 12a7 7 0 0 1 14 0H17z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

/** Бар — бокал с трубочкой */
export function IconBar({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M6 7h20L17 18v9" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M11 27h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9.5 11h13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M21 6l4-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="25.5" cy="2.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/** Вид на море и горы одновременно */
export function IconSeaMountains({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="24" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 20l7-9 5.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 20l6-7.5L24 20" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M2 20h28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 25c2 0 3-1.6 5-1.6s3 1.6 5 1.6 3-1.6 5-1.6 3 1.6 5 1.6 3-1.6 5-1.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 29.5c2 0 3-1.6 5-1.6s3 1.6 5 1.6 3-1.6 5-1.6 3 1.6 5 1.6 3-1.6 5-1.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Информация — для памятки про категории апартаментов */
export function IconInfo({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 14v9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="16" cy="9.5" r="1.25" fill="currentColor" />
    </svg>
  );
}

export function IconPhone({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.3 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1L6.6 10.8z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconArrowRight({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M4 12h15M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* === Карта иконок для динамического выбора (страница /services + админка) ===
 * Ключ → SVG-компонент. И публичная страница, и форма админки используют
 * этот единый источник, чтобы список доступных иконок не разъезжался.
 * Менеджер выбирает иконку по ключу в дропдауне; страница рендерит её по ключу
 * с фолбэком на DEFAULT_SERVICE_ICON_KEY, если ключ пустой/неизвестный.
 */
export type ServiceIconComponent = (props: IconProps) => React.ReactElement;

export const SERVICE_ICONS: Record<string, ServiceIconComponent> = {
  // В апартаментах
  balcony: IconBalcony,
  shower: IconShower,
  tv: IconTv,
  ac: IconAc,
  fridge: IconFridge,
  kettle: IconKettle,
  induction: IconInduction,
  coffee: IconCoffee,
  wifi: IconWifi,
  plus: IconPlus,
  // Услуги
  breakfast: IconBreakfast,
  'full-board': IconFullBoard,
  excursion: IconExcursion,
  cleaning: IconCleaning,
  iron: IconIron,
  laundry: IconLaundry,
  transfer: IconTransfer,
  taxi: IconTaxi,
  // Инфраструктура
  'sea-walk': IconSeaWalk,
  lounge: IconLounge,
  bbq: IconBbq,
  sport: IconSport,
  playground: IconPlayground,
  parking: IconParking,
  store: IconStore,
  cosmetics: IconCosmetics,
  pool: IconPool,
  gazebo: IconGazebo,
};

// Дефолтная иконка-фолбэк, если ключ пустой/неизвестный.
export const DEFAULT_SERVICE_ICON_KEY = 'plus';

// Человекочитаемые подписи ключей для дропдауна в админке.
export const SERVICE_ICON_LABELS: Record<string, string> = {
  balcony: 'Балкон',
  shower: 'Душ / ванна',
  tv: 'Телевизор',
  ac: 'Кондиционер',
  fridge: 'Холодильник',
  kettle: 'Чайник',
  induction: 'Плита',
  coffee: 'Кофе',
  wifi: 'Wi-Fi / Интернет',
  plus: 'Плюс (по умолчанию)',
  breakfast: 'Завтрак',
  'full-board': 'Пансион / время',
  excursion: 'Экскурсия',
  cleaning: 'Уборка',
  iron: 'Глажка',
  laundry: 'Прачечная',
  transfer: 'Трансфер',
  taxi: 'Такси',
  'sea-walk': 'Море рядом',
  lounge: 'Лаундж / отдых',
  bbq: 'Мангал / барбекю',
  sport: 'Спортплощадка',
  playground: 'Детская площадка',
  parking: 'Паркинг',
  store: 'Магазин / кофейня',
  cosmetics: 'Косметика',
  pool: 'Бассейн',
  gazebo: 'Беседка',
};

// Список ключей в стабильном порядке (для дропдауна).
export const SERVICE_ICON_KEYS = Object.keys(SERVICE_ICONS);

/**
 * Возвращает SVG-компонент иконки по ключу. Если ключ пустой/неизвестный —
 * отдаёт дефолтную иконку, чтобы страница никогда не падала.
 */
export function resolveServiceIcon(key: string | null | undefined): ServiceIconComponent {
  if (key && SERVICE_ICONS[key]) return SERVICE_ICONS[key];
  return SERVICE_ICONS[DEFAULT_SERVICE_ICON_KEY];
}
