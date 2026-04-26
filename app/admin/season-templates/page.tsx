'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Template = {
  id: string;
  name: string;
  date_from: string;
  date_to: string;
  sort_order: number;
};

export default function SeasonTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [form, setForm] = useState({ name: '', date_from: '', date_to: '' });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', date_from: '', date_to: '' });

  const fetch_ = async () => {
    const res = await fetch('/api/admin/season-templates');
    if (res.ok) setTemplates(await res.json());
  };

  useEffect(() => { fetch_(); }, []);

  const handleAdd = async () => {
    if (!form.name || !form.date_from || !form.date_to) return alert('Заполните все поля');
    setSaving(true);
    try {
      const res = await fetch('/api/admin/season-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, date_from: form.date_from, date_to: form.date_to, sort_order: templates.length }),
      });
      if (res.ok) { setForm({ name: '', date_from: '', date_to: '' }); fetch_(); }
      else alert('Ошибка при сохранении');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить шаблон? Это удалит привязанные цены во всех апартаментах.')) return;
    await fetch('/api/admin/season-templates', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId: id }),
    });
    fetch_();
  };

  const handleEdit = async (id: string) => {
    if (!editForm.name || !editForm.date_from || !editForm.date_to) return alert('Заполните все поля');
    await fetch('/api/admin/season-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name: editForm.name, date_from: editForm.date_from, date_to: editForm.date_to, sort_order: templates.find(t => t.id === id)?.sort_order ?? 0 }),
    });
    setEditingId(null);
    fetch_();
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Шаблоны сезонов</h1>
        <Link href="/admin" className="admin-button">← Назад</Link>
      </div>

      <div className="admin-card" style={{ marginBottom: 24 }}>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>
          Здесь задаются глобальные периоды сезонов (название + даты). В карточке каждого апартамента выставляется своя цена за ночь для каждого сезона.
        </p>

        {templates.length === 0 ? (
          <p style={{ padding: 16, color: '#94a3b8', textAlign: 'center', fontSize: 14 }}>Шаблоны не добавлены</p>
        ) : (
          <div className="season-tpl-list">
            {templates.map(t => (
              editingId === t.id ? (
                <div key={t.id} className="season-tpl-row season-tpl-row--edit">
                  <input className="admin-input-inline" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="Название" />
                  <input type="date" className="admin-input-inline" value={editForm.date_from} onChange={e => setEditForm({ ...editForm, date_from: e.target.value })} />
                  <input type="date" className="admin-input-inline" value={editForm.date_to} onChange={e => setEditForm({ ...editForm, date_to: e.target.value })} />
                  <div className="season-tpl-actions">
                    <button className="admin-button small primary" onClick={() => handleEdit(t.id)}>Сохранить</button>
                    <button className="admin-button small" onClick={() => setEditingId(null)}>Отмена</button>
                  </div>
                </div>
              ) : (
                <div key={t.id} className="season-tpl-row">
                  <div className="season-tpl-name">{t.name}</div>
                  <div className="season-tpl-dates">{t.date_from} — {t.date_to}</div>
                  <div className="season-tpl-actions">
                    <button className="admin-button small" onClick={() => { setEditingId(t.id); setEditForm({ name: t.name, date_from: t.date_from, date_to: t.date_to }); }}>Ред.</button>
                    <button className="admin-button small warning" onClick={() => handleDelete(t.id)}>Удалить</button>
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>

      <div className="admin-card">
        <h3 style={{ marginBottom: 16, fontSize: 15 }}>Добавить сезон</h3>
        <div className="season-tpl-add-form">
          <div className="form-group" style={{ margin: 0 }}>
            <label>Название</label>
            <input className="admin-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Например: Высокий сезон" />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Дата начала</label>
            <input type="date" className="admin-input" value={form.date_from} onChange={e => setForm({ ...form, date_from: e.target.value })} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Дата окончания</label>
            <input type="date" className="admin-input" value={form.date_to} onChange={e => setForm({ ...form, date_to: e.target.value })} />
          </div>
          <button className="admin-button primary season-tpl-add-btn" onClick={handleAdd} disabled={saving}>
            {saving ? '...' : '+ Добавить'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .admin-input { width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; outline: none; }
        .admin-input:focus { border-color: #0891b2; }
        .admin-input-inline { width: 100%; padding: 6px 8px; border: 1px solid #0891b2; border-radius: 6px; font-size: 13px; outline: none; }

        .season-tpl-list { display: flex; flex-direction: column; gap: 0; }

        .season-tpl-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-top: 1px solid #e2e8f0;
          flex-wrap: wrap;
        }
        .season-tpl-row--edit { background: #f0f9ff; border-radius: 8px; }
        .season-tpl-row--edit input { flex: 1; min-width: 100px; }

        .season-tpl-name { font-weight: 600; font-size: 14px; flex: 1; min-width: 120px; }
        .season-tpl-dates { font-size: 13px; color: #475569; white-space: nowrap; }
        .season-tpl-actions { display: flex; gap: 6px; margin-left: auto; flex-shrink: 0; }

        .season-tpl-add-form {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr auto;
          gap: 12px;
          align-items: end;
        }
        .season-tpl-add-btn { height: 40px; }

        @media (max-width: 768px) {
          .season-tpl-row { gap: 8px; }
          .season-tpl-row--edit { flex-direction: column; align-items: stretch; }
          .season-tpl-row--edit input { width: 100%; }
          .season-tpl-dates { color: #64748b; font-size: 12px; }
          .season-tpl-actions { margin-left: 0; }

          .season-tpl-add-form {
            grid-template-columns: 1fr;
          }
          .season-tpl-add-btn { height: 44px; width: 100%; }
        }
      `}</style>
    </div>
  );
}
