// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Hero from '@/components/Hero';
import PanoramaViewer from '@/components/PanoramaViewer';
import Reviews from '@/components/reviews';
import Footer from '@/components/Footer';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && <LoadingScreen />}
      </AnimatePresence>

      <main className="frame">
        {/* Сцена 1 - Hero */}
        <section className="layer layer--hero">
          <Hero />
        </section>

        <div className="layer-spacer" />

        {/* Сцена 2 - Panorama */}
        <section className="layer layer--apartments">
          <PanoramaViewer />
        </section>

        <div className="layer-spacer" />

        {/* Сцена 3 - Reviews + Footer вместе */}
        <section className="layer layer--reviews">
          <div className="reviews-footer-container">
            <Reviews />
            <Footer />
          </div>
        </section>
      </main>
    </>
  );
}