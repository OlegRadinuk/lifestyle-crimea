'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSearch } from '@/components/SearchContext';
import { useHeader } from '@/components/HeaderContext';
import { usePhotoModal } from '@/components/photo-modal/PhotoModalContext';
import BookingModal from '@/components/BookingModal';
import Footer from '@/components/Footer';
import { ApartmentClient } from '@/lib/types';
import './apartments.css';

interface ApartmentsClientProps {
  initialApartments: ApartmentClient[];
}

function formatDateForInput(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function ApartmentsClient({ initialApartments }: ApartmentsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSearch, search: contextSearch } = useSearch();
  const { register, unregister } = useHeader();
  const { open } = usePhotoModal();

  // Состояние формы поиска
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [formError, setFormError] = useState('');

  // Состояние апартаментов и доступности
  const [allApartments] = useState(initialApartments);
  const [availableIds, setAvailableIds] = useState<Set<string>>(new Set());
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Состояние модалки бронирования
  const [bookingApartment, setBookingApartment] = useState<{
    id: string;
    title: string;
    price_base?: number;
  } | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [checkingId, setCheckingId] = useState<string | null>(null);

  // Инициализация из URL или контекста
  useEffect(() => {
    let urlCheckIn: string | null = null;
    let urlCheckOut: string | null = null;
    let urlGuests: string | null = null;
    
    try {
      urlCheckIn = searchParams?.get('checkIn') || null;
      urlCheckOut = searchParams?.get('checkOut') || null;
      urlGuests = searchParams?.get('guests') || null;
    } catch (e) {
      console.log('SearchParams error, using defaults');
    }

    if (urlCheckIn && urlCheckOut && urlGuests) {
      setCheckIn(urlCheckIn);
      setCheckOut(urlCheckOut);
      setGuests(parseInt(urlGuests));
    } else if (contextSearch) {
      setCheckIn(contextSearch.checkIn);
      setCheckOut(contextSearch.checkOut);
      setGuests(contextSearch.guests);
    }
  }, [searchParams, contextSearch]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    register('apartments-page', {
      mode: 'dark',
      priority: 20,
    });
    return () => unregister('apartments-page');
  }, [register, unregister]);

  // Проверка доступности для всех апартаментов
  const checkAllAvailability = useCallback(async (checkInDate: string, checkOutDate: string, guestCount: number) => {
    if (!checkInDate || !checkOutDate) return new Set<string>();
    
    setCheckingAvailability(true);
    const available = new Set<string>();

    // Фильтруем по максимальному количеству гостей
    const filteredByGuests = allApartments.filter(apt => apt.max_guests >= guestCount);
    
    await Promise.all(
      filteredByGuests.map(async (apt) => {
        try {
          // Используем правильный эндпоинт с apartmentId
          const response = await fetch(
            `/api/availability-travelline/${apt.id}?checkIn=${checkInDate}&checkOut=${checkOutDate}&t=${Date.now()}`
          );
          const data = await response.json();
          // Проверяем поле isAvailable из ответа API
          if (data.isAvailable === true) {
            available.add(apt.id);
          }
        } catch (error) {
          console.error(`Error checking ${apt.id}:`, error);
        }
      })
    );

    setCheckingAvailability(false);
    return available;
  }, [allApartments]);

  // Запускаем проверку при изменении дат или количества гостей
  useEffect(() => {
    if (checkIn && checkOut) {
      checkAllAvailability(checkIn, checkOut, guests).then(available => {
        setAvailableIds(available);
      });
    } else {
      setAvailableIds(new Set());
    }
  }, [checkIn, checkOut, guests, checkAllAvailability]);

  const handleSearch = () => {
    if (!checkIn || !checkOut) {
      setFormError('Пожалуйста, выберите даты заезда и выезда');
      return;
    }
    
    if (guests < 1) {
      setFormError('Пожалуйста, укажите количество гостей');
      return;
    }
    
    setFormError('');
    
    // Обновляем URL
    const params = new URLSearchParams();
    params.set('checkIn', checkIn);
    params.set('checkOut', checkOut);
    params.set('guests', guests.toString());
    router.push(`/apartments?${params.toString()}`);
    
    // Обновляем контекст
    setSearch({ checkIn, checkOut, guests });
  };

  const handleBookingClick = async (apartment: ApartmentClient) => {
    if (!checkIn || !checkOut) {
      alert('Пожалуйста, выберите даты');
      return;
    }

    setCheckingId(apartment.id);

    try {
      const response = await fetch(
        `/api/availability-travelline/${apartment.id}?checkIn=${checkIn}&checkOut=${checkOut}&t=${Date.now()}`
      );
      const data = await response.json();

      if (data.isAvailable === true) {
        setBookingApartment({
          id: apartment.id,
          title: apartment.title,
          price_base: apartment.price_base,
        });
        setBookingOpen(true);
      } else {
        alert('Эти даты уже заняты. Пожалуйста, выберите другие даты.');
        // Обновляем доступность
        setAvailableIds(prev => {
          const next = new Set(prev);
          next.delete(apartment.id);
          return next;
        });
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      alert('Ошибка при проверке доступности');
    } finally {
      setCheckingId(null);
    }
  };

  // Сортируем апартаменты: сначала доступные (по цене), потом недоступные (по цене)
  const sortedApartments = [...allApartments].sort((a, b) => {
    const aAvailable = checkIn && checkOut ? availableIds.has(a.id) : true;
    const bAvailable = checkIn && checkOut ? availableIds.has(b.id) : true;
    
    if (aAvailable && !bAvailable) return -1;
    if (!aAvailable && bAvailable) return 1;
    return a.price_base - b.price_base;
  });

  const hasSearchParams = checkIn && checkOut;
  
  // Фильтруем по количеству гостей для отображения
  const filteredByGuests = sortedApartments.filter(apt => !hasSearchParams || apt.max_guests >= guests);
  
  const availableCount = Array.from(availableIds).filter(id => {
    const apt = allApartments.find(a => a.id === id);
    return apt && apt.max_guests >= guests;
  }).length;
  
  const totalCount = filteredByGuests.length;

  return (
    <>
      <section className="ap-page">
        {/* Форма поиска */}
        <div className="ap-search-section">
          <div className="ap-search-container">
            <h2 className="ap-search-title">Выберите даты проживания</h2>
            <div className="ap-search-form">
              <div className="ap-search-field">
                <label>Заезд</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="ap-search-field">
                <label>Выезд</label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  min={checkIn || new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="ap-search-field">
                <label>Гости</label>
                <select value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'гость' : 'гостей'}</option>
                  ))}
                </select>
              </div>
              <button className="ap-search-btn" onClick={handleSearch}>
                Найти
              </button>
            </div>
            {formError && <div className="ap-search-error">{formError}</div>}
          </div>
        </div>

        {/* Результаты поиска */}
        <div className="ap-results">
          <div className="ap-results-header">
            <span>
              {hasSearchParams ? (
                checkingAvailability 
                  ? 'Проверяем доступность...' 
                  : `Найдено: ${availableCount} ${getDeclension(availableCount, 'доступный апартамент', 'доступных апартамента', 'доступных апартаментов')}`
              ) : (
                `Все апартаменты (${allApartments.length})`
              )}
            </span>
            {hasSearchParams && availableCount > 0 && (
              <span className="ap-available-count">
                🟢 Доступно: {availableCount}
              </span>
            )}
            {hasSearchParams && availableCount < totalCount && (
              <span className="ap-unavailable-count">
                🔴 Недоступно: {totalCount - availableCount}
              </span>
            )}
            {hasSearchParams && guests > 0 && (
              <span className="ap-guests-filter">
                👥 До {guests} гостей
              </span>
            )}
          </div>
        </div>

        {/* Список апартаментов */}
        {checkingAvailability && hasSearchParams ? (
          <div className="ap-loading">Загрузка доступных апартаментов...</div>
        ) : (
          <div className="ap-list">
            {filteredByGuests.length === 0 && hasSearchParams ? (
              <div className="ap-empty">
                <p>Нет апартаментов, подходящих под выбранные параметры</p>
                <p>Попробуйте изменить даты или количество гостей</p>
              </div>
            ) : (
              filteredByGuests.map((apartment, index) => {
                const isAvailable = !hasSearchParams || availableIds.has(apartment.id);
                const apartmentUrl = `/apartments/${apartment.id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`;
                
                return (
                  <article
                    key={apartment.id}
                    className={`ap-list-card card-appear ${!isAvailable ? 'unavailable' : ''}`}
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
                      {!isAvailable && hasSearchParams && (
                        <div className="unavailable-badge">Нет мест</div>
                      )}
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
                          <Link href={apartmentUrl} className="btn-outline">
                            Подробнее
                          </Link>

                          {!hasSearchParams ? (
                            <Link href={`/apartments/${apartment.id}`} className="btn-primary">
                              Выбрать даты
                            </Link>
                          ) : isAvailable ? (
                            <button
                              className="btn-primary"
                              onClick={() => handleBookingClick(apartment)}
                              disabled={checkingId === apartment.id}
                            >
                              {checkingId === apartment.id ? 'Проверка...' : 'Забронировать'}
                            </button>
                          ) : (
                            <button className="btn-unavailable" disabled>
                              Недоступно
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}

        <Footer isMobile={isMobile} />
      </section>

      {bookingOpen && bookingApartment && checkIn && checkOut && (
        <BookingModal
          apartment={bookingApartment}
          initialRange={{
            from: new Date(checkIn),
            to: new Date(checkOut),
          }}
          initialGuests={guests}
          onClose={() => setBookingOpen(false)}
          onConfirm={() => {
            setBookingOpen(false);
            window.dispatchEvent(new CustomEvent('booking-completed'));
            // Обновляем доступность после бронирования
            checkAllAvailability(checkIn, checkOut, guests).then(available => {
              setAvailableIds(available);
            });
          }}
        />
      )}
    </>
  );
}

// Вспомогательная функция для склонения
function getDeclension(number: number, one: string, two: string, five: string): string {
  const n = Math.abs(number);
  const n10 = n % 10;
  const n100 = n % 100;
  
  if (n10 === 1 && n100 !== 11) return one;
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return two;
  return five;
}