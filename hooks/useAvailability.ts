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
  const fetchingRef = useRef(false); // 👈 защита от параллельных запросов

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

    // Если уже загружаем и это не принудительно — пропускаем
    if (fetchingRef.current && !force) {
      console.log(`⏭️ Хук: Запрос уже выполняется для ${currentId}, пропускаем`);
      return;
    }

    // Защита от слишком частых запросов
    const now = Date.now();
    if (lastUpdated && now - lastUpdated.getTime() < 5000 && !force) {
      console.log(`⏱️ Хук: Последний запрос был ${Math.round((now - lastUpdated.getTime())/1000)}с назад, пропускаем`);
      return;
    }

    console.log(`🔄 Хук: Запрашиваем доступность для ${currentId}...`);
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
        console.log(`✅ Хук: Получено ${data.blockedDates?.length || 0} заблокированных дат для ${currentId}`);
        setBlockedDates(data.blockedDates || []);
        setLastUpdated(new Date());
      }
    } catch (err) {
      if (isMounted.current && apartmentIdRef.current === currentId) {
        console.error('❌ Хук: Ошибка загрузки:', err);
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      }
    } finally {
      if (isMounted.current && apartmentIdRef.current === currentId) {
        setLoading(false);
      }
      fetchingRef.current = false;
    }
  }, [lastUpdated]); // 👈 ТОЛЬКО lastUpdated в зависимостях

  // Первичная загрузка
  useEffect(() => {
    isMounted.current = true;
    
    // Загружаем только при монтировании или изменении apartmentId
    fetchAvailability(true);
    
    return () => {
      isMounted.current = false;
    };
  }, [apartmentId]); // 👈 apartmentId в зависимостях, НО НЕ fetchAvailability

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
      
      // Обновляем данные
      fetchAvailability(true);
    };

    window.addEventListener('booking-completed', handleBookingCompleted);
    
    return () => {
      window.removeEventListener('booking-completed', handleBookingCompleted);
    };
  }, []); // 👈 ПУСТОЙ МАССИВ! Никаких зависимостей

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
  }, []); // 👈 ПУСТОЙ МАССИВ

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