'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ApartmentEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [apartment, setApartment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApartment();
  }, []);

  const fetchApartment = async () => {
    const res = await fetch(`/api/admin/apartments/${params.id}`);
    const data = await res.json();
    setApartment(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/admin/apartments/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apartment),
    });
    alert('Сохранено!');
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Редактирование: {apartment.title}</h1>
        <Link href="/admin/apartments" className="admin-button">← Назад</Link>
      </div>

      <form onSubmit={handleSubmit} className="admin-form">
        <div className="form-group">
          <label>Название</label>
          <input 
            value={apartment.title} 
            onChange={(e) => setApartment({...apartment, title: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>Краткое описание</label>
          <input 
            value={apartment.short_description || ''} 
            onChange={(e) => setApartment({...apartment, short_description: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>Полное описание</label>
          <textarea 
            value={apartment.description || ''} 
            onChange={(e) => setApartment({...apartment, description: e.target.value})}
            rows={5}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Макс. гостей</label>
            <input 
              type="number" 
              value={apartment.max_guests} 
              onChange={(e) => setApartment({...apartment, max_guests: +e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Площадь (м²)</label>
            <input 
              type="number" 
              value={apartment.area || ''} 
              onChange={(e) => setApartment({...apartment, area: +e.target.value})}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Базовая цена (₽/ночь)</label>
          <input 
            type="number" 
            value={apartment.price_base} 
            onChange={(e) => setApartment({...apartment, price_base: +e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>
            <input 
              type="checkbox" 
              checked={apartment.is_active} 
              onChange={(e) => setApartment({...apartment, is_active: e.target.checked})}
            />
            Апартамент активен (показывается на сайте)
          </label>
        </div>

        <button type="submit" className="admin-button primary">Сохранить</button>
      </form>
    </div>
  );
}