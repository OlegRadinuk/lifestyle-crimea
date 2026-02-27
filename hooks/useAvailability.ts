'use client';

import { useState, useEffect, useCallback } from 'react';
import { addDays } from 'date-fns';

type BlockedDate = {
  start: string;
  end: string;
  source: string;
};

export function useAvailability(apartmentId: string | null) {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAvailability = useCallback(async () => {
    if (!apartmentId) {
      setBlockedDates([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/availability/${apartmentId}`);
      const data = await res.json();
      setBlockedDates(data.blockedDates || []);
    } catch (e) {
      console.error('fetch error', e);
    } finally {
      setLoading(false);
    }
  }, [apartmentId]);

  // Первичная загрузка
  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // Слушаем глобальное событие обновления
  useEffect(() => {
    const onBooking = () => fetchAvailability();
    window.addEventListener('booking-completed', onBooking);
    return () => window.removeEventListener('booking-completed', onBooking);
  }, [fetchAvailability]);

  const isDateAvailable = (date: Date): boolean => {
    const d = date.toISOString().split('T')[0];
    return !blockedDates.some(b => d >= b.start && d < b.end);
  };

  const isRangeAvailable = (from: Date, to: Date): boolean => {
    let cur = new Date(from);
    while (cur < to) {
      if (!isDateAvailable(cur)) return false;
      cur = addDays(cur, 1);
    }
    return true;
  };

  const getDisabledDays = (): ({ before: Date } | Date)[] => {
    const disabled: ({ before: Date } | Date)[] = [{ before: new Date() }];
    blockedDates.forEach(b => {
      const start = new Date(b.start);
      const end = new Date(b.end);
      let cur = new Date(start);
      while (cur < end) {
        disabled.push(new Date(cur));
        cur = addDays(cur, 1);
      }
    });
    return disabled;
  };

  return {
    blockedDates,
    loading,
    isDateAvailable,
    isRangeAvailable,
    getDisabledDays,
    refetch: fetchAvailability,
  };
}