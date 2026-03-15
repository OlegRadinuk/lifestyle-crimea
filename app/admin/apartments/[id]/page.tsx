'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type PageProps = {
  params: Promise<{ id: string }>
};

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
  images: string[];
  is_active: boolean;
  images_count?: number;
};

export default function EditApartmentPage({ params }: PageProps) {
  const { id } = use(params);
  
  const router = useRouter();
  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imagesCount, setImagesCount] = useState(0);
  const [featureInput, setFeatureInput] = useState('');

  useEffect(() => {
    fetchApartment();
    fetchImagesCount();
  }, [id]);

  const fetchApartment = async () => {
    try {
      const res = await fetch(`/api/admin/apartments/${id}`);
      const data = await res.json();
      setApartment(data);
    } catch (error) {
      console.error('Error fetching apartment:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchImagesCount = async () => {
    try {
      const res = await fetch(`/api/admin/apartments/${id}/images`);
      const data = await res.json();
      setImagesCount(data.length || 0);
    } catch (error) {
      console.error('Error fetching images count:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apartment) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/apartments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apartment),
      });
      
      if (res.ok) {
        router.push('/admin/apartments');
      } else {
        const error = await res.json();
        alert(`Ошибка: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving apartment:', error);
      alert('Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  const addFeature = () => {
    if (!featureInput.trim() || !apartment) return;
    setApartment({
      ...apartment,
      features: [...(apartment.features || []), featureInput.trim()]
    });
    setFeatureInput('');
  };

  const removeFeature = (index: number) => {
    if (!apartment) return;
    setApartment({
      ...apartment,
      features: apartment.features.filter((_, i) => i !== index)
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addFeature();
    }
  };

  if (loading) return <div className="admin-loading">Загрузка...</div>;
  if (!apartment) return <div>Апартамент не найден</div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Редактирование: {apartment.title}</h1>
        <Link href="/admin/apartments" className="admin-button">← Назад</Link>
      </div>

      <form onSubmit={handleSubmit} className="admin-form">
        {/* Основные поля формы */}
        <div className="form-group">
          <label>Название</label>
          <input
            type="text"
            value={apartment.title}
            onChange={(e) => setApartment({ ...apartment, title: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Краткое описание</label>
          <input
            type="text"
            value={apartment.short_description || ''}
            onChange={(e) => setApartment({ ...apartment, short_description: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Полное описание</label>
          <textarea
            value={apartment.description || ''}
            onChange={(e) => setApartment({ ...apartment, description: e.target.value })}
            rows={5}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Макс. гостей</label>
            <input
              type="number"
              value={apartment.max_guests}
              onChange={(e) => setApartment({ ...apartment, max_guests: +e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Площадь (м²)</label>
            <input
              type="number"
              value={apartment.area || ''}
              onChange={(e) => setApartment({ ...apartment, area: +e.target.value })}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Базовая цена (₽/ночь)</label>
          <input
            type="number"
            value={apartment.price_base}
            onChange={(e) => setApartment({ ...apartment, price_base: +e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Вид</label>
          <select
            value={apartment.view}
            onChange={(e) => setApartment({ ...apartment, view: e.target.value })}
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
              checked={apartment.has_terrace}
              onChange={(e) => setApartment({ ...apartment, has_terrace: e.target.checked })}
            />
            Есть терраса
          </label>
        </div>

        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={apartment.is_active}
              onChange={(e) => setApartment({ ...apartment, is_active: e.target.checked })}
            />
            Апартамент активен (показывается на сайте)
          </label>
        </div>

        {/* ПОЛЕ ДЛЯ ОСОБЕННОСТЕЙ - ДОБАВЛЕНО */}
        <div className="form-group">
          <label>Особенности</label>
          <div className="features-list">
            {apartment.features?.map((feature, index) => (
              <div key={index} className="feature-item">
                <span>{feature}</span>
                <button
                  type="button"
                  onClick={() => removeFeature(index)}
                  className="remove-feature"
                  title="Удалить"
                >
                  ×
                </button>
              </div>
            ))}
            {(!apartment.features || apartment.features.length === 0) && (
              <div className="no-features">Нет добавленных особенностей</div>
            )}
          </div>
          <div className="add-feature">
            <input
              type="text"
              value={featureInput}
              onChange={(e) => setFeatureInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Например: Wi-Fi, Кондиционер, Кухня"
              className="feature-input"
            />
            <button 
              type="button" 
              onClick={addFeature} 
              className="add-feature-btn"
              disabled={!featureInput.trim()}
            >
              Добавить
            </button>
          </div>
          <small className="feature-hint">
            Нажмите Enter или кнопку "Добавить" чтобы добавить особенность
          </small>
        </div>

        {/* КНОПКА ДЛЯ УПРАВЛЕНИЯ ФОТО */}
        <div className="photo-section">
          <h3>Фотографии</h3>
          <div className="photo-info">
            <span className={`photo-count-badge ${imagesCount ? 'has-photos' : 'no-photos'}`}>
              {imagesCount} фото загружено
            </span>
          </div>
          
          <Link
            href={`/admin/apartments/${id}/images`}
            className="photo-management-btn"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 3H5C3.89543 3 3 3.89543 3 5V15C3 16.1046 3.89543 17 5 17H15C16.1046 17 17 16.1046 17 15V5C17 3.89543 16.1046 3 15 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="7" cy="7" r="1" fill="currentColor"/>
              <path d="M17 12L13 8L5 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>Управление фотографиями ({imagesCount})</span>
          </Link>
        </div>

        <div className="form-actions">
          <button type="submit" className="admin-button primary" disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
          <Link href="/admin/apartments" className="admin-button secondary">
            Отмена
          </Link>
        </div>
      </form>

      <style jsx>{`
        .photo-section {
          margin: 30px 0;
          padding: 20px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }
        
        .photo-section h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1a2634;
          margin-bottom: 16px;
        }
        
        .photo-info {
          margin-bottom: 16px;
        }
        
        .photo-count-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
        }
        
        .photo-count-badge.has-photos {
          background: #e6f7ff;
          color: #139ab6;
          border: 1px solid rgba(19, 154, 182, 0.2);
        }
        
        .photo-count-badge.no-photos {
          background: #f5f5f5;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }
        
        .photo-management-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 24px;
          background: linear-gradient(135deg, #139ab6, #1fb3cf);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(19, 154, 182, 0.3);
          border: none;
          cursor: pointer;
        }
        
        .photo-management-btn:hover {
          background: linear-gradient(135deg, #0f7a91, #139ab6);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(19, 154, 182, 0.4);
        }
        
        .photo-management-btn svg {
          margin-right: 4px;
        }
        
        .form-actions {
          display: flex;
          gap: 16px;
          margin-top: 30px;
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
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(19, 154, 182, 0.3);
        }
        
        .admin-button.primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #0f7a91, #139ab6);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(19, 154, 182, 0.4);
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
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        
        .admin-button.secondary:hover {
          background: #f8fafc;
          border-color: #139ab6;
          color: #139ab6;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: #1a2634;
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
        }
        
        .form-group.checkbox input {
          width: auto;
        }
        
        /* Стили для особенностей */
        .features-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 15px;
          min-height: 40px;
          padding: 8px;
          background: #f9f9f9;
          border-radius: 8px;
          border: 1px solid #eaeef2;
        }
        
        .feature-item {
          background: #e6f7ff;
          border: 1px solid #139ab6;
          border-radius: 20px;
          padding: 5px 12px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }
        
        .remove-feature {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          font-size: 16px;
          padding: 0 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .remove-feature:hover {
          color: #c62828;
        }
        
        .no-features {
          color: #94a3b8;
          font-style: italic;
          padding: 4px 8px;
        }
        
        .add-feature {
          display: flex;
          gap: 10px;
        }
        
        .feature-input {
          flex: 1;
          padding: 10px 12px;
          border: 1px solid #d0d9e2;
          border-radius: 8px;
          font-size: 14px;
        }
        
        .feature-input:focus {
          outline: none;
          border-color: #139ab6;
        }
        
        .add-feature-btn {
          padding: 10px 20px;
          background: #139ab6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .add-feature-btn:hover:not(:disabled) {
          background: #0f7a91;
        }
        
        .add-feature-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .feature-hint {
          display: block;
          margin-top: 6px;
          color: #94a3b8;
          font-size: 12px;
        }
        
        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
            gap: 0;
          }
          
          .photo-management-btn {
            width: 100%;
            justify-content: center;
          }
          
          .form-actions {
            flex-direction: column;
          }
          
          .admin-button.primary,
          .admin-button.secondary {
            width: 100%;
            text-align: center;
          }
          
          .add-feature {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}