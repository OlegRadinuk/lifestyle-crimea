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

  const fetchAvailability = useCallback(async () => {
    if (!apartmentId) {
      setBlockedDates([]);
      return;
    }

    console.log(`🔄 Хук: Запрашиваем доступность для ${apartmentId}...`);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/availability/${apartmentId}?t=${Date.now()}`, {
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
      
      if (isMounted.current) {
        console.log(`✅ Хук: Получено ${data.blockedDates?.length || 0} заблокированных дат`);
        setBlockedDates(data.blockedDates || []);
        setLastUpdated(new Date());
      }
    } catch (err) {
      if (isMounted.current) {
        console.error('❌ Хук: Ошибка загрузки:', err);
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [apartmentId]);

  useEffect(() => {
    isMounted.current = true;
    fetchAvailability();
    
    return () => {
      isMounted.current = false;
    };
  }, [fetchAvailability]);

  useEffect(() => {
    const handleBookingCompleted = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('🎯 Хук: Получено событие booking-completed:', customEvent.detail);
      
      if (customEvent.detail?.apartmentId && customEvent.detail.apartmentId !== apartmentId) {
        console.log('⏭️ Хук: Событие для другого апартамента, пропускаем');
        return;
      }
      
      fetchAvailability();
    };

    window.addEventListener('booking-completed', handleBookingCompleted);
    
    return () => {
      window.removeEventListener('booking-completed', handleBookingCompleted);
    };
  }, [apartmentId, fetchAvailability]);

  const isDateAvailable = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return !blockedDates.some(blocked => 
      dateStr >= blocked.start && dateStr < blocked.end
    );
  };

  const isRangeAvailable = (from: Date, to: Date): boolean => {
    let current = new Date(from);
    while (current < to) {
      if (!isDateAvailable(current)) return false;
      current = addDays(current, 1);
    }
    return true;
  };

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

  return {
    blockedDates,
    loading,
    error,
    lastUpdated,
    isDateAvailable,
    isRangeAvailable,
    getDisabledDays,
    refetch: fetchAvailability,
  };
}