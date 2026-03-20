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
  position?: 'left' | 'right';
  showPrice?: boolean;
  apartmentPrice?: number;
  customClass?: string;
};

export default function ApartmentAvailabilityCalendar({
  blockedDates,
  onConfirm,
  onClose,
  position = 'right',
  showPrice = false,
  apartmentPrice = 0,
  customClass = '',
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
    
    blockedDates.forEach(blocked => {
      const start = new Date(blocked.start);
      const end = new Date(blocked.end);
      
      let current = new Date(start);
      while (current < end) {
        disabled.push(new Date(current));
        current = addDays(current, 1);
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
      if (onClose) onClose();
    }
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
    outside: 'rdp-day_outside', // Добавляем стиль для дней другого месяца
  };

  // Мобильная версия
  if (isMobile) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`availability-calendar mobile ${customClass}`}
        >
          <div className="calendar-header">
            <h3>Выберите даты</h3>
            <button className="calendar-close" onClick={onClose}>✕</button>
          </div>

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
            showOutsideDays={true} // ← ВКЛЮЧАЕМ ОТОБРАЖЕНИЕ ДНЕЙ ДРУГОГО МЕСЯЦА
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
            Выбрать
          </button>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Десктоп версия
  return (
    <AnimatePresence>
      <motion.div
        data-testid="availability-calendar"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={`availability-calendar ${customClass}`}
      >
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
          showOutsideDays={true} // ← ВКЛЮЧАЕМ ОТОБРАЖЕНИЕ ДНЕЙ ДРУГОГО МЕСЯЦА
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
          Выбрать
        </button>
      </motion.div>
    </AnimatePresence>
  );
}