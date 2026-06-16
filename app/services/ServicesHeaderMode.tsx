'use client';

import { useEffect } from 'react';
import { useHeader } from '@/components/HeaderContext';

/**
 * Регистрирует тёмный режим хедера (тёмный текст на светлом фоне страницы),
 * как это делают /apartments и /apartments/[id].
 */
export default function ServicesHeaderMode() {
  const { register, unregister } = useHeader();

  useEffect(() => {
    register('services-page', {
      mode: 'dark',
      priority: 20,
    });

    return () => unregister('services-page');
  }, [register, unregister]);

  return null;
}
