'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ApartmentClient } from '@/lib/types';

interface ApartmentDetailsProps {
  apartment: ApartmentClient;
}

export default function ApartmentDetails({ apartment }: ApartmentDetailsProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  const images = apartment.images?.length ? apartment.images : ['/images/placeholder.jpg'];

  return (
    <div className="apartment-detail-page">
      <div className="apartment-detail-container">
        <Link href="/apartments" className="apartment-detail-back">
          ← Назад к списку
        </Link>

        <div className="apartment-detail-grid">
          {/* Галерея */}
          <div className="apartment-detail-gallery">
            <div className="apartment-detail-main-image">
              <Image
                src={images[selectedImage]}
                alt={apartment.title}
                fill
                className="apartment-detail-image"
                priority
              />
            </div>
            {images.length > 1 && (
              <div className="apartment-detail-thumbnails">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`apartment-detail-thumbnail ${
                      selectedImage === idx ? 'active' : ''
                    }`}
                  >
                    <Image src={img} alt={`${apartment.title} ${idx + 1}`} fill className="apartment-detail-thumb-img" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Информация */}
          <div className="apartment-detail-info">
            <h1 className="apartment-detail-title">{apartment.title}</h1>
            
            <div className="apartment-detail-short-desc">
              <p>{apartment.short_description}</p>
            </div>

            <div className="apartment-detail-specs">
              <div className="apartment-detail-spec">
                <div className="apartment-detail-spec-label">Макс. гостей</div>
                <div className="apartment-detail-spec-value">{apartment.max_guests} чел.</div>
              </div>
              <div className="apartment-detail-spec">
                <div className="apartment-detail-spec-label">Площадь</div>
                <div className="apartment-detail-spec-value">{apartment.area || '—'} м²</div>
              </div>
              <div className="apartment-detail-spec">
                <div className="apartment-detail-spec-label">Вид</div>
                <div className="apartment-detail-spec-value">{apartment.view || '—'}</div>
              </div>
              <div className="apartment-detail-spec">
                <div className="apartment-detail-spec-label">Терраса</div>
                <div className="apartment-detail-spec-value">{apartment.has_terrace ? 'Есть' : 'Нет'}</div>
              </div>
            </div>

            <div className="apartment-detail-description">
              <h2>Описание</h2>
              <div className="apartment-detail-description-text">{apartment.description}</div>
            </div>

            {apartment.features?.length > 0 && (
              <div className="apartment-detail-features">
                <h2>Особенности</h2>
                <ul className="apartment-detail-features-list">
                  {apartment.features.map((feature, idx) => (
                    <li key={idx} className="apartment-detail-feature-item">
                      <span className="apartment-detail-feature-bullet">•</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="apartment-detail-booking">
              <div className="apartment-detail-price">
                <span className="apartment-detail-price-amount">{apartment.price_base} ₽</span>
                <span className="apartment-detail-price-period">/ночь</span>
              </div>
              <Link
                href={`/booking/${apartment.id}`}
                className="apartment-detail-book-btn"
              >
                Забронировать
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}