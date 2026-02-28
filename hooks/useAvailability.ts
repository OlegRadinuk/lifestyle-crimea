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

  useEffect(() => {
    apartmentIdRef.current = apartmentId;
  }, [apartmentId]);

  const fetchAvailability = useCallback(async (force = false) => {
  const currentId = apartmentIdRef.current;
  
  if (!currentId) {
    setBlockedDates([]);
    return;
  }

  if (fetchingRef.current && !force) {
    console.log('⏳ Уже загружаем, пропускаем');
    return;
  }

  // Защита от слишком частых запросов
  const now = Date.now();
  if (lastUpdated && now - lastUpdated.getTime() < 3000 && !force) {
    console.log('⏳ Слишком часто, пропускаем');
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
}, [lastUpdated]); // ← lastUpdated зависимость

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

  useEffect(() => {
  const handleBookingCompleted = (event: Event) => {
    const customEvent = event as CustomEvent;
    const detail = customEvent.detail || {};
    
    if (detail.apartmentId && detail.apartmentId !== apartmentIdRef.current) {
      return;
    }
    
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

  // КРИТИЧЕСКИ ВАЖНО: проверка что день выезда свободен
  const isDateAvailable = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    // Дата считается занятой, только если она внутри [start, end)
    // end (день выезда) считается свободным
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