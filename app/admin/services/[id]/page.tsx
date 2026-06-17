'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ServiceForm, { type ServiceFormData } from '../ServiceForm';

export default function EditServicePage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [initial, setInitial] = useState<ServiceFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/services/${id}`)
      .then((res) => {
        if (res.status === 401) { window.location.href = '/admin/login'; return null; }
        if (!res.ok) { setNotFound(true); return null; }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setInitial({
            id: data.id,
            category: data.category,
            title: data.title ?? '',
            icon: data.icon ?? '',
            is_active: Boolean(data.is_active),
            sort_order: data.sort_order ?? 0,
          });
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="admin-loading">Загрузка...</div>;
  if (notFound || !initial) {
    return (
      <div className="admin-page">
        <p style={{ color: '#64748b' }}>Пункт не найден.</p>
        <Link href="/admin/services" className="admin-button">← К списку</Link>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Редактировать пункт</h1>
        <Link href="/admin/services" className="admin-button">← Назад</Link>
      </div>
      <ServiceForm initial={initial} />
    </div>
  );
}
