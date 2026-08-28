export interface Apartment {
  id: string;
  title: string;
  short_description: string | null;
  description: string | null;
  max_guests: number;
  area: number | null;
  price_base: number;
  view: string | null;
  has_terrace: number; // 0 или 1 в БД
  is_active: number; // 0 или 1 в БД
  features: string | null; // JSON строка в БД
  images: string | null; // JSON строка в БД
  created_at: string;
  updated_at: string;
}

/** Тип жилья для фильтра в каталоге. null — менеджер ещё не разметил. */
export type ApartmentCategory = 'studio' | 'bedroom' | 'kitchen' | 'duplex';

export const APARTMENT_CATEGORIES: { code: ApartmentCategory; label: string }[] = [
  { code: 'studio', label: 'Студии' },
  { code: 'bedroom', label: 'С отдельной спальней' },
  { code: 'kitchen', label: 'С отдельной кухней' },
  { code: 'duplex', label: 'Двухуровневые' },
];

/** Срок долгосрочной аренды — общий на весь сайт, задаётся в Настройках. */
export interface LongTermTermClient {
  id: string;
  months: number;
  label: string | null;
}

export interface ApartmentSeason {
  id: string;
  name: string;
  date_from: string;
  date_to: string;
  price_per_night: number;
}

// Для использования в клиенте - created_at и updated_at опциональны
export interface ApartmentClient {
  id: string;
  title: string;
  short_description: string | null;
  description: string | null;
  max_guests: number;
  area: number | null;
  price_base: number;
  view: string | null;
  has_terrace: boolean; // boolean для клиента
  is_active: boolean; // boolean для клиента
  features: string[]; // массив для клиента
  images: string[]; // массив для клиента
  hot_deal_enabled?: boolean;
  hot_deal_discount?: number;
  hot_deal_date_from?: string | null;
  hot_deal_date_to?: string | null;
  seasons?: ApartmentSeason[];
  lunch_price?: number;
  dinner_price?: number;
  custom_meal_description?: string | null;
  long_term_enabled?: boolean;
  long_term_price?: number; // ₽ в месяц (legacy, до появления сроков)
  long_term_note?: string | null;
  /** Цена за месяц по каждому сроку: { term_id: ₽/мес }. Нет ключа — на этот срок не сдаём. */
  long_term_prices?: Record<string, number>;
  category?: ApartmentCategory | null;
  slug?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Booking {
  id: string;
  apartment_id: string;
  apartment_title?: string;
  guest_name: string | null;
  guest_phone: string | null;
  guest_email: string | null;
  check_in: string;
  check_out: string;
  guests_count: number;
  total_price: number;
  status: string;
  source: string;
  external_id?: string | null;
  comment?: string | null;
  manager_notes?: string | null;
  prepaid_amount?: number | null;
  prepaid_status?: string | null;
  created_at: string;
  updated_at: string;
}

// Добавляем ExternalBooking
export interface ExternalBooking {
  id: string;
  apartment_id: string;
  source_name: string;
  external_id: string | null;
  check_in: string;
  check_out: string;
  raw_data: string | null;
  imported_at: string;
}

export interface IcsSource {
  id: string;
  apartment_id: string;
  source_name: string;
  ics_url: string;
  is_active: number;
  last_sync: string | null;
  sync_status: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface SyncLog {
  id: string;
  source_name: string;
  apartment_id: string | null;
  action: string;
  status: string;
  events_count: number;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
}

export interface BlockedDate {
  start: string;
  end: string;
  source: string;
}