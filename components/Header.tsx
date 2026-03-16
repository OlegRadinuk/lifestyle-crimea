'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useApartment } from '@/components/ApartmentContext';
import { useSearch } from '@/components/SearchContext';
import { useHeader } from '@/components/HeaderContext';
import { useAvailability } from '@/hooks/useAvailability';
import ApartmentAvailabilityCalendar from '@/components/ApartmentAvailabilityCalendar';
import BookingModal from '@/components/BookingModal';
// import MobileBookingSheet from '@/components/MobileBookingSheet'; // Закомментируем, пока не нужен

type Props = {
  onBurgerClick: () => void;
};

type DateRange = {
  from: Date;
  to: Date;
} | null;

function formatDateForInput(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function Header({ onBurgerClick }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { setSearch } = useSearch();
  const { mode } = useHeader();
  const { currentApartment: panoramaApartment } = useApartment();

  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [apartmentPrice, setApartmentPrice] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [loadingPrice, setLoadingPrice] = useState(false);

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DateRange>(null);

  // Состояние для апартамента из URL (для страницы апартаментов)
  const [urlApartment, setUrlApartment] = useState<{ id: string; title: string } | null>(null);

  // Определяем тип страницы
  const isPanoramaPage = pathname === '/';
  const isApartmentPage = pathname?.startsWith('/apartments/') && pathname !== '/apartments';

  // Загружаем апартамент из URL если мы на странице апартамента
  useEffect(() => {
    const fetchApartmentFromUrl = async () => {
      const match = pathname?.match(/^\/apartments\/([^\/]+)$/);
      
      if (match) {
        const apartmentId = match[1];
        try {
          const res = await fetch(`/api/apartments/${apartmentId}`);
          if (res.ok) {
            const data = await res.json();
            setUrlApartment({
              id: data.id,
              title: data.title
            });
            setIsActive(data.is_active);
            setApartmentPrice(data.price_base);
          } else {
            setUrlApartment(null);
          }
        } catch (error) {
          console.error('Error fetching apartment from URL:', error);
          setUrlApartment(null);
        }
      } else {
        setUrlApartment(null);
      }
    };

    if (isApartmentPage) {
      fetchApartmentFromUrl();
    } else {
      setUrlApartment(null);
    }
  }, [pathname, isApartmentPage]);

  // Определяем какой апартамент показывать в зависимости от страницы
  const getActiveApartment = () => {
    if (isApartmentPage && urlApartment) {
      return urlApartment;
    } else if (isPanoramaPage && panoramaApartment) {
      return panoramaApartment;
    }
    return null;
  };

  const activeApartment = getActiveApartment();

  const { blockedDates } = useAvailability(activeApartment?.id || null);

  /* ---------- HERO STATE ---------- */
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [formError, setFormError] = useState('');

  const popoverRef = useRef<HTMLDivElement | null>(null);
  const today = new Date().toISOString().split('T')[0];

  // Загружаем данные апартамента из БД (для цены и статуса)
  useEffect(() => {
    if (!activeApartment?.id) {
      setApartmentPrice(0);
      setIsActive(false);
      return;
    }
    
    const fetchApartmentData = async () => {
      setLoadingPrice(true);
      try {
        const res = await fetch(`/api/apartments/${activeApartment.id}`);
        
        if (res.ok) {
          const data = await res.json();
          setApartmentPrice(data.price_base || 0);
          setIsActive(data.is_active === true);
        } else {
          setApartmentPrice(0);
          setIsActive(false);
        }
      } catch (error) {
        console.error('❌ Error fetching apartment data:', error);
        setApartmentPrice(0);
        setIsActive(false);
      } finally {
        setLoadingPrice(false);
      }
    };

    fetchApartmentData();
  }, [activeApartment?.id]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!calendarOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [calendarOpen]);

  const handleHeroSearch = () => {
    if (!checkIn || !checkOut) {
      setFormError('Пожалуйста, выберите даты заезда и выезда');
      return;
    }
    setFormError('');
    setSearch({ checkIn, checkOut, guests });
    router.push('/apartments');
  };

  const openCalendar = () => {
    setCalendarOpen(true);
  };

  return (
    <>
      <header
        className={`
          header
          header--${mode}
          ${scrolled ? 'scrolled' : ''}
          ${isMobile ? 'header--mobile' : ''}
        `}
      >
        <button className="header__burger" onClick={onBurgerClick}>
          <svg 
            className="burger-icon-svg" 
            width="26" 
            height="18" 
            viewBox="0 0 26 18" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect y="0" width="26" height="2" fill="white" />
            <rect y="8" width="26" height="2" fill="white" />
            <rect y="16" width="26" height="2" fill="white" />
          </svg>
          <span className="burger-text">Меню</span>
        </button>

        {mode === 'hero' && (
          <>
            {!isMobile ? (
              /* ДЕСКТОП ВЕРСИЯ */
              <div className="header__booking-wrapper">
                <div className="header__booking-fields">
                  <div
                    className="booking-field calendar-trigger"
                    onClick={openCalendar}
                  >
                    <label>Заезд</label>
                    <input
                      type="text"
                      placeholder="ДД.ММ.ГГГГ"
                      value={formatDateForInput(checkIn)}
                      readOnly
                    />
                  </div>
                  <div
                    className="booking-field calendar-trigger"
                    onClick={openCalendar}
                  >
                    <label>Выезд</label>
                    <input
                      type="text"
                      placeholder="ДД.ММ.ГГГГ"
                      value={formatDateForInput(checkOut)}
                      readOnly
                    />
                  </div>
                  <div className="booking-field">
                    <label>Гости</label>
                    <select value={guests} onChange={e => setGuests(+e.target.value)}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? 'гость' : 'гостя'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button className="header__booking" onClick={handleHeroSearch}>
                  Выбрать апартаменты
                </button>
              </div>
            ) : (
              /* МОБИЛЬНАЯ ВЕРСИЯ */
              <>
                <button
                  className="header__mobile-book-btn"
                  onClick={handleHeroSearch}
                >
                  Выбрать апартаменты
                </button>
              </>
            )}

            {/* Ошибка формы для десктопа */}
            {!isMobile && formError && (
              <div className="header__booking-error">{formError}</div>
            )}
          </>
        )}

        {/* МОБИЛЬНЫЕ ПОЛЯ ВВОДА - ТОЛЬКО ДЛЯ HERO */}
        {mode === 'hero' && isMobile && (
          <div className="header__mobile-fields">
            <div className="header__mobile-fields-row">
              <div
                className="mobile-field calendar-trigger"
                onClick={openCalendar}
              >
                <label>Заезд</label>
                <input
                  type="text"
                  placeholder="ДД.ММ.ГГГГ"
                  value={formatDateForInput(checkIn)}
                  readOnly
                />
              </div>
              <div
                className="mobile-field calendar-trigger"
                onClick={openCalendar}
              >
                <label>Выезд</label>
                <input
                  type="text"
                  placeholder="ДД.ММ.ГГГГ"
                  value={formatDateForInput(checkOut)}
                  readOnly
                />
              </div>
              <div className="mobile-field">
                <label>Гости</label>
                <select value={guests} onChange={e => setGuests(+e.target.value)}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {formError && <div className="header__mobile-error">{formError}</div>}
          </div>
        )}

        {/* Календарь для десктопа */}
        <AnimatePresence>
          {calendarOpen && mode === 'hero' && !isMobile && (
            <div ref={popoverRef} className="header__calendar-popover hero-calendar">
              <ApartmentAvailabilityCalendar
                blockedDates={[]}
                position="left"
                onConfirm={(range) => {
                  setCheckIn(format(range.from, 'yyyy-MM-dd'));
                  setCheckOut(format(range.to, 'yyyy-MM-dd'));
                  setCalendarOpen(false);
                  setFormError('');
                }}
                onClose={() => setCalendarOpen(false)}
                showPrice={false}
              />
            </div>
          )}
        </AnimatePresence>

        {/* Календарь для мобильных - используем класс mobile-position */}
        <AnimatePresence>
          {calendarOpen && mode === 'hero' && isMobile && (
            <div 
              ref={popoverRef} 
              className="header__calendar-popover mobile-position"
            >
              <ApartmentAvailabilityCalendar
                blockedDates={[]}
                position="left"
                onConfirm={(range) => {
                  setCheckIn(format(range.from, 'yyyy-MM-dd'));
                  setCheckOut(format(range.to, 'yyyy-MM-dd'));
                  setCalendarOpen(false);
                  setFormError('');
                }}
                onClose={() => setCalendarOpen(false)}
                showPrice={false}
              />
            </div>
          )}
        </AnimatePresence>

        {/* В режиме apartment - показываем для активных апартаментов */}
        {mode === 'apartment' && activeApartment && isActive && (
          <div className="header__booking-wrapper is-apartment">
            <div className="header__booking-action" style={{ position: 'relative' }}>
              <button
                className="header__booking with-apartment"
                onClick={() => setCalendarOpen(prev => !prev)}
                disabled={loadingPrice}
              >
                <span className="header__booking-label">Проверить доступность</span>
                <span className="header__booking-apartment">
                  {activeApartment.title.replace(/^LS\s*/i, '')}
                </span>
              </button>

              <AnimatePresence>
                {calendarOpen && mode === 'apartment' && (
                  <div ref={popoverRef} className="header__calendar-popover">
                    <ApartmentAvailabilityCalendar
                      key={`calendar-${activeApartment.id}-${blockedDates.length}-${apartmentPrice}`}
                      blockedDates={blockedDates}
                      position="right"
                      onConfirm={(range) => {
                        setSelectedRange(range);
                        setCalendarOpen(false);
                        setBookingModalOpen(true);
                      }}
                      onClose={() => setCalendarOpen(false)}
                      showPrice={true}
                      apartmentPrice={apartmentPrice}
                    />
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {mode === 'dark' && <div className="header__dark-placeholder" />}
      </header>

      {bookingModalOpen && activeApartment && selectedRange && isActive && (
        <BookingModal
          apartment={{
            id: activeApartment.id,
            title: activeApartment.title,
            price_base: apartmentPrice
          }}
          initialRange={selectedRange}
          initialGuests={guests}
          onClose={() => setBookingModalOpen(false)}
          onConfirm={(data) => {
            console.log('FINAL BOOKING DATA', data);
            setBookingModalOpen(false);
          }}
        />
      )}
    </>
  );
}