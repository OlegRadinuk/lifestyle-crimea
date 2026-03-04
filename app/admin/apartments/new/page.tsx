'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewApartmentPage() {
  const router = useRouter();
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    short_description: '',
    description: '',
    max_guests: 2,
    area: '',
    price_base: 0,
    view: 'sea',
    has_terrace: false,
    is_active: true,
  });

  const addFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/admin/apartments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          area: form.area ? Number(form.area) : null,
          features,
        }),
      });

      if (res.ok) {
        router.push('/admin/apartments');
      } else {
        alert('Ошибка при создании');
      }
    } catch (error) {
      console.error('Error creating apartment:', error);
      alert('Ошибка при создании');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Новый апартамент</h1>
        <Link href="/admin/apartments" className="admin-button">← Назад</Link>
      </div>

      <form onSubmit={handleSubmit} className="admin-form">
        <div className="form-grid">
          <div className="form-group">
            <label>Название *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Базовая цена (₽/ночь) *</label>
            <input
              type="number"
              value={form.price_base}
              onChange={(e) => setForm({ ...form, price_base: Number(e.target.value) })}
              required
            />
          </div>

          <div className="form-group">
            <label>Макс. гостей *</label>
            <input
              type="number"
              value={form.max_guests}
              onChange={(e) => setForm({ ...form, max_guests: Number(e.target.value) })}
              required
            />
          </div>

          <div className="form-group">
            <label>Площадь (м²)</label>
            <input
              type="number"
              value={form.area}
              onChange={(e) => setForm({ ...form, area: e.target.value })}
            />
          </div>

          <div className="form-group full-width">
            <label>Краткое описание</label>
            <input
              type="text"
              value={form.short_description}
              onChange={(e) => setForm({ ...form, short_description: e.target.value })}
            />
          </div>

          <div className="form-group full-width">
            <label>Полное описание</label>
            <textarea
              rows={5}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Вид</label>
            <select
              value={form.view}
              onChange={(e) => setForm({ ...form, view: e.target.value })}
            >
              <option value="sea">На море</option>
              <option value="city">На город</option>
              <option value="garden">Во двор</option>
            </select>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={form.has_terrace}
                onChange={(e) => setForm({ ...form, has_terrace: e.target.checked })}
              />
              Есть терраса
            </label>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              Апартамент активен
            </label>
          </div>

          <div className="form-group full-width">
            <label>Особенности</label>
            <div className="features-list">
              {features.map((feature, index) => (
                <div key={index} className="feature-item">
                  <span>{feature}</span>
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="remove-feature"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="add-feature">
              <input
                type="text"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="Новая особенность"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
              />
              <button type="button" onClick={addFeature} className="admin-button">
                Добавить
              </button>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="admin-button primary" disabled={saving}>
            {saving ? 'Сохранение...' : 'Создать апартамент'}
          </button>
        </div>
      </form>

      <style jsx>{`
        .admin-form {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .form-group.full-width {
          grid-column: span 2;
        }
        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: #1a2634;
        }
        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #d0d9e2;
          border-radius: 8px;
          font-size: 14px;
        }
        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }
        .features-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 15px;
          min-height: 40px;
        }
        .feature-item {
          background: #e6f7ff;
          border: 1px solid #139ab6;
          border-radius: 20px;
          padding: 5px 12px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .remove-feature {
          background: none;
          border: none;
          color: #999;
          cursor: pointer;
          font-size: 14px;
          padding: 0 4px;
        }
        .add-feature {
          display: flex;
          gap: 10px;
        }
        .add-feature input {
          flex: 1;
          padding: 8px;
          border: 1px solid #d0d9e2;
          border-radius: 8px;
        }
        .form-actions {
          margin-top: 30px;
          display: flex;
          justify-content: flex-end;
        }
      `}</style>
    </div>
  );
}