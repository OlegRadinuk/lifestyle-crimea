'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSearch } from '@/components/SearchContext';
import { useHeader } from '@/components/HeaderContext';
import { usePhotoModal } from '@/components/photo-modal/PhotoModalContext';
import BookingModal, { DateRange } from '@/components/BookingModal';
import Footer from '@/components/Footer';
import { ApartmentClient } from '@/lib/types';

interface ApartmentsClientProps {
  initialApartments: ApartmentClient[];
}

function formatDate(date: string): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

export default function ApartmentsClient({ initialApartments }: ApartmentsClientProps) {
  const { open } = usePhotoModal();
  const router = useRouter();
  const { search } = useSearch();
  const { register, unregister } = useHeader();

  const [bookingApartment, setBookingApartment] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [unavailableIds, setUnavailableIds] = useState<Set<string>>(new Set());
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [apartments] = useState(initialApartments);

  useEffect(() => {
    register('apartments-page', {
      mode: 'dark',
      priority: 20,
    });

    return () => {
      unregister('apartments-page');
    };
  }, [register, unregister]);

  // Проверка доступности всех апартаментов
  useEffect(() => {
    const checkAllAvailability = async () => {
      if (!search) {
        setLoadingAvailability(false);
        return;
      }

      setLoadingAvailability(true);
      const unavailable = new Set<string>();

      await Promise.all(
        apartments.map(async (apt) => {
          try {
            const response = await fetch(
              `/api/availability/${apt.id}?checkIn=${search.checkIn}&checkOut=${search.checkOut}&t=${Date.now()}`
            );
            const data = await response.json();
            if (!data.isAvailable) {
              unavailable.add(apt.id);
            }
          } catch (error) {
            console.error(`Error checking ${apt.id}:`, error);
          }
        })
      );

      setUnavailableIds(unavailable);
      setLoadingAvailability(false);
    };

    checkAllAvailability();

    const handleBookingCompleted = () => {
      checkAllAvailability();
    };

    window.addEventListener('booking-completed', handleBookingCompleted);
    return () => window.removeEventListener('booking-completed', handleBookingCompleted);
  }, [search, apartments]);

  const handleBookingClick = async (apartment: ApartmentClient) => {
    if (!search) return;

    setCheckingId(apartment.id);

    try {
      const response = await fetch(
        `/api/availability/${apartment.id}?checkIn=${search.checkIn}&checkOut=${search.checkOut}&t=${Date.now()}`
      );
      const data = await response.json();

      if (data.isAvailable) {
        setBookingApartment({
          id: apartment.id,
          title: apartment.title,
        });
        setBookingOpen(true);
      } else {
        alert('Эти даты уже заняты. Пожалуйста, выберите другие даты.');
        setUnavailableIds(prev => new Set(prev).add(apartment.id));
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      alert('Ошибка при проверке доступности');
    } finally {
      setCheckingId(null);
    }
  };

  if (!search) {
    return (
      <section className="ap-empty">
        <h1>Нет параметров поиска</h1>
        <p>Пожалуйста, выберите даты и количество гостей на главной странице.</p>
        <button className="ap-btn-primary" onClick={() => router.push('/')}>
          Перейти на главную
        </button>

        <style jsx>{`
          .ap-empty {
            min-height: 60vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 40px 20px;
          }
          .ap-empty h1 {
            font-size: 32px;
            margin-bottom: 16px;
            color: #1a2634;
          }
          .ap-empty p {
            font-size: 18px;
            color: #64748b;
            margin-bottom: 24px;
          }
          .ap-btn-primary {
            background: #139ab6;
            color: white;
            border: none;
            padding: 12px 32px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s;
          }
          .ap-btn-primary:hover {
            background: #0f7a91;
          }
        `}</style>
      </section>
    );
  }

  // Фильтруем апартаменты по гостям и доступности
  const filteredApartments = apartments.filter(
    (apt) => apt.max_guests >= search.guests && !unavailableIds.has(apt.id)
  );

  if (loadingAvailability) {
    return (
      <section className="ap-page">
        <div className="ap-loading">Загрузка доступных апартаментов...</div>
        <style jsx>{`
          .ap-page {
            min-height: 60vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .ap-loading {
            font-size: 18px;
            color: #64748b;
          }
        `}</style>
      </section>
    );
  }

  return (
    <>
      <section className="ap-page">
        <header className="ap-top">
          <div className="ap-top-inner">
            <div className="ap-brand fade-in">Стиль жизни · Алушта</div>

            <div className="ap-header-row slide-in">
              <h1>Доступные апартаменты</h1>

              <div className="ap-header-right">
                <span className="ap-dates">
                  {formatDate(search.checkIn)} — {formatDate(search.checkOut)}
                </span>

                <button
                  className="ap-change-dates"
                  onClick={() => router.push('/')}
                >
                  Изменить даты
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="ap-results fade-in-delay">
          Найдено вариантов: <strong>{filteredApartments.length}</strong>
        </div>

        {filteredApartments.length === 0 ? (
          <div className="ap-no-results">
            <p>Нет свободных апартаментов на выбранные даты.</p>
            <button className="ap-btn-primary" onClick={() => router.push('/')}>
              Изменить даты
            </button>
          </div>
        ) : (
          <div className="ap-list">
            {filteredApartments.map((apartment, index) => (
              <article
                key={apartment.id}
                className="ap-list-card card-appear"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="ap-list-image">
                  <img 
                    src={apartment.images?.[0] || '/images/placeholder.jpg'} 
                    alt={apartment.title} 
                  />
                  <button
                    className="ap-list-gallery-btn"
                    onClick={() => open(apartment.images || ['/images/placeholder.jpg'], 0)}
                  >
                    Смотреть фото
                  </button>
                </div>
                <div className="ap-list-content">
                  <div className="ap-list-header">
                    <h2>{apartment.title}</h2>
                    <span className="ap-list-guests">
                      до {apartment.max_guests} гостей
                    </span>
                  </div>

                  <p className="ap-list-description">{apartment.short_description}</p>

                  {apartment.features && apartment.features.length > 0 && (
                    <ul className="ap-list-features">
                      {apartment.features.slice(0, 3).map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                      {apartment.features.length > 3 && (
                        <li>+{apartment.features.length - 3}</li>
                      )}
                    </ul>
                  )}

                  <div className="ap-list-footer">
                    <div className="ap-list-price">
                      от {apartment.price_base.toLocaleString()} ₽ / ночь
                    </div>

                    <div className="ap-list-actions">
                      <Link
                        href={`/apartments/${apartment.id}`}
                        className="ap-btn-outline"
                      >
                        Подробнее
                      </Link>

                      <button
                        className="ap-btn-primary"
                        onClick={() => handleBookingClick(apartment)}
                        disabled={checkingId === apartment.id}
                      >
                        {checkingId === apartment.id ? 'Проверка...' : 'Забронировать'}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <Footer />
      </section>

      {bookingOpen && bookingApartment && search && (
        <BookingModal
          apartment={bookingApartment}
          initialRange={{
            from: new Date(search.checkIn),
            to: new Date(search.checkOut),
          }}
          initialGuests={search.guests}
          onClose={() => setBookingOpen(false)}
          onConfirm={() => {
            setBookingOpen(false);
            window.dispatchEvent(new CustomEvent('booking-completed'));
          }}
        />
      )}

      <style jsx>{`
        .ap-page {
          background: #f8fafc;
          min-height: 100vh;
        }

        .ap-top {
          background: #1a2634;
          color: white;
          padding: 40px 0;
        }

        .ap-top-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .ap-brand {
          font-size: 14px;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #94a3b8;
          margin-bottom: 24px;
        }

        .ap-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
        }

        .ap-header-row h1 {
          font-size: 36px;
          margin: 0;
        }

        .ap-header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .ap-dates {
          background: rgba(255,255,255,0.1);
          padding: 8px 16px;
          border-radius: 30px;
          font-size: 14px;
        }

        .ap-change-dates {
          background: none;
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          padding: 8px 20px;
          border-radius: 30px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ap-change-dates:hover {
          background: white;
          color: #1a2634;
        }

        .ap-results {
          max-width: 1280px;
          margin: 30px auto;
          padding: 0 24px;
          font-size: 16px;
          color: #64748b;
        }

        .ap-list {
          max-width: 1280px;
          margin: 0 auto 60px;
          padding: 0 24px;
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .ap-list-card {
          display: grid;
          grid-template-columns: 400px 1fr;
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .ap-list-image {
          position: relative;
          height: 300px;
          overflow: hidden;
        }

        .ap-list-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }

        .ap-list-card:hover .ap-list-image img {
          transform: scale(1.05);
        }

        .ap-list-gallery-btn {
          position: absolute;
          bottom: 16px;
          left: 16px;
          background: rgba(0,0,0,0.6);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 30px;
          font-size: 14px;
          cursor: pointer;
          backdrop-filter: blur(4px);
          transition: background 0.2s;
        }

        .ap-list-gallery-btn:hover {
          background: rgba(0,0,0,0.8);
        }

        .ap-list-content {
          padding: 30px;
          display: flex;
          flex-direction: column;
        }

        .ap-list-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .ap-list-header h2 {
          font-size: 24px;
          margin: 0;
          color: #1a2634;
        }

        .ap-list-guests {
          color: #64748b;
          font-size: 14px;
        }

        .ap-list-description {
          color: #334155;
          margin-bottom: 20px;
          line-height: 1.6;
        }

        .ap-list-features {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 24px;
          list-style: none;
          padding: 0;
        }

        .ap-list-features li {
          background: #f1f5f9;
          color: #334155;
          padding: 4px 12px;
          border-radius: 30px;
          font-size: 14px;
        }

        .ap-list-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
        }

        .ap-list-price {
          font-size: 24px;
          font-weight: 600;
          color: #139ab6;
        }

        .ap-list-actions {
          display: flex;
          gap: 12px;
        }

        .ap-btn-outline {
          background: none;
          border: 2px solid #139ab6;
          color: #139ab6;
          padding: 10px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          display: inline-block;
        }

        .ap-btn-outline:hover {
          background: #139ab6;
          color: white;
        }

        .ap-btn-primary {
          background: #139ab6;
          color: white;
          border: none;
          padding: 12px 32px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .ap-btn-primary:hover:not(:disabled) {
          background: #0f7a91;
        }

        .ap-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .ap-no-results {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 16px;
          max-width: 1280px;
          margin: 0 auto;
        }

        .ap-no-results p {
          font-size: 18px;
          color: #64748b;
          margin-bottom: 24px;
        }

        .fade-in {
          animation: fadeIn 0.6s ease forwards;
        }

        .slide-in {
          animation: slideIn 0.6s ease forwards;
        }

        .fade-in-delay {
          animation: fadeIn 0.6s ease 0.2s forwards;
          opacity: 0;
        }

        .card-appear {
          animation: cardAppear 0.5s ease forwards;
          opacity: 0;
          transform: translateY(20px);
        }

        @keyframes fadeIn {
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes cardAppear {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 1024px) {
          .ap-list-card {
            grid-template-columns: 300px 1fr;
          }
        }

        @media (max-width: 768px) {
          .ap-list-card {
            grid-template-columns: 1fr;
          }
          
          .ap-list-image {
            height: 250px;
          }
          
          .ap-header-row {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .ap-header-right {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </>
  );
}