'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { resolveServiceIcon } from '@/app/services/icons';

type ServiceCategory = 'apartment' | 'service' | 'infrastructure';

type ServiceItem = {
  id: string;
  category: ServiceCategory;
  title: string;
  icon: string | null;
  sort_order: number;
  is_active: number;
};

const CATEGORY_ORDER: ServiceCategory[] = ['apartment', 'service', 'infrastructure'];
const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  apartment: 'В апартаментах',
  service: 'Услуги',
  infrastructure: 'Инфраструктура',
};

export default function AdminServicesPage() {
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/admin/services');
      if (!res.ok) {
        if (res.status === 401) window.location.href = '/admin/login';
        return;
      }
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error fetching service items:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (item: ServiceItem) => {
    setBusyId(item.id);
    try {
      await fetch(`/api/admin/services/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !item.is_active }),
      });
      await fetchItems();
    } catch (e) {
      console.error('Error toggling active:', e);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (item: ServiceItem) => {
    if (!confirm(`Удалить пункт «${item.title}»?`)) return;
    setBusyId(item.id);
    try {
      await fetch(`/api/admin/services/${item.id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((n) => n.id !== item.id));
    } catch (e) {
      console.error('Error deleting service item:', e);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <div className="admin-loading">Загрузка...</div>;

  const byCategory = (cat: ServiceCategory) =>
    items
      .filter((i) => i.category === cat)
      .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Услуги</h1>
        <Link href="/admin/services/new" className="admin-button primary">+ Добавить пункт</Link>
      </div>

      <p className="svc-hint">
        Эти пункты показываются на странице «Услуги» сайта. Добавляйте только реальные позиции —
        скрытые (неактивные) на сайте не отображаются. Если в категории нет активных пунктов,
        её колонка на сайте скрывается.
      </p>

      {CATEGORY_ORDER.map((cat) => {
        const list = byCategory(cat);
        return (
          <section key={cat} className="svc-group">
            <div className="svc-group__head">
              <h2 className="svc-group__title">{CATEGORY_LABELS[cat]}</h2>
              <Link href={`/admin/services/new?category=${cat}`} className="admin-button small">
                + В эту категорию
              </Link>
            </div>

            {list.length === 0 ? (
              <p className="svc-empty">Пунктов нет. {cat === 'service' ? 'Менеджер может добавить реальные услуги.' : ''}</p>
            ) : (
              <div className="svc-list">
                {list.map((item) => {
                  const Icon = resolveServiceIcon(item.icon);
                  return (
                    <div key={item.id} className={`svc-card ${item.is_active ? '' : 'is-inactive'}`}>
                      <span className="svc-card__icon"><Icon /></span>
                      <div className="svc-card__body">
                        <div className="svc-card__title">{item.title}</div>
                        <div className="svc-card__meta">
                          <span className={`status-badge ${item.is_active ? 'active' : 'inactive'}`}>
                            {item.is_active ? 'На сайте' : 'Скрыт'}
                          </span>
                          <span className="svc-card__order">порядок: {item.sort_order}</span>
                        </div>
                      </div>
                      <div className="svc-card__actions">
                        <button
                          type="button"
                          className="admin-button small"
                          disabled={busyId === item.id}
                          onClick={() => toggleActive(item)}
                        >
                          {item.is_active ? 'Скрыть' : 'Показать'}
                        </button>
                        <Link href={`/admin/services/${item.id}`} className="admin-button small">Изменить</Link>
                        <button
                          type="button"
                          className="admin-button small warning"
                          disabled={busyId === item.id}
                          onClick={() => handleDelete(item)}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}

      <style jsx>{`
        .svc-hint {
          color: #64748b;
          font-size: 13.5px;
          line-height: 1.5;
          max-width: 720px;
          margin: 0 0 24px;
        }
        .svc-group {
          margin-bottom: 32px;
        }
        .svc-group__head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 8px;
        }
        .svc-group__title {
          font-size: 17px;
          font-weight: 700;
          color: #143a44;
          margin: 0;
        }
        .svc-empty {
          color: #94a3b8;
          font-size: 13.5px;
          padding: 8px 0 4px;
        }
        .svc-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .svc-card {
          display: flex;
          gap: 14px;
          align-items: center;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px 14px;
          flex-wrap: wrap;
        }
        .svc-card.is-inactive {
          opacity: 0.62;
          background: #f8fafc;
        }
        .svc-card__icon {
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: #f0f9fb;
          color: #139ab6;
        }
        .svc-card__icon :global(svg) {
          width: 22px;
          height: 22px;
        }
        .svc-card__body {
          flex: 1;
          min-width: 180px;
        }
        .svc-card__title {
          font-weight: 600;
          font-size: 15px;
          color: #143a44;
          margin-bottom: 6px;
        }
        .svc-card__meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          font-size: 12.5px;
          color: #64748b;
        }
        .svc-card__actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        @media (max-width: 640px) {
          .svc-card__actions {
            width: 100%;
          }
          .svc-card__actions :global(.admin-button) {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
}
