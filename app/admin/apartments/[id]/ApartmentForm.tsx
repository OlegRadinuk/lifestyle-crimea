'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type Apartment = {
  id: string;
  title: string;
  short_description: string | null;
  description: string | null;
  max_guests: number;
  area: number | null;
  price_base: number;
  view: string;
  has_terrace: boolean;
  features: string[];
  is_active: boolean;
};

export default function ApartmentForm({ apartment }: { apartment: Apartment }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [features, setFeatures] = useState<string[]>(apartment.features || []);
  const [newFeature, setNewFeature] = useState('');

  const addFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    
    // Удаляем старые features и добавляем новые
    formData.delete('features[]');
    features.forEach(f => formData.append('features[]', f));

    // Преобразуем чекбоксы в понятные значения
    if (formData.get('has_terrace') === null) {
      formData.append('has_terrace', 'false');
    }
    if (formData.get('is_active') === null) {
      formData.append('is_active', 'false');
    }

    try {
      const response = await fetch(`/api/admin/apartments/${apartment.id}`, {
        method: 'PATCH',
        body: formData,
      });

      if (response.ok) {
        router.push(`/admin/apartments/${apartment.id}?success=true`);
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка при сохранении');
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      {searchParams.get('success') && (
        <div className="success-message">✓ Изменения сохранены</div>
      )}

      <input type="hidden" name="id" value={apartment.id} />

      <div className="form-grid">
        <div className="form-group">
          <label>Название *</label>
          <input 
            type="text" 
            name="title" 
            defaultValue={apartment.title} 
            required
          />
        </div>

        <div className="form-group">
          <label>Базовая цена (₽/ночь) *</label>
          <input 
            type="number" 
            name="price_base" 
            defaultValue={apartment.price_base} 
            required
          />
        </div>

        <div className="form-group">
          <label>Макс. гостей *</label>
          <input 
            type="number" 
            name="max_guests" 
            defaultValue={apartment.max_guests} 
            required
          />
        </div>

        <div className="form-group">
          <label>Площадь (м²)</label>
          <input 
            type="number" 
            name="area" 
            defaultValue={apartment.area || ''} 
          />
        </div>

        <div className="form-group full-width">
          <label>Краткое описание</label>
          <input 
            type="text" 
            name="short_description" 
            defaultValue={apartment.short_description || ''} 
            placeholder="Короткое описание для карточки"
          />
        </div>

        <div className="form-group full-width">
          <label>Полное описание</label>
          <textarea 
            name="description" 
            rows={5}
            defaultValue={apartment.description || ''} 
            placeholder="Подробное описание апартамента"
          />
        </div>

        <div className="form-group">
          <label>Вид</label>
          <select name="view" defaultValue={apartment.view}>
            <option value="sea">На море</option>
            <option value="city">На город</option>
            <option value="garden">Во двор</option>
          </select>
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input 
              type="checkbox" 
              name="has_terrace" 
              defaultChecked={apartment.has_terrace} 
            />
            Есть терраса
          </label>
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input 
              type="checkbox" 
              name="is_active" 
              defaultChecked={apartment.is_active} 
            />
            Апартамент активен (показывается на сайте)
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
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
            />
            <button type="button" onClick={addFeature} className="admin-button">
              Добавить
            </button>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="admin-button primary" disabled={saving}>
          {saving ? 'Сохранение...' : 'Сохранить изменения'}
        </button>
      </div>
    </form>
  );
}