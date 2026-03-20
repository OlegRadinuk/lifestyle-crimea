'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHeader } from './HeaderContext';
import ApartmentAvailabilityCalendar from './ApartmentAvailabilityCalendar';
import BookingModal from './BookingModal';
import { useAvailability } from '@/hooks/useAvailability';

type Props = {
  apartmentId: string;
  apartmentTitle: string;
  apartmentPrice: number;
  isActive: boolean;
  loadingPrice: boolean;
};

type DateRange = {
  from: Date;
  to: Date;
} | null;

export default function ApartmentHeaderButton({
  apartmentId,
  apartmentTitle,
  apartmentPrice,
  isActive,
  loadingPrice,
}: Props) {
  const { searchParams } = useHeader();
  const { blockedDates } = useAvailability(apartmentId);
  
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DateRange>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Если есть параметры поиска из URL - показываем кнопку "Забронировать"
  const hasPreselectedDates = searchParams !== null;

  // Функция для немедленного бронирования (с предзаполненными датами)
  const handleDirectBooking = () => {
    if (searchParams) {
      const from = new Date(searchParams.checkIn);
      const to = new Date(searchParams.checkOut);
      
      setSelectedRange({ from, to });
      setBookingModalOpen(true);
    }
  };

  // Функция для открытия календаря
  const handleOpenCalendar = () => {
    setCalendarOpen(prev => !prev);
  };

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

  if (!isActive) return null;

  return (
    <>
      <div className="header__booking-wrapper is-apartment">
        <div className="header__booking-action" style={{ position: 'relative' }}>
          {hasPreselectedDates ? (
            // Кнопка "Забронировать" - открывает модалку с предзаполненными датами
            <button
              className="header__booking with-apartment"
              onClick={handleDirectBooking}
              disabled={loadingPrice}
            >
              <span className="header__booking-label">Забронировать</span>
              <span className="header__booking-apartment">
                {apartmentTitle.replace(/^LS\s*/i, '')}
              </span>
            </button>
          ) : (
            // Кнопка "Проверить доступность" - открывает календарь
            <button
              className="header__booking with-apartment"
              onClick={handleOpenCalendar}
              disabled={loadingPrice}
            >
              <span className="header__booking-label">Проверить доступность</span>
              <span className="header__booking-apartment">
                {apartmentTitle.replace(/^LS\s*/i, '')}
              </span>
            </button>
          )}

          <AnimatePresence>
            {calendarOpen && !hasPreselectedDates && (
              <div ref={popoverRef} className="header__calendar-popover">
                <ApartmentAvailabilityCalendar
                  key={`calendar-${apartmentId}-${blockedDates.length}-${apartmentPrice}`}
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
                  customClass="calendar--apartment"
                />
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {bookingModalOpen && selectedRange && isActive && (
        <BookingModal
          apartment={{
            id: apartmentId,
            title: apartmentTitle,
            price_base: apartmentPrice,
          }}
          initialRange={selectedRange}
          initialGuests={searchParams?.guests || 2}
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