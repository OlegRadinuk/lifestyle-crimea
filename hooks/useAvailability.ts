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
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const apartmentIdRef = useRef(apartmentId);

  // Обновляем ref при изменении apartmentId
  useEffect(() => {
    apartmentIdRef.current = apartmentId;
  }, [apartmentId]);

  const fetchAvailability = useCallback(async (force = false) => {
    const currentApartmentId = apartmentIdRef.current;
    
    if (!currentApartmentId) {
      setBlockedDates([]);
      return;
    }

    // Если уже загружаем и это не принудительно — пропускаем
    if (loading && !force) return;

    console.log(`🔄 Хук: Запрашиваем доступность для ${currentApartmentId}...`);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/availability/${currentApartmentId}?t=${Date.now()}`, {
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
      
      if (isMounted.current && apartmentIdRef.current === currentApartmentId) {
        console.log(`✅ Хук: Получено ${data.blockedDates?.length || 0} заблокированных дат для ${currentApartmentId}`);
        setBlockedDates(data.blockedDates || []);
        setLastUpdated(new Date());
      }
    } catch (err) {
      if (isMounted.current && apartmentIdRef.current === currentApartmentId) {
        console.error('❌ Хук: Ошибка загрузки:', err);
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      }
    } finally {
      if (isMounted.current && apartmentIdRef.current === currentApartmentId) {
        setLoading(false);
      }
    }
  }, [loading]); // 👈 ТЕПЕРЬ ТОЛЬКО loading

  // Первичная загрузка
  useEffect(() => {
    isMounted.current = true;
    fetchAvailability(true);
    
    return () => {
      isMounted.current = false;
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [fetchAvailability, apartmentId]); // 👈 добавили apartmentId

  // Слушаем событие бронирования
  useEffect(() => {
    const handleBookingCompleted = (event: Event) => {
      const customEvent = event as CustomEvent;
      const detail = customEvent.detail || {};
      
      console.log('🎯 Хук: Получено событие booking-completed:', detail);
      
      // Если событие для конкретного апартамента и он не наш — пропускаем
      if (detail.apartmentId && detail.apartmentId !== apartmentIdRef.current) {
        console.log(`⏭️ Хук: Событие для другого апартамента (${detail.apartmentId}), пропускаем`);
        return;
      }
      
      // Немедленно обновляем данные
      fetchAvailability(true);
    };

    window.addEventListener('booking-completed', handleBookingCompleted);
    
    return () => {
      window.removeEventListener('booking-completed', handleBookingCompleted);
    };
  }, [fetchAvailability]); // 👈 ТОЛЬКО fetchAvailability, БЕЗ apartmentId

  // Дополнительная защита: перезапрашиваем при возвращении на страницу
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Хук: Страница стала видимой, обновляем данные');
        fetchAvailability(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchAvailability]);

  // Проверка доступности даты
  const isDateAvailable = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return !blockedDates.some(blocked => 
      dateStr >= blocked.start && dateStr < blocked.end
    );
  };

  // Проверка доступности диапазона
  const isRangeAvailable = (from: Date, to: Date): boolean => {
    let current = new Date(from);
    while (current < to) {
      if (!isDateAvailable(current)) return false;
      current = addDays(current, 1);
    }
    return true;
  };

  // Получить массив недоступных дат для календаря
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
    refetch: () => fetchAvailability(true),
  };
}