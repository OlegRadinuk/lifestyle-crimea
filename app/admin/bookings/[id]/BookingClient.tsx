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
  is_deleted?: boolean;
  deleted_at?: string | null;
};

export default function BookingClient({ booking: initialBooking }: { booking: Booking }) {
  const router = useRouter();
  const [booking, setBooking] = useState(initialBooking);
  const [notes, setNotes] = useState(initialBooking.manager_notes);
  const [prepaidAmount, setPrepaidAmount] = useState(initialBooking.prepaid_amount);
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDeleted = Boolean(booking.is_deleted);
  // deleted_at — CURRENT_TIMESTAMP SQLite (UTC без 'Z'): нормализуем, иначе дата читается как локальная
  const deletedAtRaw = booking.deleted_at;
  const deletedLabel = deletedAtRaw
    ? new Date(deletedAtRaw.includes('T') ? deletedAtRaw : `${deletedAtRaw.replace(' ', 'T')}Z`).toLocaleDateString()
    : '';

  const readError = async (res: Response, fallback: string) => {
    try {
      const data = await res.json();
      return typeof data?.error === 'string' && data.error ? data.error : fallback;
    } catch {
      return fallback;
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/restore`, { method: 'POST' });
      if (!res.ok) {
        setError(await readError(res, 'Не удалось восстановить заявку'));
        return;
      }
      setBooking({ ...booking, is_deleted: false, deleted_at: null });
      router.refresh();
    } catch (err) {
      console.error('Error restoring:', err);
      setError('Не удалось восстановить заявку');
    } finally {
      setRestoring(false);
    }
  };

  const handleSave = async () => {
    if (isDeleted) return;
    setSaving(true);
    setError(null);
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
      } else {
        setError(await readError(res, 'Ошибка при сохранении'));
      }
    } catch (err) {
      console.error('Error saving:', err);
      setError('Ошибка при сохранении');
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

      {isDeleted && (
        <div className="admin-card booking-trash-banner">
          <span>
            Заявка в корзине{deletedLabel ? ` с ${deletedLabel}` : ''}
          </span>
          <button
            className="admin-button small success"
            onClick={handleRestore}
            disabled={restoring}
          >
            {restoring ? 'Восстановление...' : 'Восстановить'}
          </button>
        </div>
      )}
      {error && (
        <div className="booking-error" role="alert" aria-live="polite">{error}</div>
      )}

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
              disabled={isDeleted}
              onClick={() => setBooking({ ...booking, status: 'pending' })}
            >
              🟡 Ожидает
            </button>
            <button 
              className={`status-btn ${booking.status === 'confirmed' ? 'active' : ''}`}
              disabled={isDeleted}
              onClick={() => setBooking({ ...booking, status: 'confirmed' })}
            >
              🟢 Подтверждена
            </button>
            <button 
              className={`status-btn ${booking.status === 'cancelled' ? 'active' : ''}`}
              disabled={isDeleted}
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
              disabled={isDeleted}
              onChange={(e) => setPrepaidAmount(Number(e.target.value))}
              placeholder="Сумма предоплаты"
            />
          </div>
        </div>

        <div className="admin-card full-width">
          <h2>Заметки</h2>
          <textarea 
            value={notes} 
            disabled={isDeleted}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            placeholder="Внутренние заметки по брони..."
          />
        </div>
      </div>

      {!isDeleted && (
        <div className="form-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleSave} className="admin-button primary" disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </div>
      )}

      <style jsx>{`
        .booking-trash-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 16px;
          background: #fff4e5;
          color: #8a4b00;
        }
        .booking-error {
          padding: 10px 14px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 14px;
          background: #fdecea;
          color: #b71c1c;
        }
      `}</style>
    </div>
  );
}