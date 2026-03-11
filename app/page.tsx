'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useHeader } from '@/components/HeaderContext';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';

import Hero from '@/components/Hero';
import PanoramaViewer from '@/components/PanoramaViewer';
import Reviews from '@/components/reviews';
import Footer from '@/components/Footer';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  
  // Активируем плавный скролл
  useSmoothScroll();

  useEffect(() => {
    // Имитация загрузки или реальная загрузка ресурсов
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && <LoadingScreen />}
      </AnimatePresence>

      <main className="frame">
        <section className="layer layer--hero">
          <Hero />
        </section>

        <div className="layer-spacer" />

        <section className="layer layer--apartments">
          <PanoramaViewer />
        </section>

        <div className="layer-spacer" />

        <section className="layer layer--reviews">
          <Reviews />
          <Footer />
        </section>
      </main>
    </>
  );
}