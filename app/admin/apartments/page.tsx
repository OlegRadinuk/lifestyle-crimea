'use client';

import { useEffect, useRef, useState } from 'react';
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
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const touchDragIdx = useRef<number | null>(null);

  useEffect(() => { fetchApartments(); }, []);

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

  const saveOrder = async (updated: Apartment[]) => {
    setSaving(true);
    try {
      await fetch('/api/admin/apartments/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated.map((a) => ({ id: a.id, sort_order: a.sort_order }))),
      });
    } catch (error) {
      console.error('Error saving order:', error);
    } finally {
      setSaving(false);
    }
  };

  const performMove = (from: number, to: number) => {
    if (to < 0 || to >= apartments.length || from === to) return;
    const updated = [...apartments];
    const [removed] = updated.splice(from, 1);
    updated.splice(to, 0, removed);
    const renumbered = updated.map((a, i) => ({ ...a, sort_order: i + 1 }));
    setApartments(renumbered);
    saveOrder(renumbered);
  };

  // === Desktop HTML5 drag ===
  const handleDragStart = (index: number) => setDraggingIdx(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setOverIdx(index);
  };
  const handleDrop = (index: number) => {
    if (draggingIdx !== null) performMove(draggingIdx, index);
    setDraggingIdx(null);
    setOverIdx(null);
  };
  const handleDragEnd = () => {
    setDraggingIdx(null);
    setOverIdx(null);
  };

  // === Mobile touch drag ===
  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    touchDragIdx.current = index;
    setDraggingIdx(index);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchDragIdx.current === null) return;
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const card = el?.closest('[data-apt-idx]') as HTMLElement | null;
    if (card) {
      const idx = parseInt(card.dataset.aptIdx ?? '-1', 10);
      if (idx >= 0 && idx !== touchDragIdx.current) setOverIdx(idx);
    }
  };

  const handleTouchEnd = () => {
    if (touchDragIdx.current !== null && overIdx !== null) {
      performMove(touchDragIdx.current, overIdx);
    }
    touchDragIdx.current = null;
    setDraggingIdx(null);
    setOverIdx(null);
  };

  if (loading) return <div className="admin-loading">Загрузка...</div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Апартаменты</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {saving && <span className="saving-hint">Сохранение порядка...</span>}
          <Link href="/admin/apartments/new" className="admin-button primary">
            + Добавить
          </Link>
        </div>
      </div>

      <p className="drag-hint">Перетащите за ≡ чтобы изменить порядок</p>

      <div className="apt-cards" ref={listRef}>
        {apartments.length === 0 && (
          <p style={{ color: '#64748b', padding: '24px 0' }}>Нет апартаментов</p>
        )}
        {apartments.map((apt, index) => (
          <div
            key={apt.id}
            data-apt-idx={index}
            className={`apt-card ${draggingIdx === index ? 'dragging' : ''} ${overIdx === index ? 'drop-target' : ''}`}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={() => handleDrop(index)}
            onDragEnd={handleDragEnd}
          >
            {/* Drag handle */}
            <div
              className="drag-handle"
              draggable
              onDragStart={() => handleDragStart(index)}
              onTouchStart={(e) => handleTouchStart(e, index)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              title="Перетащить"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="9" cy="5" r="1.5" /><circle cx="15" cy="5" r="1.5" />
                <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                <circle cx="9" cy="19" r="1.5" /><circle cx="15" cy="19" r="1.5" />
              </svg>
            </div>

            {/* Основная информация */}
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
                {apt.images_count !== undefined && (
                  <span className="apt-meta-item">
                    <span className="apt-meta-label">Фото:</span>{' '}
                    <span className={apt.images_count === 0 ? 'no-photos' : ''}>
                      {apt.images_count}
                    </span>
                  </span>
                )}
                <span className={`status-badge ${apt.is_active ? 'active' : 'inactive'}`}>
                  {apt.is_active ? 'Активен' : 'Неактивен'}
                </span>
              </div>
            </div>

            {/* Кнопки */}
            <div className="apt-card__actions">
              <div className="move-btns">
                <button
                  type="button"
                  onClick={() => performMove(index, index - 1)}
                  className="admin-button small icon-btn"
                  disabled={index === 0}
                  title="Вверх"
                >↑</button>
                <button
                  type="button"
                  onClick={() => performMove(index, index + 1)}
                  className="admin-button small icon-btn"
                  disabled={index === apartments.length - 1}
                  title="Вниз"
                >↓</button>
              </div>

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
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .drag-hint {
          font-size: 12px;
          color: #94a3b8;
          margin: 0 0 8px;
        }

        .saving-hint {
          font-size: 12px;
          color: #139ab6;
          animation: pulse 1s ease infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .apt-cards {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 4px;
        }

        .apt-card {
          background: white;
          border-radius: 12px;
          padding: 14px 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          border: 2px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: border-color 0.15s, box-shadow 0.15s, opacity 0.15s;
        }

        .apt-card.dragging {
          opacity: 0.4;
          border-color: #cbd5e1;
        }

        .apt-card.drop-target {
          border-color: #139ab6;
          box-shadow: 0 0 0 3px rgba(19, 154, 182, 0.2);
        }

        .drag-handle {
          color: #cbd5e1;
          cursor: grab;
          padding: 4px;
          flex-shrink: 0;
          touch-action: none;
          user-select: none;
          min-width: 32px;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: color 0.15s, background 0.15s;
        }

        .drag-handle:hover {
          color: #64748b;
          background: #f1f5f9;
        }

        .drag-handle:active {
          cursor: grabbing;
        }

        .apt-card__body {
          flex: 1;
          min-width: 0;
        }

        .apt-card__title {
          font-size: 15px;
          font-weight: 600;
          color: #1a2634;
          margin-bottom: 6px;
          word-break: break-word;
        }

        .apt-card__meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }

        .apt-meta-item {
          font-size: 13px;
          color: #475569;
        }

        .apt-meta-label {
          color: #94a3b8;
        }

        .no-photos {
          color: #f97316;
          font-weight: 600;
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

        .move-btns {
          display: flex;
          gap: 4px;
        }

        .icon-btn {
          min-width: 36px;
          min-height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          padding: 0;
        }

        @media (min-width: 640px) {
          .apt-card__actions {
            flex-direction: row;
            align-items: center;
          }
        }

        @media (max-width: 480px) {
          .apt-card {
            padding: 12px 10px;
            gap: 8px;
          }

          .apt-card__title {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}
