'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion'; // 👈 добавили импорт
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

// Функция форматирования даты для отображения
function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
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

  // Хук доступности для текущего апартамента (если есть)
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

  /* ---------- DETECT MOBILE ---------- */
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  /* ---------- SCROLL ---------- */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ---------- CLOSE CALENDAR ---------- */
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

  /* ---------- HERO SEARCH ---------- */
  const handleHeroSearch = () => {
    if (!checkIn || !checkOut) {
      setFormError('Пожалуйста, выберите даты заезда и выезда');
      return;
    }

    setFormError('');

    setSearch({
      checkIn,
      checkOut,
      guests,
    });

    router.push('/apartments');
  };

  /* ---------- MOBILE BOOKING ---------- */
  const handleMobileBooking = (data: { checkIn: string; checkOut: string; guests: number }) => {
    setSearch(data);
    router.push('/apartments');
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
        {/* BURGER - всегда одинаковый */}
        <button className="header__burger" onClick={onBurgerClick}>
          <div className="burger-icon">
            <span />
            <span />
            <span />
          </div>
          <span className="burger-text">Меню</span>
        </button>

        {/* ===== HERO MODE ===== */}
        {mode === 'hero' && (
          <>
            {!isMobile ? (
              /* DESKTOP VERSION - с календарём */
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
                      value={checkIn ? formatDate(checkIn) : ''}
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
                      value={checkOut ? formatDate(checkOut) : ''}
                      readOnly
                    />
                  </div>

                  <div className="booking-field">
                    <label>Гости</label>
                    <select
                      value={guests}
                      onChange={e => setGuests(+e.target.value)}
                    >
                      {[1, 2, 3, 4, 5, 6].map(n => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? 'гость' : 'гостей'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="header__booking-action">
                  <button
                    className="header__booking"
                    onClick={handleHeroSearch}
                  >
                    Выбрать апартаменты
                  </button>

                  {formError && (
                    <div className="header__booking-error">
                      {formError}
                    </div>
                  )}
                </div>

                {/* Календарь для Hero режима */}
                <AnimatePresence>
                  {calendarOpen && (
                    <div ref={popoverRef}>
                      <ApartmentAvailabilityCalendar
                        blockedDates={[]} // в Hero режиме нет занятых дат
                        onConfirm={(range) => {
                          setCheckIn(range.from.toISOString().split('T')[0]);
                          setCheckOut(range.to.toISOString().split('T')[0]);
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
              /* MOBILE VERSION - одна кнопка */
              <button 
                className="header__mobile-book-btn"
                onClick={() => setMobileSheetOpen(true)}
              >
                Забронировать
              </button>
            )}
          </>
        )}

        {/* ===== APARTMENT MODE ===== */}
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
  {calendarOpen && (
    <div
      ref={popoverRef}
      className="header__calendar-popover"
    >
      <ApartmentAvailabilityCalendar
        key={`calendar-${currentApartment.id}-${blockedDates.length}`}
        blockedDates={blockedDates}
        onConfirm={(range) => {
          console.log('📅 Выбран диапазон:', range);
          setSelectedRange(range);
          setCalendarOpen(false);
          setBookingModalOpen(true);
        }}
        onClose={() => setCalendarOpen(false)}
        showPrice={true}
        apartmentPrice={APARTMENTS.find(a => a.id === currentApartment.id)?.priceBase || 8000}
      />
    </div>
  )}
</AnimatePresence>
            </div>
          </div>
        )}

        {/* ===== DARK MODE - просто пустой div для баланса (опционально) ===== */}
        {mode === 'dark' && (
          <div className="header__dark-placeholder" />
        )}
      </header>

      {/* MOBILE BOOKING SHEET */}
      {mobileSheetOpen && (
        <MobileBookingSheet
          isOpen={mobileSheetOpen}
          onClose={() => setMobileSheetOpen(false)}
          onConfirm={handleMobileBooking}
          initialGuests={guests}
          today={today}
        />
      )}

      {/* BOOKING MODAL */}
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