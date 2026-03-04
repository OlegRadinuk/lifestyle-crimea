import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import BookingDetails from './BookingDetails';

// Определяем интерфейс прямо здесь для ясности
interface BookingRow {
  id: string;
  apartment_id: string;
  apartment_title: string;
  guest_name: string | null;
  guest_phone: string | null;
  guest_email: string | null;
  check_in: string;
  check_out: string;
  guests_count: number;
  total_price: number;
  status: string;
  source: string;
  external_id: string | null;
  comment: string | null;
  manager_notes: string | null;
  prepaid_amount: number | null;
  prepaid_status: string | null;
  created_at: string;
  updated_at: string;
}

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function BookingDetailPage({ params }: PageProps) {
  const { id } = await params;

  // Явно указываем тип как BookingRow или undefined
  const booking = db.prepare(`
    SELECT 
      b.*, 
      a.title as apartment_title 
    FROM bookings b
    LEFT JOIN apartments a ON b.apartment_id = a.id
    WHERE b.id = ?
  `).get(id) as BookingRow | undefined;

  if (!booking) {
    notFound();
  }

  // Преобразуем null в значения по умолчанию
  const safeBooking = {
    ...booking,
    manager_notes: booking.manager_notes ?? '',
    prepaid_amount: booking.prepaid_amount ?? 0,
    prepaid_status: booking.prepaid_status ?? 'not_required',
    guest_name: booking.guest_name ?? 'Не указано',
    guest_phone: booking.guest_phone ?? 'Не указан',
    guest_email: booking.guest_email ?? 'Не указан',
  };

  return <BookingDetails booking={safeBooking} />;
}