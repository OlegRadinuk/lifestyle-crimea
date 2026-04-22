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
  const [children, setChildren] = useState(0);
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
    let urlChildren: string | null = null;

    try {
      urlCheckIn = searchParams?.get('checkIn') || null;
      urlCheckOut = searchParams?.get('checkOut') || null;
      urlGuests = searchParams?.get('guests') || null;
      urlChildren = searchParams?.get('children') || null;
    } catch (e) {
      console.log('SearchParams error, using defaults');
    }

    if (urlCheckIn && urlCheckOut && urlGuests) {
      console.log('📌 Using URL params:', { urlCheckIn, urlCheckOut, urlGuests, urlChildren });
      setCheckIn(urlCheckIn);
      setCheckOut(urlCheckOut);
      setGuests(parseInt(urlGuests));
      setChildren(urlChildren ? parseInt(urlChildren) : 0);
    } else if (contextSearch) {
      console.log('📌 Using context search:', contextSearch);
      setCheckIn(contextSearch.checkIn);
      setCheckOut(contextSearch.checkOut);
      setGuests(contextSearch.guests);
      setChildren(contextSearch.children ?? 0);
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

  // Проверка доступности
  const checkAvailability = useCallback(async () => {
    if (!checkIn || !checkOut) return;

    setCheckingAvailability(true);
    const available = new Set<string>();

    // Фильтруем по количеству гостей и детей
    // Студии с 3+ спальными местами принимают до 2 детей до 6 лет бесплатно
    const apartmentsToCheck = allApartments.filter(apt =>
      apt.max_guests >= guests && (children === 0 || apt.max_guests >= 3)
    );
    
    console.log('🔍 Checking availability for:', apartmentsToCheck.length, 'apartments (filtered by guests)');
    
    await Promise.all(
      apartmentsToCheck.map(async (apt) => {
        try {
          const response = await fetch(
            `/api/availability-travelline/${apt.id}?checkIn=${checkIn}&checkOut=${checkOut}&t=${Date.now()}`
          );
          const data = await response.json();
          if (data.isAvailable === true) {
            available.add(apt.id);
          }
        } catch (error) {
          console.error(`Error checking ${apt.id}:`, error);
        }
      })
    );

    console.log('✅ Available apartments:', available.size);
    setAvailableIds(available);
    setCheckingAvailability(false);
  }, [checkIn, checkOut, guests, children, allApartments]);

  // Запускаем проверку при изменении дат или количества гостей
  useEffect(() => {
    if (checkIn && checkOut) {
      checkAvailability();
    } else {
      setAvailableIds(new Set());
    }
  }, [checkIn, checkOut, guests, children, checkAvailability]);

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

    // Обновляем URL и контекст
    const params = new URLSearchParams();
    params.set('checkIn', checkIn);
    params.set('checkOut', checkOut);
    params.set('guests', guests.toString());
    params.set('children', children.toString());
    router.push(`/apartments?${params.toString()}`);
    setSearch({ checkIn, checkOut, guests, children });

    // Скролл к результатам на мобилке
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setTimeout(() => {
        document.getElementById('ap-results-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
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

  // Студия подходит для детей до 6 лет если max_guests >= 3
  const aptFitsChildren = (apt: ApartmentClient) =>
    children === 0 || apt.max_guests >= 3;

  // Фильтруем по количеству гостей и детей для отображения
  const displayedApartments = sortedApartments.filter(apt =>
    (!hasSearchParams || apt.max_guests >= guests) && aptFitsChildren(apt)
  );

  const availableCount = Array.from(availableIds).filter(id => {
    const apt = allApartments.find(a => a.id === id);
    return apt && apt.max_guests >= guests && aptFitsChildren(apt);
  }).length;
  
  const totalCount = displayedApartments.length;

  return (
    <>
      <section className="ap-page">
        {/* Hero секция с заголовком и описанием */}
        <div className="ap-hero">
          <div className="ap-hero-container">
            <div className="ap-hero-left">
              <div className="ap-hero-brand">Стиль жизни · Алушта</div>
              <h1 className="ap-hero-title">Апартаменты</h1>
            </div>
            <div className="ap-hero-right">
  <p className="ap-hero-description">
    Создано для жизни, наполнено стилем. Наши номера — это автономные апартаменты с уютной кухней, 
    где удобно и готовить, и отдыхать.
  </p>
  <p className="ap-hero-description">
    Мы подготовили сюрприз для эстетов: коллекцию номеров в разных стилях, 
    чтобы вы могли выбрать интерьер, который понравится именно вам.
  </p>
</div>
          </div>
        </div>

        {/* Форма поиска */}
        <div className="ap-search-section">
          <div className="ap-search-container">
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
                <label>Взрослые</label>
                <select value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'гость' : 'гостей'}</option>
                  ))}
                </select>
              </div>
              <div className="ap-search-field">
                <label>Дети до 6 лет</label>
                <select value={children} onChange={(e) => setChildren(Number(e.target.value))}>
                  <option value={0}>Без детей</option>
                  <option value={1}>1 ребёнок</option>
                  <option value={2}>2 ребёнка</option>
                </select>
              </div>
              <button className="ap-search-btn" onClick={handleSearch}>
                Найти
              </button>
            </div>
            {formError && <div className="ap-search-error">{formError}</div>}
          </div>
        </div>

        {/* Результаты - только счетчик */}
        <div id="ap-results-anchor" className="ap-results">
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
          </div>
        </div>

        {/* Список апартаментов */}
        {checkingAvailability && hasSearchParams ? (
          <div className="ap-loading">Загрузка доступных апартаментов...</div>
        ) : (
          <div className="ap-list">
            {displayedApartments.length === 0 && hasSearchParams ? (
              <div className="ap-empty">
                <p>Нет апартаментов, подходящих под выбранные параметры</p>
                <p>Попробуйте изменить даты или количество гостей</p>
              </div>
            ) : (
              displayedApartments.map((apartment, index) => {
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
                      {apartment.hot_deal_enabled && (
                        <div className="hot-deal-badge">🔥 Скидка {apartment.hot_deal_discount}%</div>
                      )}
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

                      {apartment.max_guests >= 3 && (
                        <div className="ap-children-badge">
                          Дети до 6 лет — бесплатно
                        </div>
                      )}

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
                        {apartment.hot_deal_enabled ? (
                          <div className="ap-list-price">
                            <span className="price-original">{apartment.price_base.toLocaleString()} ₽</span>
                            <span className="price-discounted">
                              {Math.round(apartment.price_base * (1 - (apartment.hot_deal_discount ?? 10) / 100)).toLocaleString()} ₽ / ночь
                            </span>
                          </div>
                        ) : (
                          <div className="ap-list-price">
                            от {apartment.price_base.toLocaleString()} ₽ / ночь
                          </div>
                        )}

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
            checkAvailability();
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