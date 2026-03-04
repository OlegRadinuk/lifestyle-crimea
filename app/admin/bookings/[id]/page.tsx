import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function BookingDetailPage({ params }: PageProps) {
  const { id } = await params;

  const booking = db.prepare(`
    SELECT b.*, a.title as apartment_title 
    FROM bookings b
    JOIN apartments a ON b.apartment_id = a.id
    WHERE b.id = ?
  `).get(id) as any;

  if (!booking) {
    notFound();
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Бронь #{id.slice(0, 8)}</h1>
        <Link href="/admin/bookings" className="admin-button">← Назад</Link>
      </div>

      <div style={{ padding: '20px', background: 'white', borderRadius: '8px' }}>
        <pre>{JSON.stringify(booking, null, 2)}</pre>
      </div>
    </div>
  );
}