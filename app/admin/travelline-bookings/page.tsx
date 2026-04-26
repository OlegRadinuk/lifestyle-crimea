'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type TravellineBooking = {
  id: number;
  apartment_id: string;
  apartment_title: string;
  guest_name: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  guests_count: number;
  source: string;
  external_id: string;
  created_at: string;
};

export default function TravellineBookingsPage() {
  const [bookings, setBookings] = useState<TravellineBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/admin/blocked-bookings');
      const data = await res.json();
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="admin-loading">Загрузка...</div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Брони из Travelline</h1>
        <div className="admin-badge">Источник: Travelline API</div>
      </div>

      <div className="admin-stats-cards">
        <div className="stat-mini-card">
          <span className="stat-label">Всего блокировок:</span>
          <span className="stat-value">{bookings.length}</span>
        </div>
        <div className="stat-mini-card">
          <span className="stat-label">Активных сейчас:</span>
          <span className="stat-value">
            {bookings.filter(b => new Date(b.check_out) > new Date()).length}
          </span>
        </div>
      </div>

      {/* Десктоп: таблица */}
      <div className="admin-table-container tl-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Апартамент</th>
              <th>ID брони (Travelline)</th>
              <th>Заезд</th>
              <th>Выезд</th>
              <th>Статус</th>
              <th>Дата синхронизации</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => {
              const isActive = new Date(booking.check_out) > new Date();
              return (
                <tr key={booking.id}>
                  <td>
                    <Link href={`/admin/apartments/${booking.apartment_id}`} className="apartment-link">
                      {booking.apartment_title}
                    </Link>
                  </td>
                  <td className="booking-id">{booking.external_id || '—'}</td>
                  <td>{new Date(booking.check_in).toLocaleDateString()}</td>
                  <td>{new Date(booking.check_out).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
                      {isActive ? '🟢 Активна' : '⚪ Завершена'}
                    </span>
                  </td>
                  <td>{new Date(booking.created_at).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Мобиль: карточки */}
      <div className="tl-cards-wrap">
        {bookings.map((booking) => {
          const isActive = new Date(booking.check_out) > new Date();
          return (
            <div key={booking.id} className="tl-card">
              <div className="tl-card__top">
                <Link href={`/admin/apartments/${booking.apartment_id}`} className="apartment-link tl-card__apt">
                  {booking.apartment_title}
                </Link>
                <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
                  {isActive ? '🟢 Активна' : '⚪ Завершена'}
                </span>
              </div>
              <div className="tl-card__dates">
                {new Date(booking.check_in).toLocaleDateString()} — {new Date(booking.check_out).toLocaleDateString()}
              </div>
              {booking.external_id && (
                <div className="tl-card__id">ID: {booking.external_id}</div>
              )}
              <div className="tl-card__sync">Синхр.: {new Date(booking.created_at).toLocaleString()}</div>
            </div>
          );
        })}
        {bookings.length === 0 && (
          <p style={{ color: '#64748b', padding: '24px 0' }}>Нет броней из Travelline</p>
        )}
      </div>

      <style jsx>{`
        .admin-stats-cards {
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
        }
        .stat-mini-card {
          background: white;
          padding: 15px 25px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          display: flex;
          gap: 15px;
          align-items: center;
        }
        .stat-mini-card .stat-label {
          color: #64748b;
          font-size: 14px;
        }
        .stat-mini-card .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: #1a2634;
        }
        .apartment-link {
          color: #139ab6;
          text-decoration: none;
        }
        .apartment-link:hover {
          text-decoration: underline;
        }
        .admin-badge {
          background: #e2e8f0;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 14px;
          color: #475569;
        }

        /* Мобиль: прячем таблицу */
        .tl-cards-wrap { display: none; }

        @media (max-width: 768px) {
          .admin-stats-cards {
            flex-direction: column;
            gap: 10px;
          }

          .stat-mini-card {
            padding: 12px 16px;
          }

          .tl-table-wrap { display: none; }
          .tl-cards-wrap {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .tl-card {
            background: white;
            border-radius: 10px;
            padding: 14px 16px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            border: 1px solid #e2e8f0;
          }

          .tl-card__top {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 6px;
          }

          .tl-card__apt {
            font-weight: 600;
            font-size: 14px;
          }

          .tl-card__dates {
            font-size: 13px;
            color: #475569;
            margin-bottom: 4px;
          }

          .tl-card__id {
            font-size: 12px;
            color: #94a3b8;
            font-family: monospace;
            margin-bottom: 4px;
          }

          .tl-card__sync {
            font-size: 12px;
            color: #94a3b8;
          }
        }
      `}</style>
    </div>
  );
}