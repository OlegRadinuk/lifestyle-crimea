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

type Season = {
  id: string;
  name: string;
  date_from: string;  // "YYYY-MM-DD"
  date_to: string;
  price_per_night: number;
};

type HotDeal = {
  enabled: boolean;
  discount: number;
  date_from: string | null;
  date_to: string | null;
};

type Props = {
  blockedDates: BlockedDate[];
  onConfirm: (range: { from: Date; to: Date }) => void;
  onClose?: () => void;
  position?: 'left' | 'right';
  showPrice?: boolean;
  apartmentPrice?: number;
  seasons?: Season[];
  hotDeal?: HotDeal;
  customClass?: string;
};

export default function ApartmentAvailabilityCalendar({
  blockedDates,
  onConfirm,
  onClose,
  position = 'right',
  showPrice = false,
  apartmentPrice = 0,
  seasons,
  hotDeal,
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
      // Добавляем T00:00:00Z чтобы парсинг YYYY-MM-DD шёл через UTC,
      // иначе в локальных TZ +3..+12 дата сдвигается на -1 день
      const start = new Date(blocked.start.includes('T') ? blocked.start : blocked.start + 'T00:00:00Z');
      const end = new Date(blocked.end.includes('T') ? blocked.end : blocked.end + 'T00:00:00Z');

      let current = new Date(start);
      while (current < end) {
        disabled.push(new Date(current));
        current = addDays(current, 1);
      }
    });

    return disabled;
  }, [blockedDates, today]);

  // Цена за одну ночь с учётом сезона и hot deal
  const getPriceForDate = (dateStr: string): number => {
    let price = apartmentPrice;
    if (seasons && seasons.length > 0) {
      const season = seasons.find(s => dateStr >= s.date_from && dateStr <= s.date_to);
      if (season) price = season.price_per_night;
    }
    if (hotDeal?.enabled && hotDeal.discount > 0) {
      const inRange = !hotDeal.date_from || !hotDeal.date_to ||
        (dateStr >= hotDeal.date_from && dateStr <= hotDeal.date_to);
      if (inRange) price = Math.round(price * (1 - hotDeal.discount / 100));
    }
    return price;
  };

  // Итоговая цена за период
  const calcRangePrice = (from: Date, to: Date): { total: number; hasVariation: boolean; hasHotDeal: boolean } => {
    let total = 0;
    let hasVariation = false;
    let hasHotDeal = false;
    let prevPrice: number | null = null;
    const cur = new Date(from);
    while (cur < to) {
      const dateStr = cur.toISOString().split('T')[0];
      const price = getPriceForDate(dateStr);
      total += price;
      if (prevPrice !== null && price !== prevPrice) hasVariation = true;
      if (hotDeal?.enabled) {
        const inRange = !hotDeal.date_from || !hotDeal.date_to ||
          (dateStr >= hotDeal.date_from && dateStr <= hotDeal.date_to);
        if (inRange) hasHotDeal = true;
      }
      prevPrice = price;
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    return { total, hasVariation, hasHotDeal };
  };

  // Дни hot deal для подсветки в календаре
  const hotDealDays = useMemo(() => {
    if (!hotDeal?.enabled || !hotDeal.date_from || !hotDeal.date_to) return [];
    const days: Date[] = [];
    const cur = new Date(hotDeal.date_from + 'T00:00:00Z');
    const end = new Date(hotDeal.date_to + 'T00:00:00Z');
    while (cur <= end) {
      days.push(new Date(cur));
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    return days;
  }, [hotDeal]);

  const nights = range?.from && range?.to
    ? differenceInCalendarDays(range.to, range.from)
    : 0;

  const isValidRange = nights >= 1;

  // Считаем итоговую цену с учётом сезонов и hot deal
  const priceInfo = useMemo(() => {
    if (!range?.from || !range?.to || nights < 1) return null;
    const hasSeasonOrDeal = (seasons && seasons.length > 0) || hotDeal?.enabled;
    if (!hasSeasonOrDeal) {
      return {
        total: apartmentPrice * nights,
        hasVariation: false,
        hasHotDeal: false,
      };
    }
    return calcRangePrice(range.from, range.to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, nights, apartmentPrice, seasons, hotDeal]);

  const handleConfirm = () => {
    if (range?.from && range?.to && isValidRange) {
      onConfirm({ from: range.from, to: range.to });
      if (onClose) onClose();
    }
  };

  const modifiers = {
    weekend: (date: Date) => isWeekend(date),
    hot_deal: hotDealDays,
  };

  const modifiersClassNames = {
    weekend: 'rdp-day_weekend',
    selected: 'rdp-day_selected',
    range_start: 'rdp-day_range_start',
    range_end: 'rdp-day_range_end',
    range_middle: 'rdp-day_range_middle',
    disabled: 'rdp-day_disabled',
    outside: 'rdp-day_outside',
    hot_deal: 'rdp-day_hot_deal',
  };

  // Блок с ценой — переиспользуем в обеих версиях
  const priceBlock = showPrice && apartmentPrice > 0 && range?.from && range?.to ? (
    <div className="calendar-info">
      <span>
        {nights} {nights === 1 ? 'ночь' : nights < 5 ? 'ночи' : 'ночей'}
      </span>
      {priceInfo && (
        <span className={`calendar-total-price${priceInfo.hasHotDeal ? ' is-hot-deal' : ''}`}>
          • {priceInfo.hasHotDeal ? '🔥 ' : ''}{priceInfo.total.toLocaleString()} ₽
          {priceInfo.hasVariation && (
            <span className="calendar-price-note"> (сезонная цена)</span>
          )}
        </span>
      )}
    </div>
  ) : range?.from && range?.to ? (
    <div className="calendar-info">
      <span>
        {nights} {nights === 1 ? 'ночь' : nights < 5 ? 'ночи' : 'ночей'}
      </span>
    </div>
  ) : null;

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
            showOutsideDays={true}
          />

          {priceBlock}

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
          showOutsideDays={true}
        />

        {priceBlock}

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
