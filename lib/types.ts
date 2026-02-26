// lib/types.ts

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

export interface BlockedDate {
  start: string;
  end: string;
  source: string;
}

export interface Booking {
  id: string;
  apartment_id: string;
  guest_name: string | null;
  guest_phone: string | null;
  guest_email: string | null;
  check_in: string;
  check_out: string;
  guests_count: number;
  total_price: number;
  status: string;
  source: string;
  created_at: string;
  updated_at: string;
}

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
