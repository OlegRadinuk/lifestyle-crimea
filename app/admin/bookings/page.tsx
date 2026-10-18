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
  deleted_at?: string | null;
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [trashCount, setTrashCount] = useState(0);
  const [view, setView] = useState<'active' | 'trash'>('active');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const isTrash = view === 'trash';

  const readError = async (res: Response, fallback: string) => {
    try {
      const data = await res.json();
      return typeof data?.error === 'string' && data.error ? data.error : fallback;
    } catch {
      return fallback;
    }
  };

  const fetchTrashCount = async () => {
    try {
      const res = await fetch('/api/admin/bookings?trash=1');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setTrashCount(data.length);
    } catch (error) {
      console.error('Error fetching trash count:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const params = new URLSearchParams();
      if (isTrash) params.set('trash', '1');
      if (filter !== 'all') params.set('status', filter);
      const qs = params.toString();
      const res = await fetch(`/api/admin/bookings${qs ? `?${qs}` : ''}`);
      if (!res.ok) {
        setNotice({ type: 'error', text: await readError(res, 'Не удалось загрузить заявки') });
        return;
      }
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setNotice({ type: 'error', text: 'Не удалось загрузить заявки' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, view]);

  useEffect(() => {
    fetchTrashCount();
  }, []);

  const refreshAll = async () => {
    await Promise.all([fetchBookings(), fetchTrashCount()]);
  };

  const runAction = async (
    id: string,
    url: string,
    init: RequestInit,
    okText: string,
    failText: string
  ) => {
    setBusyId(id);
    setNotice(null);
    try {
      const res = await fetch(url, init);
      if (!res.ok) {
        setNotice({ type: 'error', text: await readError(res, failText) });
        return;
      }
      setNotice({ type: 'ok', text: okText });
      await refreshAll();
    } catch (error) {
      console.error(failText, error);
      setNotice({ type: 'error', text: failText });
    } finally {
      setBusyId(null);
    }
  };

  const handleTrash = async (id: string) => {
    if (!confirm('Перенести заявку в корзину? Её можно будет восстановить.')) return;
    await runAction(id, `/api/admin/bookings/${id}`, { method: 'DELETE' },
      'Заявка перенесена в корзину', 'Не удалось перенести заявку в корзину');
  };

  const handleRestore = async (id: string) => {
    await runAction(id, `/api/admin/bookings/${id}/restore`, { method: 'POST' },
      'Заявка восстановлена', 'Не удалось восстановить заявку');
  };

  const handlePermanent = async (id: string) => {
    if (!confirm('Удалить заявку навсегда? Заявку нельзя будет восстановить.')) return;
    await runAction(id, `/api/admin/bookings/${id}?permanent=1`, { method: 'DELETE' },
      'Заявка удалена навсегда', 'Не удалось удалить заявку навсегда');
  };

  const switchView = (next: 'active' | 'trash') => {
    if (next === view) return;
    setNotice(null);
    setLoading(true);
    setView(next);
  };

  // deleted_at — CURRENT_TIMESTAMP SQLite (UTC, 'YYYY-MM-DD HH:MM:SS'): без 'T…Z' браузер читает как локальное время
  const formatDeleted = (d?: string | null) =>
    d ? new Date(d.includes('T') ? d : `${d.replace(' ', 'T')}Z`).toLocaleDateString() : '';

  const renderActions = (booking: Booking) => {
    const busy = busyId === booking.id;
    return (
      <>
        <Link href={`/admin/bookings/${booking.id}`} className="admin-button small">
          Детали
        </Link>
        {isTrash ? (
          <>
            <button
              className="admin-button small success"
              disabled={busy}
              onClick={() => handleRestore(booking.id)}
            >
              {busy ? '...' : 'Восстановить'}
            </button>
            <button
              className="admin-button small danger"
              disabled={busy}
              onClick={() => handlePermanent(booking.id)}
            >
              Удалить навсегда
            </button>
          </>
        ) : (
          <button
            className="admin-button small danger"
            disabled={busy}
            onClick={() => handleTrash(booking.id)}
          >
            {busy ? 'Перенос...' : 'Удалить'}
          </button>
        )}
      </>
    );
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
        <div className="bookings-view-switch" role="tablist">
          <button
            role="tab"
            aria-selected={!isTrash}
            className={`admin-button small${!isTrash ? ' primary' : ''}`}
            onClick={() => switchView('active')}
          >
            Заявки
          </button>
          <button
            role="tab"
            aria-selected={isTrash}
            className={`admin-button small${isTrash ? ' primary' : ''}`}
            onClick={() => switchView('trash')}
          >
            Корзина ({trashCount})
          </button>
        </div>
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

      {notice && (
        <div className={`bookings-notice ${notice.type}`} role="status" aria-live="polite">
          {notice.text}
        </div>
      )}

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
              {isTrash && <th>Удалена</th>}
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
                {isTrash && <td>{formatDeleted(booking.deleted_at)}</td>}
                <td className="actions">{renderActions(booking)}</td>
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
            {isTrash && (
              <div className="booking-card__deleted">Удалена: {formatDeleted(booking.deleted_at)}</div>
            )}
            <div className="booking-card__actions">{renderActions(booking)}</div>
          </div>
        ))}
        {bookings.length === 0 && (
          <p className="bookings-empty">{isTrash ? 'Корзина пуста' : 'Нет бронирований'}</p>
        )}
      </div>

      <style jsx>{`
        /* Мобиль: прячем таблицу, показываем карточки */
        .bookings-cards-wrap { display: none; }
        .bookings-view-switch { display: flex; gap: 8px; flex-wrap: wrap; }
        .bookings-notice { padding: 10px 14px; border-radius: 8px; margin-bottom: 16px; font-size: 14px; }
        .bookings-notice.ok { background: #e8f5e9; color: #2e7d32; }
        .bookings-notice.error { background: #fdecea; color: #b71c1c; }
        .bookings-empty { color: #64748b; padding: 24px 0; }
        .booking-card__deleted { font-size: 13px; color: #b71c1c; margin-bottom: 10px; }

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
            flex-wrap: wrap;
            gap: 8px;
          }

          .booking-card__actions .admin-button.small {
            flex: 1 1 auto;
            min-width: 0;
            text-align: center;
            padding: 8px 12px;
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
}