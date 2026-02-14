'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useApartment } from '@/components/ApartmentContext';
import { useSearch } from '@/components/SearchContext';
import { useHeader } from '@/components/HeaderContext';

import ApartmentAvailabilityCalendar from '@/components/ApartmentAvailabilityCalendar';
import BookingModal from '@/components/BookingModal';

type Props = {
  onBurgerClick: () => void;
};

// временно — потом API
const mockAvailability = [
  { date: '2026-02-10', available: true },
  { date: '2026-02-11', available: true },
  { date: '2026-02-12', available: false },
  { date: '2026-02-13', available: true },
  { date: '2026-02-14', available: true },
];

export default function Header({ onBurgerClick }: Props) {
  const router = useRouter();
  const { setSearch } = useSearch();
  const { mode } = useHeader();

  const {
    currentApartment,
  } = useApartment();

  const [scrolled, setScrolled] = useState(false);

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<any>(null);

  const popoverRef = useRef<HTMLDivElement | null>(null);

  /* ---------- HERO STATE ---------- */
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [formError, setFormError] = useState('');

  const today = new Date().toISOString().split('T')[0];

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
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setCalendarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () =>
      document.removeEventListener('mousedown', handleClickOutside);
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

  return (
    <>
      <header
        className={`
          header
          header--${mode}
          ${scrolled ? 'scrolled' : ''}
        `}
      >
        {/* BURGER */}
        <button
          className="header__burger"
          onClick={onBurgerClick}
        >
          <div className="burger-icon">
            <span />
            <span />
            <span />
          </div>
          <span className="burger-text">Меню</span>
        </button>

        {/* ===== HERO MODE ===== */}
        {mode === 'hero' && (
          <div className="header__booking-wrapper">
            <div className="header__booking-fields">
              <div className="booking-field">
                <label>Заезд</label>
                <input
                  type="date"
                  min={today}
                  value={checkIn}
                  onChange={e => {
                    setCheckIn(e.target.value);
                    setFormError('');
                  }}
                />
              </div>

              <div className="booking-field">
                <label>Выезд</label>
                <input
                  type="date"
                  min={checkIn || today}
                  value={checkOut}
                  onChange={e => {
                    setCheckOut(e.target.value);
                    setFormError('');
                  }}
                />
              </div>

              <div className="booking-field">
                <label>Гости</label>
                <select
                  value={guests}
                  onChange={e => setGuests(+e.target.value)}
                >
                  {[1,2,3,4,5,6].map(n => (
                    <option key={n} value={n}>{n}</option>
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
          </div>
        )}

        {/* ===== APARTMENT PAGE MODE ===== */}
        {mode === 'apartment' && currentApartment && (
  <div className="header__booking-wrapper is-apartment">
    <div
      className="header__booking-action"
      style={{ position: 'relative' }}
    >
      <button
        className="header__booking with-apartment"
        onClick={() => setCalendarOpen(prev => !prev)}
      >
        <span className="header__booking-label">
          Проверить доступность
        </span>

        <span className="header__booking-apartment">
          {currentApartment.title}
        </span>
      </button>

      {calendarOpen && (
        <div
          ref={popoverRef}
          className="header__calendar-popover"
        >
          <ApartmentAvailabilityCalendar
            availability={mockAvailability}
            onConfirm={(range) => {
              setSelectedRange(range);
              setCalendarOpen(false);
              setBookingModalOpen(true);
            }}
          />
        </div>
      )}
    </div>
  </div>
)}
      </header>

      {/* BOOKING MODAL */}
      {bookingModalOpen && currentApartment && (
        <BookingModal
          apartment={currentApartment}
          initialRange={selectedRange ?? null}
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
