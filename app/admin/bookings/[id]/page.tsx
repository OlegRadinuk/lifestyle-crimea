'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Booking = {
  id: string;
  apartment_title: string;
  guest_name: string;
  guest_phone: string;
  guest_email: string | null;
  check_in: string;
  check_out: string;
  guests_count: number;
  total_price: number;
  status: string;
  prepaid_amount: number;
  prepaid_status: string;
  source: string;
  created_at: string;
  manager_notes: string | null;
};

export default function BookingDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [prepaidAmount, setPrepaidAmount] = useState(0);

  useEffect(() => {
    fetchBooking();
  }, []);

  const fetchBooking = async () => {
    const res = await fetch(`/api/admin/bookings/${params.id}`);
    const data = await res.json();
    setBooking(data);
    setNotes(data.manager_notes || '');
    setPrepaidAmount(data.prepaid_amount || 0);
    setLoading(false);
  };

  const updateStatus = async (status: string) => {
    await fetch(`/api/admin/bookings/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchBooking();
  };

  const updatePrepaid = async () => {
    await fetch(`/api/admin/bookings/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prepaid_amount: prepaidAmount,
        prepaid_status: prepaidAmount > 0 ? (prepaidAmount === booking?.total_price ? 'full' : 'partial') : 'none'
      }),
    });
    fetchBooking();
  };

  const saveNotes = async () => {
    await fetch(`/api/admin/bookings/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ manager_notes: notes }),
    });
  };

  if (loading) return <div className="admin-loading">Загрузка...</div>;
  if (!booking) return <div>Бронь не найдена</div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Бронь #{booking.id.slice(0, 8)}</h1>
        <Link href="/admin/bookings" className="admin-button">← Назад</Link>
      </div>

      <div className="booking-detail-grid">
        {/* Основная информация */}
        <div className="admin-card">
          <h2>Информация о брони</h2>
          
          <div className="info-row">
            <span className="info-label">Апартамент:</span>
            <span className="info-value">{booking.apartment_title}</span>
          </div>
          
          <div className="info-row">
            <span className="info-label">Гость:</span>
            <span className="info-value">{booking.guest_name}</span>
          </div>
          
          <div className="info-row">
            <span className="info-label">Телефон:</span>
            <span className="info-value">{booking.guest_phone}</span>
          </div>
          
          {booking.guest_email && (
            <div className="info-row">
              <span className="info-label">Email:</span>
              <span className="info-value">{booking.guest_email}</span>
            </div>
          )}
          
          <div className="info-row">
            <span className="info-label">Даты:</span>
            <span className="info-value">
              {new Date(booking.check_in).toLocaleDateString()} — {new Date(booking.check_out).toLocaleDateString()}
            </span>
          </div>
          
          <div className="info-row">
            <span className="info-label">Гостей:</span>
            <span className="info-value">{booking.guests_count}</span>
          </div>
          
          <div className="info-row">
            <span className="info-label">Сумма:</span>
            <span className="info-value">{booking.total_price.toLocaleString()} ₽</span>
          </div>
          
          <div className="info-row">
            <span className="info-label">Источник:</span>
            <span className="info-value">{booking.source === 'website' ? 'Сайт' : 'Ручное'}</span>
          </div>
          
          <div className="info-row">
            <span className="info-label">Дата брони:</span>
            <span className="info-value">{new Date(booking.created_at).toLocaleString()}</span>
          </div>
        </div>

        {/* Управление статусом */}
        <div className="admin-card">
          <h2>Статус брони</h2>
          
          <div className="status-buttons">
            <button 
              className={`status-btn ${booking.status === 'pending' ? 'active' : ''}`}
              onClick={() => updateStatus('pending')}
            >
              🟡 Ожидает
            </button>
            <button 
              className={`status-btn ${booking.status === 'confirmed' ? 'active' : ''}`}
              onClick={() => updateStatus('confirmed')}
            >
              🟢 Подтверждена
            </button>
            <button 
              className={`status-btn ${booking.status === 'cancelled' ? 'active' : ''}`}
              onClick={() => updateStatus('cancelled')}
            >
              🔴 Отменена
            </button>
          </div>

          <h2 style={{ marginTop: '30px' }}>Предоплата</h2>
          <div className="prepaid-section">
            <input 
              type="number" 
              value={prepaidAmount} 
              onChange={(e) => setPrepaidAmount(Number(e.target.value))}
              placeholder="Сумма предоплаты"
            />
            <button onClick={updatePrepaid} className="admin-button primary">
              Сохранить
            </button>
          </div>
          <div className="prepaid-status">
            Статус: {
              booking.prepaid_status === 'full' ? '💳 Оплачено полностью' :
              booking.prepaid_status === 'partial' ? '💰 Частичная предоплата' :
              '⏳ Без предоплаты'
            }
          </div>
        </div>

        {/* Заметки менеджера */}
        <div className="admin-card full-width">
          <h2>Заметки</h2>
          <textarea 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            placeholder="Внутренние заметки по брони..."
          />
          <button onClick={saveNotes} className="admin-button primary" style={{ marginTop: '10px' }}>
            Сохранить заметки
          </button>
        </div>
      </div>

      <style jsx>{`
        .booking-detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .admin-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .admin-card.full-width {
          grid-column: span 2;
        }
        .admin-card h2 {
          font-size: 18px;
          margin-bottom: 20px;
          color: #1a2634;
        }
        .info-row {
          display: flex;
          padding: 8px 0;
          border-bottom: 1px solid #eef2f6;
        }
        .info-label {
          width: 120px;
          color: #64748b;
        }
        .info-value {
          flex: 1;
          color: #1e293b;
          font-weight: 500;
        }
        .status-buttons {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }
        .status-btn {
          flex: 1;
          padding: 10px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        .status-btn.active {
          border-color: #139ab6;
          background: #e6f7ff;
        }
        .prepaid-section {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
        }
        .prepaid-section input {
          flex: 1;
          padding: 10px;
          border: 1px solid #d0d9e2;
          border-radius: 8px;
        }
        .prepaid-status {
          color: #64748b;
          font-size: 14px;
        }
        textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #d0d9e2;
          border-radius: 8px;
          font-family: inherit;
        }
      `}</style>
    </div>
  );
}