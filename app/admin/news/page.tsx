'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type NewsItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image: string | null;
  is_published: number;
  is_featured: number;
  published_at: string | null;
  updated_at: string;
};

export default function AdminNewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/admin/news');
      if (!res.ok) {
        if (res.status === 401) window.location.href = '/admin/login';
        return;
      }
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error fetching news:', e);
    } finally {
      setLoading(false);
    }
  };

  const togglePublished = async (item: NewsItem) => {
    setBusyId(item.id);
    try {
      await fetch(`/api/admin/news/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !item.is_published }),
      });
      await fetchItems();
    } catch (e) {
      console.error('Error toggling published:', e);
    } finally {
      setBusyId(null);
    }
  };

  const toggleFeatured = async (item: NewsItem) => {
    setBusyId(item.id);
    try {
      await fetch(`/api/admin/news/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_featured: !item.is_featured }),
      });
      await fetchItems();
    } catch (e) {
      console.error('Error toggling featured:', e);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (item: NewsItem) => {
    if (!confirm(`Удалить новость «${item.title}»?`)) return;
    setBusyId(item.id);
    try {
      await fetch(`/api/admin/news/${item.id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((n) => n.id !== item.id));
    } catch (e) {
      console.error('Error deleting news:', e);
    } finally {
      setBusyId(null);
    }
  };

  const formatDate = (v: string | null) => {
    if (!v) return '—';
    const d = new Date(v);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('ru-RU');
  };

  if (loading) return <div className="admin-loading">Загрузка...</div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Новости и предложения</h1>
        <Link href="/admin/news/new" className="admin-button primary">+ Добавить</Link>
      </div>

      <div className="news-admin-list">
        {items.length === 0 && (
          <p style={{ color: '#64748b', padding: '24px 0' }}>Новостей пока нет. Создайте первую.</p>
        )}

        {items.map((item) => (
          <div key={item.id} className="news-admin-card">
            <div className="news-admin-card__media">
              {item.cover_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.cover_image} alt="" />
              ) : (
                <div className="news-admin-card__noimg">Нет фото</div>
              )}
            </div>

            <div className="news-admin-card__body">
              <div className="news-admin-card__title">{item.title}</div>
              <div className="news-admin-card__meta">
                <span className={`status-badge ${item.is_published ? 'active' : 'inactive'}`}>
                  {item.is_published ? 'Опубликована' : 'Черновик'}
                </span>
                {item.is_featured ? <span className="news-flag">В топе</span> : null}
                <span className="news-admin-card__date">{formatDate(item.published_at)}</span>
                <span className="news-admin-card__slug">/news/{item.slug}</span>
              </div>
            </div>

            <div className="news-admin-card__actions">
              <button
                type="button"
                className="admin-button small"
                disabled={busyId === item.id}
                onClick={() => togglePublished(item)}
              >
                {item.is_published ? 'Снять с публикации' : 'Опубликовать'}
              </button>
              <button
                type="button"
                className="admin-button small"
                disabled={busyId === item.id}
                onClick={() => toggleFeatured(item)}
              >
                {item.is_featured ? 'Убрать из топа' : 'В топ-3'}
              </button>
              <Link href={`/admin/news/${item.id}`} className="admin-button small">Редактировать</Link>
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
        ))}
      </div>

      <style jsx>{`
        .news-admin-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .news-admin-card {
          display: flex;
          gap: 16px;
          align-items: center;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px;
          flex-wrap: wrap;
        }
        .news-admin-card__media {
          width: 96px;
          height: 64px;
          border-radius: 8px;
          overflow: hidden;
          flex-shrink: 0;
          background: #eef6f8;
        }
        .news-admin-card__media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .news-admin-card__noimg {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          color: #94a3b8;
        }
        .news-admin-card__body {
          flex: 1;
          min-width: 200px;
        }
        .news-admin-card__title {
          font-weight: 600;
          font-size: 15px;
          color: #143a44;
          margin-bottom: 8px;
        }
        .news-admin-card__meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          font-size: 12.5px;
          color: #64748b;
        }
        .news-flag {
          background: #fff3df;
          color: #b8721c;
          padding: 2px 8px;
          border-radius: 999px;
          font-weight: 600;
          font-size: 11.5px;
        }
        .news-admin-card__slug {
          color: #139ab6;
          font-family: monospace;
        }
        .news-admin-card__actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        @media (max-width: 640px) {
          .news-admin-card__actions {
            width: 100%;
          }
          .news-admin-card__actions :global(.admin-button) {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
}
