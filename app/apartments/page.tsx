'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { APARTMENTS } from '@/data/apartments';
import { useSearch } from '@/components/SearchContext';
import { useHeader } from '@/components/HeaderContext';
import BookingModal, { DateRange } from '@/components/BookingModal';
import Footer from '@/components/Footer';
import { usePhotoModal } from '@/components/photo-modal/PhotoModalContext';

import './apartments.css';

function formatDate(date: string) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

export default function ApartmentsPage() {
  const { open } = usePhotoModal();
  const router = useRouter();
  const { search } = useSearch();
  const { register, unregister } = useHeader();

  const [bookingApartment, setBookingApartment] = useState<null | {
    id: string;
    title: string;
  }>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [unavailableIds, setUnavailableIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

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
      if (!search) return;

      setLoading(true);
      const unavailable = new Set<string>();

      await Promise.all(
        APARTMENTS.map(async (apt) => {
          try {
            const response = await fetch(
              `/api/availability/${apt.id}?checkIn=${search.checkIn}&checkOut=${search.checkOut}`
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
      setLoading(false);
    };

    checkAllAvailability();

    // Слушаем событие бронирования для обновления списка
    const handleBookingCompleted = () => {
      checkAllAvailability();
    };

    window.addEventListener('booking-completed', handleBookingCompleted);
    return () => window.removeEventListener('booking-completed', handleBookingCompleted);
  }, [search]);

  // Проверка перед бронированием
  const handleBookingClick = async (apartment: (typeof APARTMENTS)[0]) => {
    if (!search) return;

    setCheckingId(apartment.id);

    try {
      const response = await fetch(
        `/api/availability/${apartment.id}?checkIn=${search.checkIn}&checkOut=${search.checkOut}`
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
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      alert('Ошибка при проверке доступности');
    } finally {
      setCheckingId(null);
    }
  };

  /* ---------- NO SEARCH ---------- */
  if (!search) {
    return (
      <section className="ap-empty">
        <h1>Нет параметров поиска</h1>
        <p>
          Пожалуйста, выберите даты и количество гостей на главной странице.
        </p>

        <button className="btn-primary" onClick={() => router.push('/')}>
          Перейти на главную
        </button>
      </section>
    );
  }

  // Фильтруем апартаменты: сначала по гостям, потом убираем занятые
  const filteredApartments = APARTMENTS.filter(
    (apt) => apt.maxGuests >= search.guests && !unavailableIds.has(apt.id)
  );

  if (loading) {
    return (
      <section className="ap-page">
        <div className="ap-loading">Загрузка доступных апартаментов...</div>
      </section>
    );
  }

  return (
    <>
      <section className="ap-page">
        {/* TOP */}
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

        {/* RESULTS */}
        <div className="ap-results fade-in-delay">
          Найдено вариантов: <strong>{filteredApartments.length}</strong>
        </div>

        {/* LIST */}
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
                  <img src={apartment.images[0]} alt={apartment.title} />

                  <button
                    className="ap-list-gallery-btn"
                    onClick={() => open(apartment.images, 0)}
                  >
                    Смотреть фото
                  </button>
                </div>
                <div className="ap-list-content">
                  <div className="ap-list-header">
                    <h2>{apartment.title}</h2>

                    <span className="ap-list-guests">
                      до {apartment.maxGuests} гостей
                    </span>
                  </div>

                  <p className="ap-list-description">
                    {apartment.shortDescription}
                  </p>

                  <ul className="ap-list-features">
                    {apartment.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>

                  <div className="ap-list-footer">
                    <div className="ap-list-price">
                      от {apartment.priceBase.toLocaleString()} ₽ / ночь
                    </div>

                    <div className="ap-list-actions">
                      <button
                        className="btn-outline"
                        onClick={() => router.push(`/apartments/${apartment.id}`)}
                      >
                        Смотреть апартамент
                      </button>

                      <button
                        className="btn-primary"
                        onClick={() => handleBookingClick(apartment)}
                        disabled={checkingId === apartment.id}
                      >
                        {checkingId === apartment.id
                          ? 'Проверка...'
                          : 'Забронировать'}
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
          } as DateRange}
          initialGuests={search.guests}
          onClose={() => setBookingOpen(false)}
          onConfirm={(data) => {
            console.log('BOOKING RESULT', data);
            setBookingOpen(false);
          }}
        />
      )}
    </>
  );
}