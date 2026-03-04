export interface Apartment {
  id: string;
  title: string;
  short_description: string | null;
  description: string | null;
  max_guests: number;
  area: number | null;
  price_base: number;
  view: string | null;
  has_terrace: number;
  is_active: number;
  features: string | string[];
  images: string | string[];
  created_at: string;
  updated_at: string;
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