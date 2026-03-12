'use client';

import { useEffect, useState, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import Hero from '@/components/Hero';
import PanoramaViewer from '@/components/PanoramaViewer';
import Reviews from '@/components/reviews';
import Footer from '@/components/Footer';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && <LoadingScreen />}
      </AnimatePresence>

      <div 
        ref={containerRef}
        className={`main-container ${isMobile ? 'mobile' : 'desktop'}`}
      >
        {/* Сцена 1 - Hero */}
        <section className="scene scene--hero">
          <Hero />
        </section>

        {/* Сцена 2 - Panorama */}
        <section className="scene scene--panorama">
          <PanoramaViewer />
        </section>

        {/* Сцена 3 - Отзывы */}
        <section className="scene scene--reviews">
          <Reviews />
        </section>

        {/* Сцена 4 - Футер (только на мобилке) */}
        {isMobile && (
          <section className="scene scene--footer">
            <Footer />
          </section>
        )}
      </div>
    </>
  );
}