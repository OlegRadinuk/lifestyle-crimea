'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

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

export default function ApartmentForm({ 
  apartment, 
  action 
}: { 
  apartment: Apartment; 
  action: (formData: FormData) => Promise<void>;
}) {
  const searchParams = useSearchParams();
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

  return (
    <form action={action} className="admin-form">
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
                <input type="hidden" name="features[]" value={feature} />
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
        <button type="submit" className="admin-button primary">
          Сохранить изменения
        </button>
      </div>

      <style jsx>{`
        .admin-form {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .success-message {
          background: #d4edda;
          color: #155724;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          border: 1px solid #c3e6cb;
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
        .form-group input[type="text"],
        .form-group input[type="number"],
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #d0d9e2;
          border-radius: 8px;
          font-size: 14px;
        }
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #139ab6;
        }
        .checkbox-group {
          display: flex;
          align-items: center;
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
        .remove-feature:hover {
          color: #c62828;
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
    </form>
  );
}