'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Hero from '@/components/Hero';
import PanoramaViewer from '@/components/PanoramaViewer';
import Reviews from '@/components/reviews';
import Footer from '@/components/Footer';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // Проверяем мобильное устройство
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Симуляция загрузки
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Отслеживаем прогресс скролла
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Преобразуем прогресс в индекс секции (0, 1, 2)
  const sectionIndex = useTransform(scrollYProgress, 
    [0, 0.33, 0.34, 0.66, 0.67, 1], 
    [0, 0, 1, 1, 2, 2]
  );

  // Создаем отдельные значения для анимаций
  const heroOpacity = useTransform(sectionIndex, [0, 0.3], [1, 0]);
  const heroScale = useTransform(sectionIndex, [0, 0.3], [1, 0.95]);
  const heroBlur = useTransform(sectionIndex, [0, 0.3], ['blur(0px)', 'blur(4px)']);
  
  const panoramaOpacity = useTransform(sectionIndex, [0.2, 0.4, 0.6], [0, 1, 1]);
  const panoramaScale = useTransform(sectionIndex, [0.4, 0.6], [0.95, 1]);
  
  const reviewsOpacity = useTransform(sectionIndex, [0.6, 0.8, 1], [0, 1, 1]);

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && <LoadingScreen />}
      </AnimatePresence>

      <motion.main 
        ref={containerRef}
        className="frame"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 2.3, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Hero Section - всегда видна первой */}
        <section className="layer layer--hero">
          <Hero />
        </section>

        {/* Panorama Section - появляется при скролле */}
        <section className="layer layer--apartments">
          <PanoramaViewer />
        </section>

        {/* Reviews + Footer Section - появляется последней */}
        <section className="layer layer--reviews">
          <div className="reviews-footer-container">
            <Reviews />
            <Footer />
          </div>
        </section>
      </motion.main>
    </>
  );
}