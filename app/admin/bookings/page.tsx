'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Booking = {
  id: string;
  apartment_title: string;
  guest_name: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  guests_count: number;
  total_price: number;
  status: string;
  prepaid_status: string;
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const fetchBookings = async () => {
    const url = filter === 'all' 
      ? '/api/admin/bookings' 
      : `/api/admin/bookings?status=${filter}`;
    const res = await fetch(url);
    const data = await res.json();
    setBookings(data);
    setLoading(false);
  };

  const getStatusBadge = (status: string, prepaid: string) => {
    const statusMap: Record<string, string> = {
      confirmed: '🟢 Подтверждено',
      pending: '🟡 Ожидает',
      cancelled: '🔴 Отменено',
    };
    
    const prepaidMap: Record<string, string> = {
      none: '',
      partial: ' (частичная)',
      full: ' (полная)',
    };

    return `${statusMap[status] || status}${prepaidMap[prepaid] || ''}`;
  };

  if (loading) return <div className="admin-loading">Загрузка...</div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Бронирования</h1>
        <div className="admin-filters">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="admin-select">
            <option value="all">Все статусы</option>
            <option value="pending">Ожидают</option>
            <option value="confirmed">Подтверждены</option>
            <option value="cancelled">Отменены</option>
          </select>
          <Link href="/admin/bookings/new" className="admin-button primary">
            + Ручное бронирование
          </Link>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Апартамент</th>
              <th>Гость</th>
              <th>Телефон</th>
              <th>Заезд</th>
              <th>Выезд</th>
              <th>Гостей</th>
              <th>Сумма</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td className="booking-id">{booking.id.slice(0, 8)}...</td>
                <td>{booking.apartment_title}</td>
                <td>{booking.guest_name}</td>
                <td>{booking.guest_phone}</td>
                <td>{new Date(booking.check_in).toLocaleDateString()}</td>
                <td>{new Date(booking.check_out).toLocaleDateString()}</td>
                <td>{booking.guests_count}</td>
                <td>{booking.total_price.toLocaleString()} ₽</td>
                <td>
                  <span className={`status-badge status-${booking.status}`}>
                    {getStatusBadge(booking.status, booking.prepaid_status)}
                  </span>
                </td>
                <td className="actions">
                  <Link href={`/admin/bookings/${booking.id}`} className="admin-button small">
                    Детали
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}