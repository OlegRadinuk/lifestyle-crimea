'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewApartmentPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    short_description: '',
    description: '',
    max_guests: 2,
    area: '',
    price_base: 5000,
    view: 'sea',
    has_terrace: false,
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/admin/apartments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/admin/apartments/${data.id}`);
      } else {
        const error = await res.json();
        alert(`Ошибка: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating apartment:', error);
      alert('Ошибка при создании апартамента');
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
        <div className="form-group">
          <label>Название *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="Например: LS-ART"
          />
        </div>

        <div className="form-group">
          <label>Краткое описание</label>
          <input
            type="text"
            value={formData.short_description}
            onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
            placeholder="Краткое описание апартамента"
          />
        </div>

        <div className="form-group">
          <label>Полное описание</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={5}
            placeholder="Подробное описание апартамента"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Макс. гостей *</label>
            <input
              type="number"
              value={formData.max_guests}
              onChange={(e) => setFormData({ ...formData, max_guests: +e.target.value })}
              min="1"
              max="10"
              required
            />
          </div>

          <div className="form-group">
            <label>Площадь (м²)</label>
            <input
              type="number"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              min="0"
              step="0.1"
              placeholder="Например: 45.5"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Базовая цена (₽/ночь) *</label>
          <input
            type="number"
            value={formData.price_base}
            onChange={(e) => setFormData({ ...formData, price_base: +e.target.value })}
            min="0"
            step="100"
            required
          />
        </div>

        <div className="form-group">
          <label>Вид из окна</label>
          <select
            value={formData.view}
            onChange={(e) => setFormData({ ...formData, view: e.target.value })}
          >
            <option value="sea">На море</option>
            <option value="city">На город</option>
            <option value="garden">Во двор</option>
          </select>
        </div>

        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={formData.has_terrace}
              onChange={(e) => setFormData({ ...formData, has_terrace: e.target.checked })}
            />
            Есть терраса
          </label>
        </div>

        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            />
            Апартамент активен (сразу показывать на сайте)
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" className="admin-button primary" disabled={saving}>
            {saving ? 'Создание...' : 'Создать апартамент'}
          </button>
          <Link href="/admin/apartments" className="admin-button secondary">
            Отмена
          </Link>
        </div>
      </form>

      <style jsx>{`
        .admin-page {
          padding: 20px;
        }
        
        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }
        
        .admin-title {
          font-size: 24px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }
        
        .admin-button {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .admin-button.primary {
          background: #139ab6;
          color: white;
          border: none;
        }
        
        .admin-button.primary:hover:not(:disabled) {
          background: #0f7a91;
        }
        
        .admin-button.secondary {
          background: white;
          color: #1e293b;
          border: 1px solid #cbd5e1;
        }
        
        .admin-button.secondary:hover {
          background: #f8fafc;
        }
        
        .admin-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .admin-form {
          max-width: 800px;
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: #1e293b;
        }
        
        .form-group input[type="text"],
        .form-group input[type="number"],
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
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
        }
        
        .form-group.checkbox input {
          width: auto;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        
        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
        }
        
        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
            gap: 0;
          }
          
          .form-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}