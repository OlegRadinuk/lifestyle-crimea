'use client';

import { useEffect } from 'react';
import { useHeader } from '@/components/HeaderContext';

/**
 * Тёмный текст хедера на светлом фоне страницы — как на /services и /concept.
 */
export default function PuHeaderMode() {
  const { register, unregister } = useHeader();

  useEffect(() => {
    register('professorskiy-ugolok-page', { mode: 'dark', priority: 20 });
    return () => unregister('professorskiy-ugolok-page');
  }, [register, unregister]);

  return null;
}
