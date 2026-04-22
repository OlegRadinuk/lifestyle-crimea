'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import Hero from '@/components/Hero';
import PanoramaViewer from '@/components/PanoramaViewer';
import Reviews from '@/components/reviews';
import { LoadingScreen } from '@/components/LoadingScreen';

function resetHomeScroll() {
  window.scrollTo(0, 0);
  const main = document.querySelector('.main-container');
  if (main instanceof HTMLElement) main.scrollTop = 0;
}

export default function HomePage() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mountKey, setMountKey] = useState(() => Date.now());

  const mainContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      node.scrollTop = 0;
      window.scrollTo(0, 0);
    }
  }, []);

  // Если пользователь ушёл на /apartments/[id] и потом вернулся на '/',
  // иногда часть DOM/состояния может сохраняться (особенно на мобилках и в bfcache).
  // Поэтому жёстко пересоздаём сцены через mountKey при переходе обратно на '/'.
  const prevPathRef = useRef<string | null>(null);
  useEffect(() => {
    const prev = prevPathRef.current;
    prevPathRef.current = pathname;

    if (pathname === '/' && prev && prev !== '/') {
      setMountKey(Date.now());
      const main = document.querySelector('.main-container');
      if (main instanceof HTMLElement) {
        main.scrollTop = 0;
      }
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) resetHomeScroll();
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  // Только при возврате во вкладку — новый ключ, без двойного mount при каждом заходе на /
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setMountKey(Date.now());
        resetHomeScroll();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return (
    <>
      
      <AnimatePresence mode="wait">
        {isLoading && <LoadingScreen />}
      </AnimatePresence>

      <div 
        ref={mainContainerRef}
        className={`main-container ${isMobile ? 'mobile' : 'desktop'}`}
      >
        {/* Сцена 1 - Hero */}
        <section className="scene scene--hero">
          <Hero key={`hero-${mountKey}`} />
        </section>

        {/* Спейсер между Hero и Panorama (только на десктопе) */}
        {!isMobile && <div className="scene-spacer" />}

        {/* Сцена 2 - Panorama */}
        <section className="scene scene--panorama">
          <PanoramaViewer key={`panorama-${mountKey}`} />
        </section>

        {/* Спейсер между Panorama и Reviews (только на десктопе) */}
        {!isMobile && <div className="scene-spacer" />}

        {/* Сцена 3 - Отзывы + Футер */}
        <section className="scene scene--reviews-footer">
          <Reviews key={`reviews-${mountKey}`} />
        </section>
      </div>
    </>
  );
}