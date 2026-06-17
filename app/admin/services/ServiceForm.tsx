'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  SERVICE_ICON_KEYS,
  SERVICE_ICON_LABELS,
  resolveServiceIcon,
} from '@/app/services/icons';

export type ServiceCategory = 'apartment' | 'service' | 'infrastructure';

export type ServiceFormData = {
  id?: string;
  category: ServiceCategory;
  title: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
};

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  apartment: 'В апартаментах',
  service: 'Услуги',
  infrastructure: 'Инфраструктура',
};

export default function ServiceForm({ initial }: { initial?: Partial<ServiceFormData> }) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  const [category, setCategory] = useState<ServiceCategory>(initial?.category ?? 'apartment');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? '');
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [sortOrder, setSortOrder] = useState<number>(initial?.sort_order ?? 0);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PreviewIcon = resolveServiceIcon(icon);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Введите название');
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const payload = {
        category,
        title: title.trim(),
        icon: icon || '',
        is_active: isActive,
        sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
      };

      const url = isEdit ? `/api/admin/services/${initial!.id}` : '/api/admin/services';
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Не удалось сохранить');
      }
      router.push('/admin/services');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
      setSaving(false);
    }
  };

  return (
    <form className="svc-form" onSubmit={handleSubmit}>
      {error && <div className="svc-form__error">{error}</div>}

      <label className="svc-form__field">
        <span>Категория *</span>
        <select value={category} onChange={(e) => setCategory(e.target.value as ServiceCategory)}>
          {(Object.keys(CATEGORY_LABELS) as ServiceCategory[]).map((c) => (
            <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
          ))}
        </select>
      </label>

      <label className="svc-form__field">
        <span>Название *</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Например: Кондиционер"
          maxLength={200}
          required
        />
      </label>

      <label className="svc-form__field">
        <span>Иконка</span>
        <div className="svc-form__icon-row">
          <span className="svc-form__icon-preview">
            <PreviewIcon />
          </span>
          <select value={icon} onChange={(e) => setIcon(e.target.value)}>
            <option value="">— по умолчанию —</option>
            {SERVICE_ICON_KEYS.map((key) => (
              <option key={key} value={key}>{SERVICE_ICON_LABELS[key] ?? key}</option>
            ))}
          </select>
        </div>
        <small>Если иконка не выбрана — покажется значок по умолчанию.</small>
      </label>

      <label className="svc-form__field">
        <span>Порядок</span>
        <input
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
          step={1}
        />
        <small>Меньше — выше в списке внутри категории.</small>
      </label>

      <label className="svc-form__check">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        <span>Показывать на сайте</span>
      </label>

      <div className="svc-form__actions">
        <button type="submit" className="admin-button primary" disabled={saving}>
          {saving ? 'Сохранение…' : isEdit ? 'Сохранить' : 'Создать'}
        </button>
        <button type="button" className="admin-button" onClick={() => router.push('/admin/services')} disabled={saving}>
          Отмена
        </button>
      </div>

      <style jsx>{`
        .svc-form {
          max-width: 560px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .svc-form__error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 14px;
        }
        .svc-form__field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .svc-form__field > span {
          font-weight: 600;
          font-size: 14px;
          color: #143a44;
        }
        .svc-form__field input[type='text'],
        .svc-form__field input[type='number'],
        .svc-form__field select {
          width: 100%;
          padding: 11px 14px;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          font-size: 15px;
          font-family: inherit;
          color: #143a44;
          background: #fff;
        }
        .svc-form__field input:focus,
        .svc-form__field select:focus {
          outline: none;
          border-color: #139ab6;
          box-shadow: 0 0 0 3px rgba(19, 154, 182, 0.12);
        }
        .svc-form__icon-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .svc-form__icon-row select {
          flex: 1;
        }
        .svc-form__icon-preview {
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #f0f9fb;
          color: #139ab6;
        }
        .svc-form__icon-preview :global(svg) {
          width: 24px;
          height: 24px;
        }
        .svc-form__field small {
          color: #94a3b8;
          font-size: 12px;
        }
        .svc-form__check {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #143a44;
          cursor: pointer;
        }
        .svc-form__check input {
          width: 18px;
          height: 18px;
          accent-color: #139ab6;
        }
        .svc-form__actions {
          display: flex;
          gap: 12px;
          margin-top: 4px;
        }
      `}</style>
    </form>
  );
}
