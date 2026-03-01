'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Apartment = {
  id: string;
  title: string;
  max_guests: number;
  price_base: number;
  is_active: boolean;
};

export default function ApartmentsPage() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApartments();
  }, []);

  const fetchApartments = async () => {
    const res = await fetch('/api/admin/apartments');
    const data = await res.json();
    setApartments(data);
    setLoading(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    await fetch(`/api/admin/apartments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current }),
    });
    fetchApartments();
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
                  <span className={`status-badge ${apt.is_active ? 'active' : 'inactive'}`}>
                    {apt.is_active ? 'Активен' : 'Неактивен'}
                  </span>
                </td>
                <td className="actions">
                  <Link href={`/admin/apartments/${apt.id}`} className="admin-button small">
                    Редактировать
                  </Link>
                  <button
                    onClick={() => toggleActive(apt.id, apt.is_active)}
                    className="admin-button small warning"
                  >
                    {apt.is_active ? 'Деактивировать' : 'Активировать'}
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