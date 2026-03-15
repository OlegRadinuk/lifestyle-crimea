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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApartment();
    fetchImagesCount();
  }, [id]);

  const fetchApartment = async () => {
    try {
      console.log('📥 Загружаем апартамент с ID:', id);
      const res = await fetch(`/api/admin/apartments/${id}`);
      console.log('📡 Статус ответа:', res.status);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('📦 Полученные данные:', data);
      
      setApartment(data);
      setError(null);
    } catch (error) {
      console.error('❌ Error fetching apartment:', error);
      setError('Не удалось загрузить данные апартамента');
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

  if (loading) return <div className="admin-loading">Загрузка...</div>;
  if (error) return <div className="admin-error">{error}</div>;
  if (!apartment) return <div>Апартамент не найден</div>;

  // Для отладки - покажем данные
  console.log('🖼️ Рендерим с данными:', apartment);

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Редактирование: {apartment.title}</h1>
        <Link href="/admin/apartments" className="admin-button">← Назад</Link>
      </div>

      {/* Временный блок для отладки */}
      <div style={{ background: '#f0f0f0', padding: '10px', marginBottom: '20px' }}>
        <pre>Данные из БД: {JSON.stringify(apartment, null, 2)}</pre>
      </div>

      <form onSubmit={handleSubmit} className="admin-form">
        {/* Основные поля формы */}
        <div className="form-group">
          <label>Название</label>
          <input
            type="text"
            value={apartment.title || ''}
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
            value={apartment.view || 'sea'}
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
              checked={apartment.has_terrace || false}
              onChange={(e) => setApartment({ ...apartment, has_terrace: e.target.checked })}
            />
            Есть терраса
          </label>
        </div>

        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={apartment.is_active || false}
              onChange={(e) => setApartment({ ...apartment, is_active: e.target.checked })}
            />
            Апартамент активен (показывается на сайте)
          </label>
        </div>

        {/* Особенности */}
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
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="add-feature">
            <input
              type="text"
              value={featureInput}
              onChange={(e) => setFeatureInput(e.target.value)}
              placeholder="Новая особенность"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
            />
            <button type="button" onClick={addFeature} className="admin-button small">
              Добавить
            </button>
          </div>
        </div>

        {/* Фото */}
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
    </div>
  );
}