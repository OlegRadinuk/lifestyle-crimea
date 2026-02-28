'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useApartment } from '@/components/ApartmentContext';
import { useSearch } from '@/components/SearchContext';
import { useHeader } from '@/components/HeaderContext';
import { useAvailability } from '@/hooks/useAvailability';
import ApartmentAvailabilityCalendar from '@/components/ApartmentAvailabilityCalendar';
import BookingModal from '@/components/BookingModal';
import MobileBookingSheet from '@/components/MobileBookingSheet';
import { APARTMENTS } from '@/data/apartments';

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
  const { setSearch } = useSearch();
  const { mode } = useHeader();
  const { currentApartment } = useApartment();

  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DateRange>(null);

  const { blockedDates } = useAvailability(currentApartment?.id || null);

  /* ---------- HERO STATE ---------- */
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [formError, setFormError] = useState('');

  /* ---------- MOBILE SHEET ---------- */
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const popoverRef = useRef<HTMLDivElement | null>(null);
  const today = new Date().toISOString().split('T')[0];

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

  const handleMobileBooking = (data: { checkIn: string; checkOut: string; guests: number }) => {
    setSearch(data);
    router.push('/apartments');
  };

  const apartmentPrice = currentApartment
    ? APARTMENTS.find(a => a.id === currentApartment.id)?.priceBase || 8000
    : 0;

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
          <div className="burger-icon">
            <span />
            <span />
            <span />
          </div>
          <span className="burger-text">Меню</span>
        </button>

        {mode === 'hero' && (
          <>
            {!isMobile ? (
              <div className="header__booking-wrapper">
                <div className="header__booking-fields">
                  <div
                    className="booking-field calendar-trigger"
                    onClick={() => setCalendarOpen(true)}
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
                    onClick={() => setCalendarOpen(true)}
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
                  {calendarOpen && mode === 'hero' && (
                    <div ref={popoverRef} className="header__calendar-popover hero-calendar">
                      <ApartmentAvailabilityCalendar
                        blockedDates={[]}
                        position="left"
                        onConfirm={(range) => {
                          // Используем date-fns format для правильного форматирования без часовых поясов
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

        {mode === 'apartment' && currentApartment && (
          <div className="header__booking-wrapper is-apartment">
            <div className="header__booking-action" style={{ position: 'relative' }}>
              <button
                className="header__booking with-apartment"
                onClick={() => setCalendarOpen(prev => !prev)}
              >
                <span className="header__booking-label">Проверить доступность</span>
                <span className="header__booking-apartment">{currentApartment.title}</span>
              </button>

              <AnimatePresence>
                {calendarOpen && mode === 'apartment' && (
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
                      showPrice
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

      {mobileSheetOpen && (
        <MobileBookingSheet
          isOpen={mobileSheetOpen}
          onClose={() => setMobileSheetOpen(false)}
          onConfirm={handleMobileBooking}
          initialGuests={guests}
          today={today}
        />
      )}

      {bookingModalOpen && currentApartment && selectedRange && (
        <BookingModal
          apartment={currentApartment}
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