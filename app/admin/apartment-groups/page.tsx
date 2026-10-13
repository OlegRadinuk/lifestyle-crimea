'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type ProximityType = 'adjacent' | 'same_floor' | 'stacked';

const PROXIMITY_LABELS: Record<ProximityType, string> = {
  adjacent: 'Смежные (двери рядом)',
  same_floor: 'Рядом на этаже',
  stacked: 'Этажом выше/ниже',
};

type GroupItem = { group_id: string; apartment_id: string };

type ApartmentGroup = {
  id: string;
  title: string;
  proximity: ProximityType;
  building: number | null;
  note: string | null;
  sort: number;
  is_active: number;
  items: GroupItem[];
};

export default function AdminApartmentGroupsPage() {
  const [groups, setGroups] = useState<ApartmentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => { fetchGroups(); }, []);

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/admin/apartment-groups');
      if (!res.ok) {
        if (res.status === 401) window.location.href = '/admin/login';
        return;
      }
      const data = await res.json();
      setGroups(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error fetching groups:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (group: ApartmentGroup) => {
    setBusyId(group.id);
    try {
      await fetch(`/api/admin/apartment-groups/${group.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !group.is_active }),
      });
      await fetchGroups();
    } catch (e) {
      console.error('Error toggling group:', e);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (group: ApartmentGroup) => {
    if (!confirm(`Удалить связку «${group.title}»?`)) return;
    setBusyId(group.id);
    try {
      await fetch(`/api/admin/apartment-groups/${group.id}`, { method: 'DELETE' });
      setGroups((prev) => prev.filter((g) => g.id !== group.id));
    } catch (e) {
      console.error('Error deleting group:', e);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <div className="admin-loading">Загрузка...</div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Связки апартаментов</h1>
        <Link href="/admin/apartment-groups/new" className="admin-button primary">+ Добавить связку</Link>
      </div>

      <p className="groups-hint">
        Связки — предложения для больших компаний (4+ гостей). Апартаменты в связке предлагаются
        вместе. Тип «Смежные» означает соседние двери в коридоре — НЕ внутреннюю дверь между
        номерами. Черновики (неактивные) не показываются на сайте.
      </p>

      {groups.length === 0 ? (
        <div className="groups-empty">
          Связок пока нет.{' '}
          <Link href="/admin/apartment-groups/new">Создайте первую</Link>
        </div>
      ) : (
        <div className="groups-list">
          {groups.map((group) => (
            <div key={group.id} className={`group-card${group.is_active ? ' group-card--active' : ''}`}>
              <div className="group-card__head">
                <div className="group-card__meta">
                  <span className="group-card__title">{group.title}</span>
                  {group.building && (
                    <span className="group-card__badge">Корпус {group.building}</span>
                  )}
                  <span className="group-card__proximity">{PROXIMITY_LABELS[group.proximity]}</span>
                </div>
                <div className="group-card__status">
                  {group.is_active ? (
                    <span className="status-pill status-pill--on">Активна</span>
                  ) : (
                    <span className="status-pill status-pill--off">Черновик</span>
                  )}
                </div>
              </div>

              <div className="group-card__items">
                {group.items.length > 0 ? (
                  <span className="group-card__item-count">{group.items.length} апартамента</span>
                ) : (
                  <span className="group-card__item-count group-card__item-count--empty">Нет апартаментов</span>
                )}
              </div>

              {group.note && (
                <div className="group-card__note">{group.note}</div>
              )}

              <div className="group-card__actions">
                <Link href={`/admin/apartment-groups/${group.id}`} className="admin-button small">
                  Редактировать
                </Link>
                <button
                  type="button"
                  className={`admin-button small ${group.is_active ? 'warning' : 'primary'}`}
                  disabled={busyId === group.id}
                  onClick={() => toggleActive(group)}
                >
                  {busyId === group.id ? '...' : group.is_active ? 'Скрыть' : 'Опубликовать'}
                </button>
                <button
                  type="button"
                  className="admin-button small danger"
                  disabled={busyId === group.id}
                  onClick={() => handleDelete(group)}
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .groups-hint {
          margin-bottom: 20px;
          font-size: 13px;
          color: #64748b;
          line-height: 1.6;
          max-width: 700px;
        }

        .groups-empty {
          padding: 40px;
          text-align: center;
          color: #94a3b8;
          font-size: 15px;
        }

        .groups-empty a {
          color: #139ab6;
          text-decoration: underline;
        }

        .groups-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .group-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px 20px;
          opacity: 0.85;
        }

        .group-card--active {
          opacity: 1;
          border-color: #bae6fd;
        }

        .group-card__head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 8px;
        }

        .group-card__meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }

        .group-card__title {
          font-size: 15px;
          font-weight: 600;
          color: #1a2634;
        }

        .group-card__badge {
          font-size: 12px;
          padding: 2px 8px;
          background: #e0f2fe;
          color: #0369a1;
          border-radius: 12px;
          font-weight: 500;
        }

        .group-card__proximity {
          font-size: 12px;
          color: #64748b;
        }

        .status-pill {
          font-size: 12px;
          padding: 3px 10px;
          border-radius: 12px;
          font-weight: 500;
          white-space: nowrap;
        }

        .status-pill--on {
          background: #dcfce7;
          color: #166534;
        }

        .status-pill--off {
          background: #f1f5f9;
          color: #64748b;
        }

        .group-card__items {
          margin-bottom: 8px;
        }

        .group-card__item-count {
          font-size: 13px;
          color: #475569;
        }

        .group-card__item-count--empty {
          color: #f59e0b;
        }

        .group-card__note {
          font-size: 13px;
          color: #64748b;
          font-style: italic;
          margin-bottom: 8px;
        }

        .group-card__actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #f1f5f9;
        }

        .admin-button.small {
          padding: 6px 14px;
          font-size: 13px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          background: white;
          color: #1a2634;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
        }

        .admin-button.small:hover:not(:disabled) {
          border-color: #139ab6;
          color: #139ab6;
        }

        .admin-button.small.primary {
          background: #139ab6;
          color: white;
          border-color: #139ab6;
        }

        .admin-button.small.primary:hover:not(:disabled) {
          background: #0f7a91;
        }

        .admin-button.small.warning {
          background: #fff7ed;
          color: #b45309;
          border-color: #fed7aa;
        }

        .admin-button.small.warning:hover:not(:disabled) {
          background: #ffedd5;
        }

        .admin-button.small.danger {
          background: #fef2f2;
          color: #b91c1c;
          border-color: #fecaca;
        }

        .admin-button.small.danger:hover:not(:disabled) {
          background: #fee2e2;
        }

        .admin-button.small:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
