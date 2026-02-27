'use client';

import { DayPicker, DateRange } from 'react-day-picker';
import { ru } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';
import { useMemo, useState, useEffect } from 'react';
import { startOfToday, differenceInCalendarDays, addDays } from 'date-fns';

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
  const [range, setRange] = useState<DateRange | undefined>();
  const [isMobile, setIsMobile] = useState(false);
  
  const today = startOfToday();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Формируем массив недоступных дат для DayPicker
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

  return (
    <div className={`availability-calendar ${isMobile ? 'mobile' : ''}`}>
      {isMobile && (
        <div className="calendar-header">
          <h3>Выберите даты</h3>
          <button className="calendar-close" onClick={onClose}>✕</button>
        </div>
      )}

      <DayPicker
        locale={ru}
        mode="range"
        selected={range}
        onSelect={setRange}
        disabled={disabledDays}
        weekStartsOn={1}
        numberOfMonths={1} // 👈 ТОЛЬКО ОДИН МЕСЯЦ
        pagedNavigation
        showOutsideDays
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
          <span>Проживание: {nights} {nights === 1 ? 'ночь' : nights <= 4 ? 'ночи' : 'ночей'}</span>
        </div>
      )}

      <button
        className="calendar-confirm"
        disabled={!isValidRange}
        onClick={() => {
          if (!range?.from || !range?.to || !isValidRange) return;
          onConfirm({ from: range.from, to: range.to });
        }}
      >
        Забронировать
      </button>
    </div>
  );
}