'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Apartment = {
  id: string;
  title: string;
  max_guests: number;
  price_base: number;
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
      const data = await res.json();
      setApartments(data);
    } catch (error) {
      console.error('Error fetching apartments:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await fetch(`/api/admin/apartments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !current }),
      });
      fetchApartments();
    } catch (error) {
      console.error('Error toggling apartment:', error);
    }
  };

  if (loading) return <div className="admin-loading">Загрузка...</div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Апартаменты</h1>
        <Link href="/admin/apartments/new" className="admin-button primary">
          + Добавить апартамент
        </Link>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Название</th>
              <th>Гостей</th>
              <th>Цена (базовая)</th>
              <th>Фото</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {apartments.map((apt) => (
              <tr key={apt.id}>
                <td>{apt.title}</td>
                <td>{apt.max_guests}</td>
                <td>{apt.price_base.toLocaleString()} ₽</td>
                <td>
                  <span className={`photo-count ${apt.images_count ? 'has-photos' : 'no-photos'}`}>
                    {apt.images_count || 0} фото
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${apt.is_active ? 'active' : 'inactive'}`}>
                    {apt.is_active ? 'Активен' : 'Неактивен'}
                  </span>
                </td>
                <td className="actions">
                  <Link
                    href={`/admin/apartments/${apt.id}`}
                    className="admin-button small"
                    title="Редактировать"
                  >
                    ✎ Ред.
                  </Link>

                  <Link
                    href={`/admin/apartments/${apt.id}/images`}
                    className={`admin-button small photo-btn ${apt.images_count ? '' : 'empty'}`}
                    title="Управление фото"
                  >
                    🖼️ {apt.images_count || 0}
                  </Link>

                  <button
                    onClick={() => toggleActive(apt.id, apt.is_active)}
                    className={`admin-button small ${apt.is_active ? 'warning' : 'success'}`}
                    title={apt.is_active ? 'Деактивировать' : 'Активировать'}
                  >
                    {apt.is_active ? '🔴 Деакт.' : '🟢 Акт.'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}