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
    <div className="ap-detail-page">
      <div className="ap-detail-container">
        <Link href="/apartments" className="ap-detail-back">
          ← Назад к списку
        </Link>

        <div className="ap-detail-grid">
          {/* Галерея */}
          <div className="ap-detail-gallery">
            <div className="ap-detail-main-image">
              <Image
                src={images[selectedImage]}
                alt={apartment.title}
                fill
                className="ap-detail-image"
                priority
              />
            </div>
            {images.length > 1 && (
              <div className="ap-detail-thumbnails">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`ap-detail-thumbnail ${
                      selectedImage === idx ? 'active' : ''
                    }`}
                  >
                    <Image src={img} alt={`${apartment.title} ${idx + 1}`} fill className="ap-detail-thumb-img" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Информация */}
          <div className="ap-detail-info">
            <h1 className="ap-detail-title">{apartment.title}</h1>
            
            <div className="ap-detail-short-desc">
              <p>{apartment.short_description}</p>
            </div>

            <div className="ap-detail-specs">
              <div className="ap-detail-spec">
                <span className="ap-detail-spec-label">Макс. гостей:</span>
                <span className="ap-detail-spec-value">{apartment.max_guests} чел.</span>
              </div>
              <div className="ap-detail-spec">
                <span className="ap-detail-spec-label">Площадь:</span>
                <span className="ap-detail-spec-value">{apartment.area || '—'} м²</span>
              </div>
              <div className="ap-detail-spec">
                <span className="ap-detail-spec-label">Вид:</span>
                <span className="ap-detail-spec-value">{apartment.view || '—'}</span>
              </div>
              <div className="ap-detail-spec">
                <span className="ap-detail-spec-label">Терраса:</span>
                <span className="ap-detail-spec-value">{apartment.has_terrace ? 'Есть' : 'Нет'}</span>
              </div>
            </div>

            <div className="ap-detail-description">
              <h2>Описание</h2>
              <p>{apartment.description}</p>
            </div>

            {apartment.features?.length > 0 && (
              <div className="ap-detail-features">
                <h2>Особенности</h2>
                <ul className="ap-detail-features-list">
                  {apartment.features.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="ap-detail-booking">
              <div className="ap-detail-price">
                <span className="ap-detail-price-amount">{apartment.price_base} ₽</span>
                <span className="ap-detail-price-period">/ночь</span>
              </div>
              <Link
                href={`/booking/${apartment.id}`}
                className="ap-detail-book-btn"
              >
                Забронировать
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .ap-detail-page {
          background: #f8fafc;
          min-height: 100vh;
          padding: 40px 0;
        }

        .ap-detail-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .ap-detail-back {
          display: inline-block;
          color: #139ab6;
          text-decoration: none;
          margin-bottom: 24px;
          font-size: 16px;
          transition: color 0.2s;
        }

        .ap-detail-back:hover {
          color: #0f7a91;
          text-decoration: underline;
        }

        .ap-detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }

        .ap-detail-gallery {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .ap-detail-main-image {
          position: relative;
          width: 100%;
          height: 500px;
          border-radius: 16px;
          overflow: hidden;
          background: #e2e8f0;
        }

        .ap-detail-image {
          object-fit: cover;
        }

        .ap-detail-thumbnails {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .ap-detail-thumbnail {
          position: relative;
          width: 100%;
          height: 100px;
          border-radius: 8px;
          overflow: hidden;
          border: 2px solid transparent;
          cursor: pointer;
          transition: border-color 0.2s;
          background: #e2e8f0;
        }

        .ap-detail-thumbnail.active {
          border-color: #139ab6;
        }

        .ap-detail-thumb-img {
          object-fit: cover;
        }

        .ap-detail-info {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .ap-detail-title {
          font-size: 36px;
          color: #1a2634;
          margin: 0;
        }

        .ap-detail-short-desc p {
          font-size: 18px;
          color: #334155;
          line-height: 1.6;
          margin: 0;
        }

        .ap-detail-specs {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .ap-detail-spec {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .ap-detail-spec-label {
          font-size: 14px;
          color: #64748b;
        }

        .ap-detail-spec-value {
          font-size: 18px;
          font-weight: 600;
          color: #1a2634;
        }

        .ap-detail-description h2,
        .ap-detail-features h2 {
          font-size: 24px;
          color: #1a2634;
          margin-bottom: 16px;
        }

        .ap-detail-description p {
          font-size: 16px;
          line-height: 1.8;
          color: #334155;
        }

        .ap-detail-features-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .ap-detail-features-list li {
          background: #e6f7ff;
          color: #139ab6;
          padding: 8px 16px;
          border-radius: 30px;
          font-size: 14px;
        }

        .ap-detail-booking {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          margin-top: 16px;
        }

        .ap-detail-price {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .ap-detail-price-amount {
          font-size: 32px;
          font-weight: 600;
          color: #139ab6;
        }

        .ap-detail-price-period {
          font-size: 16px;
          color: #64748b;
        }

        .ap-detail-book-btn {
          background: #139ab6;
          color: white;
          text-decoration: none;
          padding: 14px 32px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          transition: background 0.2s;
        }

        .ap-detail-book-btn:hover {
          background: #0f7a91;
        }

        @media (max-width: 768px) {
          .ap-detail-grid {
            grid-template-columns: 1fr;
          }

          .ap-detail-main-image {
            height: 300px;
          }

          .ap-detail-thumbnails {
            grid-template-columns: repeat(4, 1fr);
          }

          .ap-detail-thumbnail {
            height: 70px;
          }

          .ap-detail-title {
            font-size: 28px;
          }

          .ap-detail-specs {
            grid-template-columns: 1fr;
          }

          .ap-detail-booking {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}