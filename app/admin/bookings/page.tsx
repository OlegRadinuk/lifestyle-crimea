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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить бронь навсегда? Это действие нельзя отменить.')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBookings(prev => prev.filter(b => b.id !== id));
      } else {
        alert('Ошибка при удалении брони');
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Ошибка при удалении брони');
    } finally {
      setDeletingId(null);
    }
  };

  const fetchBookings = async () => {
    try {
      const url = filter === 'all' 
        ? '/api/admin/bookings' 
        : `/api/admin/bookings?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
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
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="admin-select"
          >
            <option value="all">Все статусы</option>
            <option value="pending">Ожидают</option>
            <option value="confirmed">Подтверждены</option>
            <option value="cancelled">Отменены</option>
          </select>
        </div>
      </div>

      {/* Десктоп: таблица */}
      <div className="admin-table-container bookings-table-wrap">
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
                  <span className={`status-badge ${booking.status}`}>
                    {getStatusBadge(booking.status, booking.prepaid_status)}
                  </span>
                </td>
                <td className="actions">
                  <Link href={`/admin/bookings/${booking.id}`} className="admin-button small">
                    Детали
                  </Link>
                  <button
                    className="admin-button small danger"
                    disabled={deletingId === booking.id}
                    onClick={() => handleDelete(booking.id)}
                  >
                    {deletingId === booking.id ? 'Удаление...' : 'Удалить'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Мобиль: карточки */}
      <div className="bookings-cards-wrap">
        {bookings.map((booking) => (
          <div key={booking.id} className="booking-card">
            <div className="booking-card__top">
              <div className="booking-card__main">
                <div className="booking-card__name">{booking.guest_name}</div>
                <div className="booking-card__apt">{booking.apartment_title}</div>
              </div>
              <span className={`status-badge ${booking.status}`}>
                {getStatusBadge(booking.status, booking.prepaid_status)}
              </span>
            </div>
            <div className="booking-card__details">
              <span>{new Date(booking.check_in).toLocaleDateString()} — {new Date(booking.check_out).toLocaleDateString()}</span>
              <span>{booking.guests_count} гост.</span>
              <span className="booking-card__price">{booking.total_price.toLocaleString()} ₽</span>
            </div>
            <div className="booking-card__phone">{booking.guest_phone}</div>
            <div className="booking-card__actions">
              <Link href={`/admin/bookings/${booking.id}`} className="admin-button small">
                Детали
              </Link>
              <button
                className="admin-button small danger"
                disabled={deletingId === booking.id}
                onClick={() => handleDelete(booking.id)}
              >
                {deletingId === booking.id ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        ))}
        {bookings.length === 0 && (
          <p style={{ color: '#64748b', padding: '24px 0' }}>Нет бронирований</p>
        )}
      </div>

      <style jsx>{`
        /* Мобиль: прячем таблицу, показываем карточки */
        .bookings-cards-wrap { display: none; }

        @media (max-width: 768px) {
          .bookings-table-wrap { display: none; }
          .bookings-cards-wrap { display: flex; flex-direction: column; gap: 12px; }

          .booking-card {
            background: white;
            border-radius: 12px;
            padding: 14px 16px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            border: 1px solid #e2e8f0;
          }

          .booking-card__top {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 10px;
            margin-bottom: 8px;
          }

          .booking-card__name {
            font-weight: 600;
            font-size: 15px;
            color: #1a2634;
          }

          .booking-card__apt {
            font-size: 13px;
            color: #475569;
            margin-top: 2px;
          }

          .booking-card__details {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            font-size: 13px;
            color: #475569;
            margin-bottom: 6px;
          }

          .booking-card__price {
            font-weight: 600;
            color: #139ab6;
          }

          .booking-card__phone {
            font-size: 13px;
            color: #64748b;
            margin-bottom: 12px;
          }

          .booking-card__actions {
            display: flex;
            gap: 8px;
          }

          .booking-card__actions .admin-button.small {
            flex: 1;
            text-align: center;
            padding: 8px 12px;
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
}