'use client';

import { DayPicker, DateRange } from 'react-day-picker';
import { ru } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';
import { useMemo, useState, useEffect } from 'react';
import { startOfToday, differenceInCalendarDays } from 'date-fns';

type BlockedDate = {
  start: string;
  end: string;
  source: string;
};

type Props = {
  blockedDates: BlockedDate[];
  onConfirm: (range: { from: Date; to: Date }) => void;
  onClose?: () => void;
};

export default function ApartmentAvailabilityCalendar({
  blockedDates,
  onConfirm,
  onClose,
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

  const isValidRange = nights >= 1; // ❗ минимум одна ночь

  const handleConfirm = () => {
    if (range?.from && range?.to && isValidRange) {
      onConfirm({ from: range.from, to: range.to });
    }
  };

  return (
    <div className={`availability-calendar ${isMobile ? 'mobile' : ''}`}>
      {isMobile && (
        <div className="calendar-header">
          <h3>Выберите даты</h3>
          <button className="calendar-close" onClick={onClose}>✕</button>
        </div>
      )}

      <DayPicker
        key={`calendar-${blockedDates.length}`} // ❗ стабильный ключ
        locale={ru}
        mode="range"
        selected={range}
        onSelect={setRange}
        disabled={disabledDays}
        weekStartsOn={1}
        numberOfMonths={1}
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
        </div>
      )}

      <button
        className="calendar-confirm"
        disabled={!isValidRange}
        onClick={handleConfirm}
      >
        Забронировать
      </button>
    </div>
  );
}