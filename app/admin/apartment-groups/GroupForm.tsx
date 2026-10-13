'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type ProximityType = 'adjacent' | 'same_floor' | 'stacked';

const PROXIMITY_OPTIONS: { value: ProximityType; label: string; hint: string }[] = [
  {
    value: 'adjacent',
    label: 'Смежные',
    hint: 'Соседние двери в коридоре (НЕ внутренняя дверь между номерами)',
  },
  {
    value: 'same_floor',
    label: 'Рядом на этаже',
    hint: 'Чуть дальше на том же этаже',
  },
  {
    value: 'stacked',
    label: 'Этажом выше/ниже',
    hint: 'Прямо выше или ниже',
  },
];

type ApartmentOption = {
  id: string;
  title: string;
  max_guests: number;
  building: number | null;
  floor: number | null;
};

type GroupFormProps = {
  initialData?: {
    id: string;
    title: string;
    proximity: ProximityType;
    building: number | null;
    note: string | null;
    sort: number;
    is_active: number;
    items: { group_id: string; apartment_id: string }[];
  };
};

export default function GroupForm({ initialData }: GroupFormProps) {
  const router = useRouter();
  const isEdit = !!initialData;

  const [title, setTitle] = useState(initialData?.title ?? '');
  const [proximity, setProximity] = useState<ProximityType>(initialData?.proximity ?? 'adjacent');
  const [building, setBuilding] = useState<string>(initialData?.building ? String(initialData.building) : '');
  const [note, setNote] = useState(initialData?.note ?? '');
  const [sort, setSort] = useState<string>(String(initialData?.sort ?? 0));
  const [isActive, setIsActive] = useState(Boolean(initialData?.is_active));
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initialData?.items.map((i) => i.apartment_id) ?? []
  );

  const [apartments, setApartments] = useState<ApartmentOption[]>([]);
  const [loadingApts, setLoadingApts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/apartments')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setApartments(
            data
              .filter((a: any) => !a.deleted_at)
              .map((a: any) => ({
                id: a.id,
                title: a.title,
                max_guests: a.max_guests,
                building: a.building ?? null,
                floor: a.floor ?? null,
              }))
              .sort((a: ApartmentOption, b: ApartmentOption) => a.title.localeCompare(b.title))
          );
        }
      })
      .catch(console.error)
      .finally(() => setLoadingApts(false));
  }, []);

  const toggleApartment = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) {
        setError('Максимум 4 апартамента в одной связке');
        return prev;
      }
      setError(null);
      return [...prev, id];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) { setError('Укажите название'); return; }
    if (selectedIds.length < 2) { setError('Выберите минимум 2 апартамента'); return; }
    if (selectedIds.length > 4) { setError('Максимум 4 апартамента'); return; }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        proximity,
        building: building ? Number(building) : null,
        note: note.trim() || null,
        sort: Number(sort) || 0,
        is_active: isActive,
        apartmentIds: selectedIds,
      };

      const url = isEdit
        ? `/api/admin/apartment-groups/${initialData!.id}`
        : '/api/admin/apartment-groups';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? 'Ошибка при сохранении');
        return;
      }

      router.push('/admin/apartment-groups');
    } catch (e) {
      console.error(e);
      setError('Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  const selectedApts = apartments.filter((a) => selectedIds.includes(a.id));
  const totalGuests = selectedApts.reduce((s, a) => s + a.max_guests, 0);

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">{isEdit ? 'Редактирование связки' : 'Новая связка'}</h1>
        <Link href="/admin/apartment-groups" className="admin-button">← Назад</Link>
      </div>

      <form onSubmit={handleSubmit} className="admin-form">
        {error && <div className="form-error">{error}</div>}

        <div className="form-group">
          <label>Название связки</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Crystal Blue, Golden Sand и Olive"
            maxLength={200}
            required
          />
        </div>

        <div className="form-group">
          <label>Тип близости</label>
          <div className="proximity-options">
            {PROXIMITY_OPTIONS.map((opt) => (
              <label key={opt.value} className={`proximity-option${proximity === opt.value ? ' selected' : ''}`}>
                <input
                  type="radio"
                  name="proximity"
                  value={opt.value}
                  checked={proximity === opt.value}
                  onChange={() => setProximity(opt.value)}
                />
                <div>
                  <strong>{opt.label}</strong>
                  <span className="proximity-hint">{opt.hint}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="form-row-3">
          <div className="form-group">
            <label>Корпус</label>
            <select value={building} onChange={(e) => setBuilding(e.target.value)}>
              <option value="">Не указан</option>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Порядок сортировки</label>
            <input
              type="number"
              min={0}
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            />
          </div>
          <div className="form-group checkbox" style={{ alignSelf: 'flex-end', paddingBottom: 20 }}>
            <label>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Показывать на сайте
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>Заметка (не публичная, только для менеджера)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Необязательно"
          />
        </div>

        <div className="form-group">
          <label>
            Апартаменты в связке
            {selectedIds.length > 0 && (
              <span className="selection-count"> — выбрано {selectedIds.length} из 2–4</span>
            )}
          </label>

          {selectedIds.length >= 2 && (
            <div className="total-guests-preview">
              Общая вместимость: <strong>{totalGuests} гостей</strong>
            </div>
          )}

          {loadingApts ? (
            <div className="loading-apts">Загрузка апартаментов...</div>
          ) : (
            <div className="apt-grid">
              {apartments.map((apt) => {
                const selected = selectedIds.includes(apt.id);
                const disabled = !selected && selectedIds.length >= 4;
                return (
                  <button
                    key={apt.id}
                    type="button"
                    className={`apt-chip${selected ? ' apt-chip--selected' : ''}${disabled ? ' apt-chip--disabled' : ''}`}
                    onClick={() => !disabled && toggleApartment(apt.id)}
                    disabled={disabled}
                  >
                    <span className="apt-chip__title">{apt.title}</span>
                    <span className="apt-chip__meta">
                      {apt.max_guests} чел
                      {apt.building ? ` · К${apt.building}` : ''}
                      {apt.floor ? ` · ${apt.floor} эт` : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" className="admin-button primary" disabled={saving}>
            {saving ? 'Сохранение...' : isEdit ? 'Сохранить изменения' : 'Создать связку'}
          </button>
          <Link href="/admin/apartment-groups" className="admin-button secondary">
            Отмена
          </Link>
        </div>
      </form>

      <style jsx>{`
        .form-error {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 10px 16px;
          margin-bottom: 16px;
          font-size: 14px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: #1a2634;
          font-size: 14px;
        }

        .form-group input[type="text"],
        .form-group input[type="number"],
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d0d9e2;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #139ab6;
        }

        .form-group.checkbox {
          display: flex;
          align-items: center;
        }

        .form-group.checkbox label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          margin-bottom: 0;
        }

        .form-group.checkbox input { width: auto; }

        .form-row-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
        }

        @media (max-width: 640px) {
          .form-row-3 { grid-template-columns: 1fr; }
        }

        .proximity-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .proximity-option {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
        }

        .proximity-option.selected {
          border-color: #139ab6;
          background: #ecfeff;
        }

        .proximity-option input { margin-top: 3px; }

        .proximity-option strong {
          display: block;
          font-size: 14px;
          color: #1a2634;
        }

        .proximity-hint {
          display: block;
          font-size: 12px;
          color: #64748b;
          margin-top: 2px;
        }

        .selection-count {
          font-size: 13px;
          color: #64748b;
          font-weight: 400;
        }

        .total-guests-preview {
          margin-bottom: 10px;
          font-size: 13px;
          color: #139ab6;
        }

        .total-guests-preview strong {
          font-weight: 700;
        }

        .loading-apts {
          color: #94a3b8;
          font-size: 14px;
          padding: 12px 0;
        }

        .apt-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .apt-chip {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2px;
          padding: 8px 14px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #f8fafc;
          cursor: pointer;
          transition: all 0.15s;
          text-align: left;
        }

        .apt-chip:hover:not(:disabled) {
          border-color: #139ab6;
          background: #ecfeff;
        }

        .apt-chip--selected {
          background: #0e7490;
          border-color: #0e7490;
          color: white;
        }

        .apt-chip--disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .apt-chip__title {
          font-size: 13px;
          font-weight: 500;
        }

        .apt-chip__meta {
          font-size: 11px;
          opacity: 0.75;
        }

        .form-actions {
          display: flex;
          gap: 16px;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
        }

        .admin-button.primary {
          background: linear-gradient(135deg, #139ab6, #1fb3cf);
          color: white;
          padding: 12px 28px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .admin-button.primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #0f7a91, #139ab6);
        }

        .admin-button.primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .admin-button.secondary {
          background: white;
          color: #1a2634;
          padding: 12px 28px;
          border: 1px solid #d0d9e2;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          transition: all 0.2s;
        }

        .admin-button.secondary:hover {
          border-color: #139ab6;
          color: #139ab6;
        }

        @media (max-width: 640px) {
          .form-actions { flex-direction: column; }
          .admin-button.primary, .admin-button.secondary {
            width: 100%;
            text-align: center;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
