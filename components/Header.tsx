// components/Header.tsx - оптимизированная версия
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useApartment } from '@/components/ApartmentContext';
import { useSearch } from '@/components/SearchContext';
import { useHeader } from '@/components/HeaderContext';
import { useAvailability } from '@/hooks/useAvailability';
import ApartmentAvailabilityCalendar from '@/components/ApartmentAvailabilityCalendar';
import BookingModal from '@/components/BookingModal';
import MobileBookingSheet from '@/components/MobileBookingSheet';

type DateRange = { from: Date; to: Date } | null;

function formatDateForDisplay(dateStr: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function Header({ onBurgerClick }: { onBurgerClick: () => void }) {
  const router = useRouter();
  const { setSearch } = useSearch();
  const { mode } = useHeader();
  const { currentApartment } = useApartment();
  const { blockedDates } = useAvailability(currentApartment?.id || null);

  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DateRange>(null);

  // Hero state
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [formError, setFormError] = useState('');

  const popoverRef = useRef<HTMLDivElement>(null);
  const today = new Date().toISOString().split('T')[0];

  // Проверка мобильного устройства
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Отслеживание скролла
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Закрытие календаря при клике вне
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
      setFormError('Выберите даты заезда и выезда');
      return;
    }
    setFormError('');
    setSearch({ checkIn, checkOut, guests });
    router.push('/apartments');
  };

  const handleMobileBooking = (data: { checkIn: string; checkOut: string; guests: number }) => {
    setSearch(data);
    router.push('/apartments');
  };

  return (
    <>
      <header className={`header header--${mode} ${scrolled ? 'scrolled' : ''}`}>
        <button className="header__burger" onClick={onBurgerClick}>
          <div className="burger-icon">
            <span />
            <span />
            <span />
          </div>
          <span className="burger-text">Меню</span>
        </button>

        {/* Hero Mode */}
        {mode === 'hero' && (
          <>
            {!isMobile ? (
              <div className="header__booking-wrapper">
                <div className="header__booking-fields">
                  <div className="booking-field" onClick={() => setCalendarOpen(true)}>
                    <label>Заезд</label>
                    <input
                      type="text"
                      placeholder="ДД.ММ.ГГГГ"
                      value={formatDateForDisplay(checkIn)}
                      readOnly
                    />
                  </div>
                  <div className="booking-field" onClick={() => setCalendarOpen(true)}>
                    <label>Выезд</label>
                    <input
                      type="text"
                      placeholder="ДД.ММ.ГГГГ"
                      value={formatDateForDisplay(checkOut)}
                      readOnly
                    />
                  </div>
                  <div className="booking-field">
                    <label>Гости</label>
                    <select value={guests} onChange={e => setGuests(+e.target.value)}>
                      {[1, 2, 3, 4, 5, 6].map(n => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? 'гость' : 'гостей'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="header__booking-action">
                  <button className="header__booking" onClick={handleHeroSearch}>
                    Выбрать апартаменты
                  </button>
                  {formError && <div className="header__booking-error">{formError}</div>}
                </div>

                <AnimatePresence>
                  {calendarOpen && (
                    <div ref={popoverRef} className="header__calendar-popover hero-calendar">
                      <ApartmentAvailabilityCalendar
                        blockedDates={[]}
                        position="left"
                        onConfirm={(range) => {
                          setCheckIn(format(range.from, 'yyyy-MM-dd'));
                          setCheckOut(format(range.to, 'yyyy-MM-dd'));
                          setCalendarOpen(false);
                        }}
                        onClose={() => setCalendarOpen(false)}
                        showPrice={false}
                      />
                    </div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                className="header__mobile-book-btn"
                onClick={() => setMobileSheetOpen(true)}
              >
                Забронировать
              </button>
            )}
          </>
        )}

        {/* Apartment Mode */}
        {mode === 'apartment' && currentApartment && (
          <div className="header__booking-wrapper is-apartment">
            <div className="header__booking-action relative">
              <button
                className="header__booking with-apartment"
                onClick={() => setCalendarOpen(prev => !prev)}
              >
                <span className="header__booking-label">Проверить доступность</span>
                <span className="header__booking-apartment">
                  {currentApartment.title.replace(/^LS\s*/i, '')}
                </span>
              </button>

              <AnimatePresence>
                {calendarOpen && (
                  <div ref={popoverRef} className="header__calendar-popover">
                    <ApartmentAvailabilityCalendar
                      key={`calendar-${currentApartment.id}-${blockedDates.length}`}
                      blockedDates={blockedDates}
                      position="right"
                      onConfirm={(range) => {
                        setSelectedRange(range);
                        setCalendarOpen(false);
                        setBookingModalOpen(true);
                      }}
                      onClose={() => setCalendarOpen(false)}
                      showPrice={true}
                    />
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Dark Mode */}
        {mode === 'dark' && <div className="header__dark-placeholder" />}
      </header>

      {/* Mobile Sheet */}
      {mobileSheetOpen && (
        <MobileBookingSheet
          isOpen={mobileSheetOpen}
          onClose={() => setMobileSheetOpen(false)}
          onConfirm={handleMobileBooking}
          initialGuests={guests}
          today={today}
        />
      )}

      {/* Booking Modal */}
      {bookingModalOpen && currentApartment && selectedRange && (
        <BookingModal
          apartment={{ id: currentApartment.id, title: currentApartment.title }}
          initialRange={selectedRange}
          initialGuests={guests}
          onClose={() => setBookingModalOpen(false)}
          onConfirm={(data) => {
            console.log('Booking confirmed:', data);
            setBookingModalOpen(false);
          }}
        />
      )}
    </>
  );
}