'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import NewsForm, { type NewsFormData } from '../NewsForm';

export default function EditNewsPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [initial, setInitial] = useState<NewsFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/news/${id}`)
      .then((res) => {
        if (res.status === 401) { window.location.href = '/admin/login'; return null; }
        if (!res.ok) { setNotFound(true); return null; }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setInitial({
            id: data.id,
            title: data.title ?? '',
            slug: data.slug ?? '',
            excerpt: data.excerpt ?? '',
            content: data.content ?? '',
            cover_image: data.cover_image ?? null,
            is_published: Boolean(data.is_published),
            is_featured: Boolean(data.is_featured),
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
        <p style={{ color: '#64748b' }}>Новость не найдена.</p>
        <Link href="/admin/news" className="admin-button">← К списку</Link>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Редактировать новость</h1>
        <Link href="/admin/news" className="admin-button">← Назад</Link>
      </div>
      <NewsForm initial={initial} />
    </div>
  );
}
