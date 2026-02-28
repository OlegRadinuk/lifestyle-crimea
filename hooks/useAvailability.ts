'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const isMounted = useRef(true);
  const apartmentIdRef = useRef(apartmentId);
  const fetchingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Обновляем ref при изменении apartmentId
  useEffect(() => {
    apartmentIdRef.current = apartmentId;
  }, [apartmentId]);

  const fetchAvailability = useCallback(async (force = false) => {
    const currentId = apartmentIdRef.current;
    
    if (!currentId) {
      setBlockedDates([]);
      return;
    }

    // Защита от параллельных запросов
    if (fetchingRef.current && !force) {
      return;
    }

    // Защита от слишком частых запросов (не чаще раза в 3 секунды)
    const now = Date.now();
    if (lastUpdated && now - lastUpdated.getTime() < 3000 && !force) {
      return;
    }

    setLoading(true);
    setError(null);
    fetchingRef.current = true;

    try {
      const response = await fetch(`/api/availability/${currentId}?t=${now}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки доступности');
      }

      const data = await response.json();
      
      if (isMounted.current && apartmentIdRef.current === currentId) {
        setBlockedDates(data.blockedDates || []);
        setLastUpdated(new Date());
      }
    } catch (err) {
      if (isMounted.current && apartmentIdRef.current === currentId) {
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      }
    } finally {
      if (isMounted.current && apartmentIdRef.current === currentId) {
        setLoading(false);
      }
      fetchingRef.current = false;
    }
  }, [lastUpdated]);

  // Первичная загрузка при монтировании или смене apartmentId
  useEffect(() => {
    isMounted.current = true;
    fetchAvailability(true);
    
    return () => {
      isMounted.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [apartmentId]);

  // Слушаем событие бронирования
  useEffect(() => {
    const handleBookingCompleted = (event: Event) => {
      const customEvent = event as CustomEvent;
      const detail = customEvent.detail || {};
      
      // Если событие для конкретного апартамента и он не наш — пропускаем
      if (detail.apartmentId && detail.apartmentId !== apartmentIdRef.current) {
        return;
      }
      
      // Обновляем данные после небольшой задержки (ждём пока БД обновится)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        fetchAvailability(true);
      }, 500);
    };

    window.addEventListener('booking-completed', handleBookingCompleted);
    
    return () => {
      window.removeEventListener('booking-completed', handleBookingCompleted);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Обновляем данные при возвращении на страницу
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchAvailability(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Проверка доступности конкретной даты
  const isDateAvailable = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    // Дата считается занятой, только если она внутри [start, end)
    // end (день выезда) считается свободным
    return !blockedDates.some(blocked => 
      dateStr >= blocked.start && dateStr < blocked.end
    );
  };

  // Проверка доступности диапазона дат
  const isRangeAvailable = (from: Date, to: Date): boolean => {
    let current = new Date(from);
    while (current < to) {
      if (!isDateAvailable(current)) return false;
      current = addDays(current, 1);
    }
    return true;
  };

  // Получение массива недоступных дат для календаря (день выезда свободен)
  const getDisabledDays = () => {
    const disabled: ({ before: Date } | Date)[] = [{ before: new Date() }];
    
    blockedDates.forEach(blocked => {
      const start = new Date(blocked.start);
      const end = new Date(blocked.end);
      
      // Добавляем все дни, КРОМЕ последнего (дня выезда)
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
    fetchAvailability(true);
  }, [fetchAvailability]);

  return {
    blockedDates,
    loading,
    error,
    lastUpdated,
    isDateAvailable,
    isRangeAvailable,
    getDisabledDays,
    refetch,
  };
}