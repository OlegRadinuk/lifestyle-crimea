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
  const [error, setError] = useState<string | null>(null);

  const fetchAvailability = useCallback(async () => {
    if (!apartmentId) {
      setBlockedDates([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/availability/${apartmentId}`);
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки доступности');
      }

      const data = await response.json();
      setBlockedDates(data.blockedDates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  }, [apartmentId]);

  // Первичная загрузка
  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // Слушаем событие бронирования для обновления
  useEffect(() => {
    const handleBookingCompleted = () => {
      fetchAvailability();
    };

    window.addEventListener('booking-completed', handleBookingCompleted);
    return () => window.removeEventListener('booking-completed', handleBookingCompleted);
  }, [fetchAvailability]);

  // Проверка, доступна ли конкретная дата
  const isDateAvailable = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return !blockedDates.some(blocked => dateStr >= blocked.start && dateStr < blocked.end);
  };

  // Проверка, доступен ли диапазон дат
  const isRangeAvailable = (from: Date, to: Date): boolean => {
    let current = new Date(from);
    while (current < to) {
      if (!isDateAvailable(current)) return false;
      current = addDays(current, 1);
    }
    return true;
  };

  // Получить все недоступные даты для календаря
  const getDisabledDays = () => {
    const disabled: ({ before: Date } | Date)[] = [{ before: new Date() }];
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
  };

  // Принудительное обновление
  const refetch = useCallback(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  return {
    blockedDates,
    loading,
    error,
    isDateAvailable,
    isRangeAvailable,
    getDisabledDays,
    refetch,
  };
}