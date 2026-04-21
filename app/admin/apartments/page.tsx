'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Apartment = {
  id: string;
  title: string;
  max_guests: number;
  price_base: number;
  breakfast_price: number;
  sort_order: number;
  is_active: boolean;
  images_count?: number;
};

export default function ApartmentsPage() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApartments();
  }, []);

  const fetchApartments = async () => {
    try {
      const res = await fetch('/api/admin/apartments');
      if (!res.ok) {
        if (res.status === 401) window.location.href = '/admin/login';
        return;
      }
      const data = await res.json();
      setApartments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching apartments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Удалить апартамент "${title}"?`)) return;
    try {
      await fetch(`/api/admin/apartments/${id}`, { method: 'DELETE' });
      setApartments((prev) => prev.filter((a) => a.id !== id));
    } catch (error) {
      console.error('Error deleting apartment:', error);
    }
  };

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= apartments.length) return;

    const updated = [...apartments];
    const tempOrder = updated[index].sort_order;
    updated[index] = { ...updated[index], sort_order: updated[swapIndex].sort_order };
    updated[swapIndex] = { ...updated[swapIndex], sort_order: tempOrder };
    // Swap positions in array too
    [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
    setApartments(updated);

    try {
      await fetch('/api/admin/apartments/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          updated.map((a) => ({ id: a.id, sort_order: a.sort_order }))
        ),
      });
    } catch (error) {
      console.error('Error reordering apartments:', error);
    }
  };

  if (loading) return <div className="admin-loading">Загрузка...</div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Апартаменты</h1>
        <Link href="/admin/apartments/new" className="admin-button primary">
          + Добавить
        </Link>
      </div>

      <div className="apt-cards">
        {apartments.length === 0 && (
          <p style={{ color: '#64748b', padding: '24px 0' }}>Нет апартаментов</p>
        )}
        {apartments.map((apt, index) => (
          <div key={apt.id} className="apt-card">
            <div className="apt-card__body">
              <div className="apt-card__title">{apt.title}</div>
              <div className="apt-card__meta">
                <span className="apt-meta-item">
                  <span className="apt-meta-label">Гостей:</span> {apt.max_guests}
                </span>
                <span className="apt-meta-item">
                  <span className="apt-meta-label">Цена:</span>{' '}
                  {apt.price_base.toLocaleString('ru-RU')} ₽
                </span>
                <span className={`status-badge ${apt.is_active ? 'active' : 'inactive'}`}>
                  {apt.is_active ? 'Активен' : 'Неактивен'}
                </span>
              </div>
            </div>

            <div className="apt-card__actions">
              <Link
                href={`/admin/apartments/${apt.id}`}
                className="admin-button small"
                title="Редактировать"
              >
                Редактировать
              </Link>

              <button
                type="button"
                onClick={() => handleDelete(apt.id, apt.title)}
                className="admin-button small warning"
                title="Удалить"
              >
                Удалить
              </button>

              <div className="apt-sort-btns">
                <button
                  type="button"
                  onClick={() => handleReorder(index, 'up')}
                  className="admin-button small"
                  disabled={index === 0}
                  title="Переместить выше"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => handleReorder(index, 'down')}
                  className="admin-button small"
                  disabled={index === apartments.length - 1}
                  title="Переместить ниже"
                >
                  ↓
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .apt-cards {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 8px;
        }

        .apt-card {
          background: white;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .apt-card__body {
          flex: 1;
          min-width: 0;
        }

        .apt-card__title {
          font-size: 16px;
          font-weight: 600;
          color: #1a2634;
          margin-bottom: 8px;
          word-break: break-word;
        }

        .apt-card__meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
        }

        .apt-meta-item {
          font-size: 13px;
          color: #475569;
        }

        .apt-meta-label {
          color: #94a3b8;
        }

        .status-badge {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }

        .status-badge.active {
          background: #dcfce7;
          color: #166534;
        }

        .status-badge.inactive {
          background: #f1f5f9;
          color: #64748b;
        }

        .apt-card__actions {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex-shrink: 0;
        }

        .apt-sort-btns {
          display: flex;
          gap: 4px;
        }

        @media (min-width: 640px) {
          .apt-card__actions {
            flex-direction: row;
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
}
