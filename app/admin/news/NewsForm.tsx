'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export type NewsFormData = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string | null;
  is_published: boolean;
  is_featured: boolean;
};

export default function NewsForm({ initial }: { initial?: Partial<NewsFormData> }) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  const [title, setTitle] = useState(initial?.title ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [isPublished, setIsPublished] = useState(initial?.is_published ?? false);
  const [isFeatured, setIsFeatured] = useState(initial?.is_featured ?? false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(initial?.cover_image ?? null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setCoverFile(file);
    if (file) setCoverPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Введите заголовок');
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append('title', title.trim());
      if (slug.trim()) fd.append('slug', slug.trim());
      fd.append('excerpt', excerpt);
      fd.append('content', content);
      fd.append('is_published', isPublished ? 'true' : 'false');
      fd.append('is_featured', isFeatured ? 'true' : 'false');
      if (coverFile) fd.append('cover', coverFile);

      const url = isEdit ? `/api/admin/news/${initial!.id}` : '/api/admin/news';
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, body: fd });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Не удалось сохранить');
      }
      router.push('/admin/news');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
      setSaving(false);
    }
  };

  return (
    <form className="news-form" onSubmit={handleSubmit}>
      {error && <div className="news-form__error">{error}</div>}

      <label className="news-form__field">
        <span>Заголовок *</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Например: Скидка 15% на бронирование в июне"
          required
        />
      </label>

      <label className="news-form__field">
        <span>Slug (URL)</span>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="оставьте пустым — сгенерируется из заголовка"
        />
        <small>Адрес страницы: /news/{slug || '…'}</small>
      </label>

      <label className="news-form__field">
        <span>Короткое описание (для карточки и SEO)</span>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={3}
          maxLength={300}
          placeholder="1–2 предложения. Попадёт в карточку и в описание при репосте в соцсети."
        />
        <small>{excerpt.length}/300</small>
      </label>

      <label className="news-form__field">
        <span>Полный текст</span>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
          placeholder={'Можно обычным текстом (абзацы — пустой строкой) или HTML (<h2>, <p>, <ul>, <a>…).'}
        />
        <small>Поддерживается простой HTML или обычный текст с абзацами.</small>
      </label>

      <div className="news-form__field">
        <span>Обложка (cover)</span>
        {coverPreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverPreview} alt="" className="news-form__cover-preview" />
        )}
        <input type="file" accept="image/*" onChange={onFileChange} />
        <small>Будет конвертирована в WebP. Рекомендуем горизонтальное фото для красивой OG-карточки.</small>
      </div>

      <div className="news-form__toggles">
        <label className="news-form__check">
          <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
          <span>Опубликовать</span>
        </label>
        <label className="news-form__check">
          <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
          <span>Показать в топ-3 (верхние окошки)</span>
        </label>
      </div>

      <div className="news-form__actions">
        <button type="submit" className="admin-button primary" disabled={saving}>
          {saving ? 'Сохранение…' : isEdit ? 'Сохранить' : 'Создать'}
        </button>
        <button type="button" className="admin-button" onClick={() => router.push('/admin/news')} disabled={saving}>
          Отмена
        </button>
      </div>

      <style jsx>{`
        .news-form {
          max-width: 720px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .news-form__error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 14px;
        }
        .news-form__field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .news-form__field > span {
          font-weight: 600;
          font-size: 14px;
          color: #143a44;
        }
        .news-form__field input[type='text'],
        .news-form__field textarea {
          width: 100%;
          padding: 11px 14px;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          font-size: 15px;
          font-family: inherit;
          color: #143a44;
          background: #fff;
        }
        .news-form__field input[type='text']:focus,
        .news-form__field textarea:focus {
          outline: none;
          border-color: #139ab6;
          box-shadow: 0 0 0 3px rgba(19, 154, 182, 0.12);
        }
        .news-form__field textarea {
          resize: vertical;
          line-height: 1.55;
        }
        .news-form__field small {
          color: #94a3b8;
          font-size: 12px;
        }
        .news-form__cover-preview {
          max-width: 320px;
          width: 100%;
          border-radius: 12px;
          margin-bottom: 8px;
          border: 1px solid #e2e8f0;
        }
        .news-form__toggles {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          padding: 4px 0;
        }
        .news-form__check {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #143a44;
          cursor: pointer;
        }
        .news-form__check input {
          width: 18px;
          height: 18px;
          accent-color: #139ab6;
        }
        .news-form__actions {
          display: flex;
          gap: 12px;
          margin-top: 4px;
        }
      `}</style>
    </form>
  );
}
