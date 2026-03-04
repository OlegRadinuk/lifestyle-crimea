'use client';

import { useApartment } from '@/components/ApartmentContext';
import { useEffect } from 'react';

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
};

export default function ApartmentClient({ apartment }: { apartment: Apartment }) {
  const { setCurrentApartmentIndex } = useApartment();

  useEffect(() => {
    // Здесь можно установить индекс для контекста, если нужно
    // setCurrentApartmentIndex(...);
  }, [apartment.id]);

  return (
    <div className="apartment-page">
      {/* Hero секция с фото */}
      <div className="apartment-hero">
        <h1>{apartment.title}</h1>
        {apartment.images && apartment.images[0] && (
          <img src={apartment.images[0]} alt={apartment.title} />
        )}
      </div>

      {/* Основная информация */}
      <div className="apartment-info">
        <p className="description">{apartment.description}</p>
        
        <div className="details-grid">
          <div className="detail-item">
            <span className="label">Макс. гостей:</span>
            <span className="value">{apartment.max_guests}</span>
          </div>
          
          {apartment.area && (
            <div className="detail-item">
              <span className="label">Площадь:</span>
              <span className="value">{apartment.area} м²</span>
            </div>
          )}
          
          <div className="detail-item">
            <span className="label">Цена за ночь:</span>
            <span className="value">{apartment.price_base.toLocaleString()} ₽</span>
          </div>
          
          <div className="detail-item">
            <span className="label">Вид:</span>
            <span className="value">
              {apartment.view === 'sea' ? 'На море' : 
               apartment.view === 'city' ? 'На город' : 'Во двор'}
            </span>
          </div>
          
          {apartment.has_terrace && (
            <div className="detail-item">
              <span className="label">Терраса:</span>
              <span className="value">Есть</span>
            </div>
          )}
        </div>

        {/* Особенности */}
        {apartment.features && apartment.features.length > 0 && (
          <div className="features">
            <h3>Особенности</h3>
            <ul>
              {apartment.features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Все фото */}
        {apartment.images && apartment.images.length > 0 && (
          <div className="gallery">
            <h3>Фотографии</h3>
            <div className="gallery-grid">
              {apartment.images.map((img, index) => (
                <img key={index} src={img} alt={`${apartment.title} - ${index + 1}`} />
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .apartment-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        .apartment-hero {
          position: relative;
          height: 500px;
          margin-bottom: 40px;
          border-radius: 16px;
          overflow: hidden;
        }
        .apartment-hero h1 {
          position: absolute;
          bottom: 30px;
          left: 30px;
          color: white;
          font-size: 48px;
          text-shadow: 0 2px 10px rgba(0,0,0,0.3);
          z-index: 2;
        }
        .apartment-hero img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .description {
          font-size: 18px;
          line-height: 1.6;
          color: #333;
          margin-bottom: 40px;
        }
        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
          padding: 20px;
          background: #f5f7fa;
          border-radius: 12px;
        }
        .detail-item {
          display: flex;
          flex-direction: column;
        }
        .label {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 4px;
        }
        .value {
          font-size: 18px;
          font-weight: 600;
          color: #1a2634;
        }
        .features h3 {
          font-size: 24px;
          margin-bottom: 20px;
        }
        .features ul {
          list-style: none;
          padding: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .features li {
          background: #e6f7ff;
          color: #139ab6;
          padding: 8px 16px;
          border-radius: 30px;
          font-size: 14px;
        }
        .gallery h3 {
          font-size: 24px;
          margin: 40px 0 20px;
        }
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        .gallery-grid img {
          width: 100%;
          height: 200px;
          object-fit: cover;
          border-radius: 12px;
        }
      `}</style>
    </div>
  );
}