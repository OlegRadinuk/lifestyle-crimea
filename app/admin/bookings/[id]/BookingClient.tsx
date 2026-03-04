'use client';

import { useState } from 'react';
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
  manager_notes: string;
};

export default function BookingClient({ booking: initialBooking }: { booking: Booking }) {
  const router = useRouter();
  const [booking, setBooking] = useState(initialBooking);
  const [notes, setNotes] = useState(initialBooking.manager_notes);
  const [prepaidAmount, setPrepaidAmount] = useState(initialBooking.prepaid_amount);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Определяем статус предоплаты
      const prepaid_status = prepaidAmount > 0 
        ? (prepaidAmount === booking.total_price ? 'full' : 'partial') 
        : 'none';
      
      // Отправляем всё одним запросом
      const res = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: booking.status,
          prepaid_amount: prepaidAmount,
          prepaid_status,
          manager_notes: notes,
        }),
      });
      
      if (res.ok) {
        alert('Изменения сохранены');
        router.refresh();
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Бронь #{booking.id.slice(0, 8)}</h1>
        <Link href="/admin/bookings" className="admin-button">← Назад</Link>
      </div>

      <div className="booking-detail-grid">
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

        <div className="admin-card">
          <h2>Статус брони</h2>
          
          <div className="status-buttons">
            <button 
              className={`status-btn ${booking.status === 'pending' ? 'active' : ''}`}
              onClick={() => setBooking({ ...booking, status: 'pending' })}
            >
              🟡 Ожидает
            </button>
            <button 
              className={`status-btn ${booking.status === 'confirmed' ? 'active' : ''}`}
              onClick={() => setBooking({ ...booking, status: 'confirmed' })}
            >
              🟢 Подтверждена
            </button>
            <button 
              className={`status-btn ${booking.status === 'cancelled' ? 'active' : ''}`}
              onClick={() => setBooking({ ...booking, status: 'cancelled' })}
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
          </div>
        </div>

        <div className="admin-card full-width">
          <h2>Заметки</h2>
          <textarea 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            placeholder="Внутренние заметки по брони..."
          />
        </div>
      </div>

      <div className="form-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={handleSave} className="admin-button primary" disabled={saving}>
          {saving ? 'Сохранение...' : 'Сохранить изменения'}
        </button>
      </div>
    </div>
  );
}