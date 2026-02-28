'use client';

import { DayPicker, DateRange } from 'react-day-picker';
import { ru } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';
import { useMemo, useState, useEffect } from 'react';
import { startOfToday, differenceInCalendarDays, addDays, isWeekend } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

type BlockedDate = {
  start: string;
  end: string;
  source: string;
};

type Props = {
  blockedDates: BlockedDate[];
  onConfirm: (range: { from: Date; to: Date }) => void;
  onClose?: () => void;
  showPrice?: boolean;
  apartmentPrice?: number;
};

const QUICK_RANGES = [
  { label: 'Уикенд', days: 3 },
  { label: 'Неделя', days: 7 },
  { label: '14 дней', days: 14 },
];

export default function ApartmentAvailabilityCalendar({
  blockedDates,
  onConfirm,
  onClose,
  showPrice = false,
  apartmentPrice = 0,
}: Props) {
  const [range, setRange] = useState<DateRange>();
  const [isMobile, setIsMobile] = useState(false);
  const today = startOfToday();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const disabledDays = useMemo(() => {
    const disabled: ({ before: Date } | Date)[] = [{ before: today }];
    blockedDates.forEach(b => {
      const start = new Date(b.start);
      const end = new Date(b.end);
      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        disabled.push(new Date(d));
      }
    });
    return disabled;
  }, [blockedDates, today]);

  const nights = range?.from && range?.to
    ? differenceInCalendarDays(range.to, range.from)
    : 0;

  const isValidRange = nights >= 1;

  const handleConfirm = () => {
    if (range?.from && range?.to && isValidRange) {
      onConfirm({ from: range.from, to: range.to });
    }
  };

  const handleQuickRange = (days: number) => {
    const from = new Date();
    const to = addDays(from, days);
    setRange({ from, to });
  };

  const modifiers = {
    weekend: (date: Date) => isWeekend(date),
  };

  const modifiersClassNames = {
    weekend: 'rdp-day_weekend',
    selected: 'rdp-day_selected',
    range_start: 'rdp-day_range_start',
    range_end: 'rdp-day_range_end',
    range_middle: 'rdp-day_range_middle',
    disabled: 'rdp-day_disabled',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={`availability-calendar ${isMobile ? 'mobile' : ''}`}
      >
        {isMobile && (
          <div className="calendar-header">
            <h3>Выберите даты</h3>
            <button className="calendar-close" onClick={onClose}>✕</button>
          </div>
        )}

        {!isMobile && (
          <div className="quick-ranges">
            {QUICK_RANGES.map(({ label, days }) => (
              <button
                key={label}
                className="quick-range-btn"
                onClick={() => handleQuickRange(days)}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <DayPicker
          locale={ru}
          mode="range"
          selected={range}
          onSelect={setRange}
          disabled={disabledDays}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          weekStartsOn={1}
          numberOfMonths={1}
        />

        {range?.from && range?.to && (
          <div className="calendar-info">
            <span>
              {nights} {nights === 1 ? 'ночь' : nights < 5 ? 'ночи' : 'ночей'}
            </span>
            {showPrice && apartmentPrice > 0 && (
              <span className="calendar-total-price">
                • {(apartmentPrice * nights).toLocaleString()} ₽
              </span>
            )}
          </div>
        )}

        <button
          className="calendar-confirm"
          disabled={!isValidRange}
          onClick={handleConfirm}
        >
          Забронировать
        </button>
      </motion.div>
    </AnimatePresence>
  );
}