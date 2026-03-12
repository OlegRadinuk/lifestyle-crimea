'use client';

import { useEffect, useState, useRef } from 'react';
import { useMotionValueEvent, useScroll, motion } from 'framer-motion';
import Hero from '@/components/Hero';
import PanoramaViewer from '@/components/PanoramaViewer';
import Reviews from '@/components/reviews';
import Footer from '@/components/Footer';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Прогресс скролла
  const { scrollYProgress } = useScroll({
    container: containerRef
  });

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

  // Эффекты наплыва для каждой сцены
  useEffect(() => {
    const unsubscribe = scrollYProgress.onChange((latest) => {
      // Здесь будем управлять затемнением и трансформациями
      console.log('Scroll progress:', latest);
    });
    
    return () => unsubscribe();
  }, [scrollYProgress]);

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

        {/* Сцена 3 - Reviews */}
        <section className="scene scene--reviews">
          <Reviews />
        </section>

        {/* Сцена 4 - Footer (отдельно на мобилке, вместе с reviews на десктопе) */}
        {isMobile ? (
          <section className="scene scene--footer">
            <Footer />
          </section>
        ) : (
          // На десктопе футер уже внутри reviews, но нужно убедиться что он виден
          null
        )}
      </div>
    </>
  );
}