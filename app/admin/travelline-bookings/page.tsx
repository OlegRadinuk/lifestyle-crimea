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

      <div className="admin-table-container">
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
      `}</style>
    </div>
  );
}