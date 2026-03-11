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

  // Отслеживаем прогресс скролла (всегда включено, но используем только на десктопе)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Преобразуем прогресс в индекс секции (0, 1, 2)
  const sectionIndex = useTransform(scrollYProgress, 
    [0, 0.33, 0.34, 0.66, 0.67, 1], 
    [0, 0, 1, 1, 2, 2]
  );

  // Создаем отдельные значения для мобильных и десктопа
  const desktopOpacity = useTransform(sectionIndex, [0, 0.5], [1, 0]);
  const desktopScale = useTransform(sectionIndex, [0, 1], [1, 0.95]);
  const desktopBlur = useTransform(sectionIndex, [0, 1], ['blur(0px)', 'blur(4px)']);
  
  const panoramaOpacity = useTransform(sectionIndex, [0.33, 0.5, 0.66], [0, 1, 1]);
  const panoramaScale = useTransform(sectionIndex, [0.5, 1.5], [0.95, 1]);
  
  const reviewsOpacity = useTransform(sectionIndex, [0.66, 0.8, 1], [0, 1, 1]);
  const reviewsScale = useTransform(sectionIndex, [0.8, 2], [0.95, 1]);

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
        style={{ 
          height: isMobile ? 'auto' : '300vh',
          position: 'relative'
        }}
      >
        {/* Hero Section */}
        <motion.section 
          className="layer layer--hero"
          style={isMobile ? {
            position: 'relative',
            height: '100vh',
            width: '100%'
          } : {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100vh',
            opacity: desktopOpacity,
            scale: desktopScale,
            filter: desktopBlur,
            pointerEvents: useTransform(sectionIndex, (v) => v === 0 ? 'auto' : 'none'),
            zIndex: 3
          }}
        >
          <Hero />
        </motion.section>

        {/* Panorama Section */}
        <motion.section 
          className="layer layer--apartments"
          style={isMobile ? {
            position: 'relative',
            height: '100vh',
            width: '100%'
          } : {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100vh',
            opacity: panoramaOpacity,
            scale: panoramaScale,
            filter: useTransform(sectionIndex, (v) => 
              v === 1 ? 'blur(0px)' : 'blur(4px)'
            ),
            pointerEvents: useTransform(sectionIndex, (v) => v === 1 ? 'auto' : 'none'),
            zIndex: useTransform(sectionIndex, (v) => v >= 1 ? 2 : 1)
          }}
        >
          <PanoramaViewer />
        </motion.section>

        {/* Reviews + Footer Section */}
        <motion.section 
          className="layer layer--reviews"
          style={isMobile ? {
            position: 'relative',
            height: '100vh',
            width: '100%'
          } : {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100vh',
            opacity: reviewsOpacity,
            scale: reviewsScale,
            pointerEvents: useTransform(sectionIndex, (v) => v === 2 ? 'auto' : 'none'),
            zIndex: useTransform(sectionIndex, (v) => v >= 2 ? 4 : 1),
            overflowY: useTransform(sectionIndex, (v) => v === 2 ? 'auto' : 'hidden')
          }}
        >
          <div style={{ 
            height: '100%', 
            overflowY: isMobile ? 'visible' : 'auto',
            WebkitOverflowScrolling: 'touch'
          }}>
            <Reviews />
            <Footer />
          </div>
        </motion.section>

        {/* Мобильный индикатор прокрутки */}
        {isMobile && (
          <motion.div 
            className="mobile-scroll-indicator"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.8, duration: 0.5 }}
          >
            <span className="scroll-dot" />
            <span className="scroll-dot" />
            <span className="scroll-dot" />
          </motion.div>
        )}
      </motion.main>
    </>
  );
}