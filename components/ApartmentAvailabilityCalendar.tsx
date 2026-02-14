'use client';

import { DayPicker, DateRange } from 'react-day-picker';
import { ru } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';
import { useMemo, useState } from 'react';
import { startOfToday, differenceInCalendarDays } from 'date-fns';

type Props = {
  availability: { date: string; available: boolean }[];
  onConfirm: (range: { from: Date; to: Date }) => void;
};

export default function ApartmentAvailabilityCalendar({
  availability,
  onConfirm,
}: Props) {
  const [range, setRange] = useState<DateRange | undefined>();
  const today = startOfToday();

  const disabledDays = useMemo(() => {
    const unavailableDates = availability
      .filter(d => !d.available)
      .map(d => new Date(d.date));

    return [{ before: today }, ...unavailableDates];
  }, [availability, today]);

  const nights =
    range?.from && range?.to
      ? differenceInCalendarDays(range.to, range.from)
      : 0;

  const isValidRange = nights >= 1;

  return (
    <div className="availability-calendar">
      <DayPicker
        locale={ru}
        mode="range"
        selected={range}
        onSelect={setRange}
        disabled={disabledDays}
        weekStartsOn={1}
        modifiersClassNames={{
          selected: 'rdp-day_selected',
          range_start: 'rdp-day_range_start',
          range_end: 'rdp-day_range_end',
          range_middle: 'rdp-day_range_middle',
          disabled: 'rdp-day_disabled',
        }}
      />

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
