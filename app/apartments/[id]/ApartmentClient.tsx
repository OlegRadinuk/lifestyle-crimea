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

  // ЛОГ 1: Инициализация компонента
  console.log('🚀 COMPONENT MOUNTED');
  console.log('📦 initialApartments count:', initialApartments.length);
  console.log('📦 initialApartments IDs:', initialApartments.map(a => a.id));

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
    console.log('🔄 useEffect triggered');
    console.log('🔍 search object:', search);
    console.log('🏢 apartments array:', apartments.map(a => ({ id: a.id, title: a.title })));

    const checkAllAvailability = async () => {
      console.log('⚡ checkAllAvailability STARTED');
      
      if (!search) {
        console.log('⛔ No search parameters, setting loading=false');
        setLoadingAvailability(false);
        return;
      }

      console.log('📅 Проверяем доступность для дат:', {
        checkIn: search.checkIn,
        checkOut: search.checkOut,
        guests: search.guests
      });
      
      setLoadingAvailability(true);
      const unavailable = new Set<string>();
      const results: Record<string, any> = {};

      console.log(`🔍 Начинаем проверку ${apartments.length} апартаментов...`);

      await Promise.all(
        apartments.map(async (apt) => {
          try {
            const url = `/api/availability-travelline/${apt.id}?checkIn=${search.checkIn}&checkOut=${search.checkOut}&t=${Date.now()}`;
            console.log(`📡 [${apt.id}] Запрос: ${url}`);
            
            const response = await fetch(url);
            console.log(`📡 [${apt.id}] Response status:`, response.status);
            
            const data = await response.json();
            console.log(`📡 [${apt.id}] Response data:`, data);
            
            results[apt.id] = data;
            
            if (!data.isAvailable) {
              console.log(`❌ [${apt.id}] НЕ доступен`);
              unavailable.add(apt.id);
            } else {
              console.log(`✅ [${apt.id}] доступен`);
            }
          } catch (error) {
            console.error(`🔥 [${apt.id}] Ошибка:`, error);
          }
        })
      );

      console.log('📊 Все результаты проверки:', results);
      console.log('🚫 Недоступные апартаменты:', Array.from(unavailable));
      console.log('✅ Доступные апартаменты:', apartments.length - unavailable.size);
      
      setUnavailableIds(unavailable);
      setLoadingAvailability(false);
      console.log('⚡ checkAllAvailability FINISHED');
    };

    checkAllAvailability();

    const handleBookingCompleted = (event: Event) => {
      console.log('🎉 Booking completed event received:', event);
      checkAllAvailability();
    };

    window.addEventListener('booking-completed', handleBookingCompleted);
    return () => {
      console.log('🧹 Cleaning up useEffect');
      window.removeEventListener('booking-completed', handleBookingCompleted);
    };
  }, [search, apartments]);

  const handleBookingClick = async (apartment: ApartmentClient) => {
    console.log('🖱️ handleBookingClick called for:', apartment.id, apartment.title);
    
    if (!search) {
      console.log('⛔ No search data');
      return;
    }

    setCheckingId(apartment.id);

    try {
      const url = `/api/availability-travelline/${apartment.id}?checkIn=${search.checkIn}&checkOut=${search.checkOut}&t=${Date.now()}`;
      console.log(`📡 [CLICK] Checking availability: ${url}`);
      
      const response = await fetch(url);
      console.log(`📡 [CLICK] Response status:`, response.status);
      
      const data = await response.json();
      console.log(`📡 [CLICK] Response data:`, data);

      if (data.isAvailable) {
        console.log(`✅ [CLICK] Apartment available, opening booking modal`);
        setBookingApartment({
          id: apartment.id,
          title: apartment.title,
        });
        setBookingOpen(true);
      } else {
        console.log(`❌ [CLICK] Apartment NOT available`);
        alert('Эти даты уже заняты. Пожалуйста, выберите другие даты.');
        setUnavailableIds(prev => new Set(prev).add(apartment.id));
      }
    } catch (error) {
      console.error('🔥 [CLICK] Error checking availability:', error);
      alert('Ошибка при проверке доступности');
    } finally {
      setCheckingId(null);
    }
  };

  if (!search) {
    console.log('⛔ Rendering empty state (no search)');
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
  console.log('🔍 Filtering apartments...');
  console.log('📊 Before filter - total:', apartments.length);
  console.log('📊 Unavailable IDs:', Array.from(unavailableIds));
  
  const filteredApartments = apartments.filter(
    (apt) => {
      const meetsGuests = apt.max_guests >= search.guests;
      const isAvailable = !unavailableIds.has(apt.id);
      console.log(`🔎 ${apt.id}: meetsGuests=${meetsGuests}, isAvailable=${isAvailable}, max_guests=${apt.max_guests}, guests=${search.guests}`);
      return meetsGuests && isAvailable;
    }
  );

  console.log('📊 After filter - available:', filteredApartments.length);

  if (loadingAvailability) {
    console.log('⏳ Rendering loading state');
    return (
      <section className="ap-page">
        <div className="ap-loading">Загрузка доступных апартаментов...</div>
      </section>
    );
  }

  console.log('✅ Rendering apartments list');
  
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