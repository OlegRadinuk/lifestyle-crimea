'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHeader } from './HeaderContext';
import { useApartment } from '@/components/ApartmentContext';
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
  const { currentDBApartment } = useApartment();
  const { blockedDates } = useAvailability(apartmentId);

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DateRange>(null);
  const [calculatedTotal, setCalculatedTotal] = useState<number | undefined>(undefined);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Если есть параметры поиска из URL - показываем кнопку "Забронировать"
  const hasPreselectedDates = searchParams !== null;

  // Функция для немедленного бронирования (с предзаполненными датами)
  const handleDirectBooking = () => {
    if (searchParams) {
      const from = new Date(searchParams.checkIn);
      const to = new Date(searchParams.checkOut);

      // Считаем цену с учётом сезонов и hot deal
      const seasons = currentDBApartment?.seasons || [];
      const hotDeal = currentDBApartment?.hotDeal;
      const toLocalDateStr = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      let total = 0;
      const cur = new Date(from);
      while (cur < to) {
        const dateStr = toLocalDateStr(cur);
        let price = apartmentPrice;
        if (seasons.length > 0) {
          const season = seasons.find(s => dateStr >= s.date_from && dateStr <= s.date_to);
          if (season) price = season.price_per_night;
        }
        if (hotDeal?.enabled && hotDeal.discount > 0) {
          const inRange = !hotDeal.date_from || !hotDeal.date_to ||
            (dateStr >= hotDeal.date_from && dateStr <= hotDeal.date_to);
          if (inRange) price = Math.round(price * (1 - hotDeal.discount / 100));
        }
        total += price;
        cur.setDate(cur.getDate() + 1);
      }

      setSelectedRange({ from, to });
      setCalculatedTotal(total > 0 ? total : undefined);
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
      <div className="header__booking-wrapper is-apartment" style={{ flex: '1 1 0', minWidth: 0, overflow: 'visible' }}>
        <div className="header__booking-action" style={{ position: 'relative', width: '100%', overflow: 'visible' }}>
          {hasPreselectedDates ? (
            // Кнопка "Забронировать" - открывает модалку с предзаполненными датами
            <button
              className="header__booking with-apartment"
              onClick={handleDirectBooking}
              disabled={loadingPrice}
            >
              <span className="header__booking-label">Забронировать</span>
              <span className="header__booking-apartment">
                {apartmentTitle.replace(/^LS[\s-]*/i, '')}
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
                {apartmentTitle.replace(/^LS[\s-]*/i, '')}
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
                    setCalculatedTotal(range.calculatedTotal);
                    setCalendarOpen(false);
                    setBookingModalOpen(true);
                  }}
                  onClose={() => setCalendarOpen(false)}
                  showPrice={true}
                  apartmentPrice={apartmentPrice}
                  seasons={currentDBApartment?.seasons}
                  hotDeal={currentDBApartment?.hotDeal}
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
          priceOverride={calculatedTotal}
          initialRange={selectedRange}
          initialGuests={searchParams?.guests || 2}
          onClose={() => setBookingModalOpen(false)}
          onConfirm={() => {
            setBookingModalOpen(false);
          }}
        />
      )}
    </>
  );
}
