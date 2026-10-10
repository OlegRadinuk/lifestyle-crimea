'use client';

import { useEffect } from 'react';
import { useHeader } from '@/components/HeaderContext';

/**
 * Регистрирует режим шапки для страницы /gde-poest.
 *
 * mode: 'dark' — даёт БЕЛЫЙ текст бургера (#e5e7eb) и небольшой тёмный
 * backdrop за логотипом. Это то, что нужно: hero тёмный (фото), шапка
 * должна читаться белым поверх фото. Не путать с «тёмным текстом на
 * светлом фоне» — это именно «белый текст поверх тёмного hero».
 *
 * Hero на 100svh: контент прижат к низу, H1 не попадает под фиксированную
 * шапку — баг первой версии закрыт структурой, а не padding-top.
 */
export default function GdePoestHeaderMode() {
  const { register, unregister } = useHeader();

  useEffect(() => {
    register('gde-poest-page', {
      mode: 'dark',
      priority: 20,
    });

    return () => unregister('gde-poest-page');
  }, [register, unregister]);

  return null;
}
