'use client';

import { useEffect } from 'react';
import { useHeader } from '@/components/HeaderContext';

/**
 * Тёмный текст хедера на светлом фоне посадочной — как на /services и /concept.
 * id должен быть уникальным для страницы: по нему идёт unregister при уходе.
 */
export default function LandingHeaderMode({ id }: { id: string }) {
  const { register, unregister } = useHeader();

  useEffect(() => {
    register(id, { mode: 'dark', priority: 20 });
    return () => unregister(id);
  }, [register, unregister, id]);

  return null;
}
