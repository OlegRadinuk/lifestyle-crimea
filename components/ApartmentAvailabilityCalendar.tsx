'use client';

import { DayPicker, DateRange } from 'react-day-picker';
import { ru } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';
import { useMemo, useState, useEffect } from 'react';
import { 
  startOfToday, 
  differenceInCalendarDays, 
  addDays, 
  isWeekend,
  format 
} from 'date-fns';
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
  showPrice?: boolean; // для Hero режима цена не показывается
  apartmentPrice?: number; // цена за ночь (для Apartment режима)
};

// Предустановленные диапазоны
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
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const today = startOfToday();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Формируем недоступные даты
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

  // Кастомный компонент для дня с ценой
  const DayComponent = (props: any) => {
    const { day, modifiers, ...rest } = props;
    const date = day.date;
    const isWeekendDay = isWeekend(date);
    const isHovered = hoveredDate && format(hoveredDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    const isSelected = range?.from && range?.to && date >= range.from && date < range.to;
    
    let dayClassName = 'rdp-day';
    if (modifiers.selected) dayClassName += ' rdp-day_selected';
    if (modifiers.range_start) dayClassName += ' rdp-day_range_start';
    if (modifiers.range_end) dayClassName += ' rdp-day_range_end';
    if (modifiers.range_middle) dayClassName += ' rdp-day_range_middle';
    if (modifiers.disabled) dayClassName += ' rdp-day_disabled';
    if (isWeekendDay && !modifiers.disabled) dayClassName += ' rdp-day_weekend';
    if (isHovered && !modifiers.disabled) dayClassName += ' rdp-day_hovered';

    return (
      <div
        {...rest}
        className={dayClassName}
        onMouseEnter={() => setHoveredDate(date)}
        onMouseLeave={() => setHoveredDate(null)}
      >
        <span>{format(date, 'd')}</span>
        {showPrice && apartmentPrice > 0 && !modifiers.disabled && isHovered && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="price-tooltip"
          >
            {apartmentPrice.toLocaleString()} ₽
          </motion.div>
        )}
      </div>
    );
  };

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

        {/* Быстрые диапазоны (только на десктопе) */}
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
          key={`calendar-${blockedDates.length}`}
          locale={ru}
          mode="range"
          selected={range}
          onSelect={setRange}
          disabled={disabledDays}
          weekStartsOn={1}
          numberOfMonths={isMobile ? 1 : 1}
          components={{
            Day: DayComponent,
          }}
          modifiersClassNames={{
            selected: 'rdp-day_selected',
            range_start: 'rdp-day_range_start',
            range_end: 'rdp-day_range_end',
            range_middle: 'rdp-day_range_middle',
            disabled: 'rdp-day_disabled',
          }}
        />

        {range?.from && range?.to && (
          <div className="calendar-info">
            {nights} {nights === 1 ? 'ночь' : nights < 5 ? 'ночи' : 'ночей'}
            {showPrice && apartmentPrice > 0 && (
              <span className="calendar-total-price">
                • {apartmentPrice * nights} ₽
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