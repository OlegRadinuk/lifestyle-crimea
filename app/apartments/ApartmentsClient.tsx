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
      <div className="apartments-empty">
        <h1>Нет параметров поиска</h1>
        <p>Пожалуйста, выберите даты и количество гостей на главной странице.</p>
        <button className="apartments-btn-primary" onClick={() => router.push('/')}>
          Перейти на главную
        </button>
      </div>
    );
  }

  // Фильтруем апартаменты по гостям и доступности
  const filteredApartments = apartments.filter(
    (apt) => apt.max_guests >= search.guests && !unavailableIds.has(apt.id)
  );

  if (loadingAvailability) {
    return (
      <div className="apartments-loading">
        Загрузка доступных апартаментов...
      </div>
    );
  }

  return (
    <>
      <div className="apartments-page">
        <header className="apartments-header">
          <div className="apartments-header-inner">
            <div className="apartments-brand">Стиль жизни · Алушта</div>

            <div className="apartments-header-row">
              <h1>Доступные апартаменты</h1>

              <div className="apartments-header-right">
                <span className="apartments-dates">
                  {formatDate(search.checkIn)} — {formatDate(search.checkOut)}
                </span>

                <button
                  className="apartments-change-dates"
                  onClick={() => router.push('/')}
                >
                  Изменить даты
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="apartments-results">
          Найдено вариантов: <strong>{filteredApartments.length}</strong>
        </div>

        {filteredApartments.length === 0 ? (
          <div className="apartments-no-results">
            <p>Нет свободных апартаментов на выбранные даты.</p>
            <button className="apartments-btn-primary" onClick={() => router.push('/')}>
              Изменить даты
            </button>
          </div>
        ) : (
          <div className="apartments-list">
            {filteredApartments.map((apartment, index) => (
              <article
                key={apartment.id}
                className="apartments-card"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="apartments-card-image">
                  <img 
                    src={apartment.images?.[0] || '/images/placeholder.jpg'} 
                    alt={apartment.title} 
                  />
                  <button
                    className="apartments-card-gallery-btn"
                    onClick={() => open(apartment.images || ['/images/placeholder.jpg'], 0)}
                  >
                    Смотреть фото
                  </button>
                </div>
                <div className="apartments-card-content">
                  <div className="apartments-card-header">
                    <h2>{apartment.title}</h2>
                    <span className="apartments-card-guests">
                      до {apartment.max_guests} гостей
                    </span>
                  </div>

                  <p className="apartments-card-description">{apartment.short_description}</p>

                  {apartment.features && apartment.features.length > 0 && (
                    <ul className="apartments-card-features">
                      {apartment.features.slice(0, 3).map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                      {apartment.features.length > 3 && (
                        <li>+{apartment.features.length - 3}</li>
                      )}
                    </ul>
                  )}

                  <div className="apartments-card-footer">
                    <div className="apartments-card-price">
                      от {apartment.price_base.toLocaleString()} ₽ / ночь
                    </div>

                    <div className="apartments-card-actions">
                      <Link
                        href={`/apartments/${apartment.id}`}
                        className="apartments-btn-outline"
                      >
                        Подробнее
                      </Link>

                      <button
                        className="apartments-btn-primary"
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
      </div>

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