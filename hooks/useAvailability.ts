'use client';

import { useState, useEffect } from 'react';
import { isWithinInterval, addDays } from 'date-fns';

type BlockedDate = {
  start: string;
  end: string;
  source: string;
};

type AvailabilityResponse = {
  apartmentId: string;
  blockedDates: BlockedDate[];
};

export function useAvailability(apartmentId: string | null) {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загружаем занятые даты при изменении apartmentId
  useEffect(() => {
    if (!apartmentId) {
      setBlockedDates([]);
      return;
    }

    let mounted = true;

    const fetchAvailability = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/availability/${apartmentId}`);
        
        if (!response.ok) {
          throw new Error('Ошибка загрузки доступности');
        }

        const data: AvailabilityResponse = await response.json();
        
        if (mounted) {
          setBlockedDates(data.blockedDates || []);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchAvailability();

    return () => {
      mounted = false;
    };
  }, [apartmentId]);

  // Проверка, доступна ли конкретная дата
  const isDateAvailable = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];

    return !blockedDates.some(blocked => {
      const start = blocked.start;
      const end = blocked.end;
      return dateStr >= start && dateStr < end; // день выезда свободен
    });
  };

  // Проверка, доступен ли диапазон дат
  const isRangeAvailable = (from: Date, to: Date): boolean => {
    let current = new Date(from);
    
    while (current < to) {
      if (!isDateAvailable(current)) {
        return false;
      }
      current = addDays(current, 1);
    }
    
    return true;
  };

  // Получить все недоступные даты для календаря
  const getDisabledDays = () => {
    const disabled: Date[] = [];

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

  return {
    blockedDates,
    loading,
    error,
    isDateAvailable,
    isRangeAvailable,
    getDisabledDays,
  };
}