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

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 13 }}>Название</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 13 }}>Дата начала</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 13 }}>Дата окончания</th>
              <th style={{ padding: '8px 12px', width: 120 }}></th>
            </tr>
          </thead>
          <tbody>
            {templates.length === 0 && (
              <tr><td colSpan={4} style={{ padding: 16, color: '#94a3b8', textAlign: 'center', fontSize: 14 }}>Шаблоны не добавлены</td></tr>
            )}
            {templates.map(t => (
              <tr key={t.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                {editingId === t.id ? (
                  <>
                    <td style={{ padding: '8px 12px' }}>
                      <input className="admin-input-inline" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <input type="date" className="admin-input-inline" value={editForm.date_from} onChange={e => setEditForm({ ...editForm, date_from: e.target.value })} />
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <input type="date" className="admin-input-inline" value={editForm.date_to} onChange={e => setEditForm({ ...editForm, date_to: e.target.value })} />
                    </td>
                    <td style={{ padding: '8px 12px', display: 'flex', gap: 6 }}>
                      <button className="admin-button small primary" onClick={() => handleEdit(t.id)}>Сохранить</button>
                      <button className="admin-button small" onClick={() => setEditingId(null)}>Отмена</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={{ padding: '8px 12px', fontWeight: 600, fontSize: 14 }}>{t.name}</td>
                    <td style={{ padding: '8px 12px', fontSize: 14, color: '#475569' }}>{t.date_from}</td>
                    <td style={{ padding: '8px 12px', fontSize: 14, color: '#475569' }}>{t.date_to}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="admin-button small" onClick={() => { setEditingId(t.id); setEditForm({ name: t.name, date_from: t.date_from, date_to: t.date_to }); }}>Ред.</button>
                        <button className="admin-button small warning" onClick={() => handleDelete(t.id)}>Удалить</button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-card">
        <h3 style={{ marginBottom: 16, fontSize: 15 }}>Добавить сезон</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
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
          <button className="admin-button primary" onClick={handleAdd} disabled={saving} style={{ height: 40 }}>
            {saving ? '...' : '+ Добавить'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .admin-input { width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; outline: none; }
        .admin-input:focus { border-color: #0891b2; }
        .admin-input-inline { width: 100%; padding: 6px 8px; border: 1px solid #0891b2; border-radius: 6px; font-size: 13px; outline: none; }
      `}</style>
    </div>
  );
}
