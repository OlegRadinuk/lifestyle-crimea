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
import './apartments.css';

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

  // Проверка доступности всех апартаментов - ИСПРАВЛЕНО
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
            // ИСПРАВЛЕНО: используем правильный endpoint availability-travelline
            const response = await fetch(
              `/api/availability-travelline/${apt.id}?checkIn=${search.checkIn}&checkOut=${search.checkOut}&t=${Date.now()}`
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
      // ИСПРАВЛЕНО: используем правильный endpoint
      const response = await fetch(
        `/api/availability-travelline/${apartment.id}?checkIn=${search.checkIn}&checkOut=${search.checkOut}&t=${Date.now()}`
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
        <button className="btn-primary" onClick={() => router.push('/')}>
          Перейти на главную
        </button>
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
            <button className="btn-primary" onClick={() => router.push('/')}>
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
                        className="btn-outline"
                      >
                        Подробнее
                      </Link>

                      <button
                        className="btn-primary"
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
    </>
  );
}