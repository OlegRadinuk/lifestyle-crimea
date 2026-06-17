'use client';

import { useEffect } from 'react';
import { useHeader } from '@/components/HeaderContext';

export default function NewsHeaderMode() {
  const { register, unregister } = useHeader();

  useEffect(() => {
    register('news-page', {
      mode: 'dark',
      priority: 20,
    });

    return () => unregister('news-page');
  }, [register, unregister]);

  return null;
}
