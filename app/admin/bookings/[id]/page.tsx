import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import BookingClient from './BookingClient';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function BookingPage({ params }: PageProps) {
  // ✅ На сервере просто await
  const { id } = await params;

  if (!id) {
    redirect('/admin/bookings');
  }

  // Получаем данные на сервере
  const booking = db.prepare(`
    SELECT b.*, a.title as apartment_title 
    FROM bookings b
    JOIN apartments a ON b.apartment_id = a.id
    WHERE b.id = ?
  `).get(id) as any;

  if (!booking) {
    notFound();
  }

  // Преобразуем числа
  const formattedBooking = {
    ...booking,
    total_price: Number(booking.total_price),
    prepaid_amount: Number(booking.prepaid_amount || 0),
    manager_notes: booking.manager_notes || '',
  };

  // Передаём данные в клиентский компонент (для интерактива)
  return <BookingClient booking={formattedBooking} />;
}