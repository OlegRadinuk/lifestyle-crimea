interface IconProps {
  className?: string;
}

/* Готовые проекты — ключ/чертёж */
export function IconBlueprint({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="7" y="7" width="34" height="34" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14 24h20M24 14v20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="24" cy="24" r="5.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

/* Гостиничная индустрия — здание/ключ от номера */
export function IconHotel({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M9 41V14l15-7 15 7v27" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 41h30" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="18" y="22" width="12" height="19" stroke="currentColor" strokeWidth="1.6" />
      <path d="M16 18h.01M24 18h.01M32 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* Ежегодный доход — растущий график */
export function IconGrowth({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M8 36V12M8 36h32" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M13 30l8-9 7 5 11-14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 12h7v7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Управление недвижимостью — шестерёнка/контроль */
export function IconManage({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="24" cy="24" r="7" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M24 8v5M24 35v5M8 24h5M35 24h5M12.5 12.5l3.5 3.5M32 32l3.5 3.5M12.5 35.5l3.5-3.5M32 16l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* Телефон для tel: CTA */
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

/* Стрелка вниз — якорь-скролл к секциям */
export function IconArrowDown({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 4v15M5 12l7 7 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Локация — для перечня городов */
export function IconPin({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
