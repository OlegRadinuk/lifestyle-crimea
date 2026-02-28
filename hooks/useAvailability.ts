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
  const [version, setVersion] = useState(0); // 👈 добавили version для принудительного обновления
  
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
      console.log(`⏭️ Хук: Запрос уже выполняется для ${currentId}, пропускаем`);
      return;
    }

    // Защита от слишком частых запросов
    const now = Date.now();
    if (lastUpdated && now - lastUpdated.getTime() < 3000 && !force) {
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
        if (data.blockedDates) {
          data.blockedDates.forEach((b: BlockedDate) => {
            console.log(`   📅 ${b.start} – ${b.end} (${b.source})`);
          });
        }
        setBlockedDates(data.blockedDates || []);
        setLastUpdated(new Date());
        setVersion(v => v + 1); // 👈 увеличиваем версию при обновлении
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
  }, [lastUpdated]);

  // Первичная загрузка
  useEffect(() => {
    isMounted.current = true;
    fetchAvailability(true);
    
    return () => {
      isMounted.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [apartmentId]); // 👈 перезагружаем при смене apartmentId

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
      
      // Обновляем данные после небольшой задержки (ждём пока БД обновится)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        console.log('🔄 Хук: Обновляем данные после бронирования');
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
  }, []);

  // Проверка доступности даты (исправленная логика)
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
    
    // Добавляем все дни, КРОМЕ последнего (дня выезда)
    let current = new Date(start);
    while (current < end) {
      disabled.push(new Date(current));
      current = addDays(current, 1);
    }
  });
  
  return disabled;
};
}