'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useHeader } from '@/components/HeaderContext';
import { usePhotoModal } from '@/components/photo-modal/PhotoModalContext';
import { motion, AnimatePresence } from "framer-motion";
import './apartment.css';

type Props = {
  apartment: {
    id: string;
    title: string;
    shortDescription: string;
    description: string;
    maxGuests: number;
    area: number;
    priceBase: number;
    view: string;
    hasTerrace: boolean;
    features: string[];
    images: string[];
    isActive?: boolean;
  };
  loading?: boolean;
};

export default function ApartmentHero({ apartment, loading = false }: Props) {
  const { register, unregister } = useHeader();
  const { open } = usePhotoModal();
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Для свайпа
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);
  const swipeLock = useRef(false);

  // Определяем мобилку
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // HEADER MODE
  useEffect(() => {
    const id = 'apartment-hero';
    register(id, { mode: 'apartment', priority: 2 });
    return () => unregister(id);
  }, [register, unregister]);

  // Функции навигации
  const goToNext = useCallback(() => {
    setActiveIndex(prev => (prev + 1) % apartment.images.length);
  }, [apartment.images.length]);

  const goToPrev = useCallback(() => {
    setActiveIndex(prev => prev === 0 ? apartment.images.length - 1 : prev - 1);
  }, [apartment.images.length]);

  const goToSlide = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  // AUTOPLAY
  useEffect(() => {
    if (paused || !apartment.images?.length || isMobile) return; // На мобилке автоплей отключаем

    const timer = setInterval(() => {
      goToNext();
    }, 6000);

    return () => clearInterval(timer);
  }, [paused, apartment.images.length, goToNext, isMobile]);

  // Обработчики свайпа
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchEndX.current = null;
    touchEndY.current = null;
    swipeLock.current = false;
    setPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartX.current || !touchStartY.current || swipeLock.current) return;
    
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
    
    const diffX = touchStartX.current - touchEndX.current;
    const diffY = touchStartY.current - touchEndY.current;
    
    // Определяем направление свайпа и блокируем другое
    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Горизонтальный свайп
      swipeLock.current = true;
    }
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current || !touchStartY.current || !touchEndY.current) {
      setPaused(false);
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }

    const diffX = touchStartX.current - touchEndX.current;
    const diffY = touchStartY.current - touchEndY.current;
    const minSwipeDistance = 50;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > minSwipeDistance) {
      // Горизонтальный свайп - переключаем слайды
      if (diffX > 0) {
        goToNext(); // свайп влево
      } else {
        goToPrev(); // свайп вправо
      }
    } else if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > minSwipeDistance) {
      // Вертикальный свайп - тоже переключаем слайды
      if (diffY > 0) {
        goToNext(); // свайп вверх
      } else {
        goToPrev(); // свайп вниз
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
    touchEndX.current = null;
    touchEndY.current = null;
    swipeLock.current = false;
    
    setTimeout(() => setPaused(false), 2000);
  };

  if (!apartment.images?.length) {
    return <div>Нет изображений</div>;
  }

  const isActive = apartment.isActive !== false;

  // Простая анимация - только opacity
  const slideVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const slideTransition = {
    opacity: { duration: 0.3 }
  };

  // Компонент стрелок (только для десктопа)
  const SliderArrows = () => {
    if (isMobile) return null; // На мобилке стрелок нет
    
    return (
      <>
        <button
          className="hero-arrow hero-arrow--left"
          onClick={goToPrev}
          aria-label="Предыдущее фото"
        >
          ‹
        </button>
        <button
          className="hero-arrow hero-arrow--right"
          onClick={goToNext}
          aria-label="Следующее фото"
        >
          ›
        </button>
      </>
    );
  };

  // Компонент таймлайна - без анимации появления
  const Timeline = () => (
    <div className={`hero-timeline ${isMobile ? 'mobile' : ''}`}>
      {apartment.images.map((_, index) => {
        const isActiveSlide = index === activeIndex;
        return (
          <button
            key={index}
            className={`hero-timeline-item ${isActiveSlide ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
            aria-label={`Перейти к фото ${index + 1}`}
          >
            {String(index + 1).padStart(2, '0')}
          </button>
        );
      })}
    </div>
  );

  // Десктоп версия
  if (!isMobile) {
    return (
      <section
        className="apartment-hero desktop"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* SLIDER */}
        <div className="hero-slider">
          <AnimatePresence mode="wait">
            {apartment.images.map((img, index) => (
              index === activeIndex && (
                <motion.div
                  key={index}
                  variants={slideVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={slideTransition}
                  className="hero-slide active"
                  style={{ 
                    position: 'absolute', 
                    inset: 0,
                    willChange: 'opacity'
                  }}
                >
                  <div
                    className="hero-slide-bg"
                    style={{ backgroundImage: `url(${img})` }}
                  />
                </motion.div>
              )
            ))}
          </AnimatePresence>
          <div className="hero-slide-background" />
        </div>

        {/* OVERLAY */}
        <div className="panorama-overlay" />

        {/* SVG FRAME */}
        <svg
          className="hero-frame-svg"
          viewBox="0 0 1900 1300"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 0 0 H 1900 V 580 L 1865 650 L 1900 720 V 1300 H 0 V 720 L 35 650 L 0 580 Z"
            fill="none"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="1"
          />
        </svg>

        {/* INFO */}
        <div className="panorama-info">
          <div className="panorama-info-inner">
            <span className="panorama-info-eyebrow">Lifestyle · Luxury</span>
            <h2 className="panorama-info-title">{apartment.title}</h2>
            <p className="panorama-info-description">{apartment.description}</p>
            
            <ul className="panorama-info-meta">
              <li>До {apartment.maxGuests} гостей</li>
              <li>{apartment.area} м²</li>
              {apartment.features?.slice(0, 2).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>

            {!loading && !isActive && (
              <div className="panorama-unavailable-message">
                <span className="unavailable-text">
                  Апартамент временно недоступен для бронирования
                </span>
              </div>
            )}
          </div>
        </div>

        <SliderArrows />
        <Timeline />
      </section>
    );
  }

  // Мобильная версия со свайпом
  return (
    <section
      className="apartment-hero mobile"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* SLIDER */}
      <div className="hero-slider">
        <AnimatePresence mode="wait">
          {apartment.images.map((img, index) => (
            index === activeIndex && (
              <motion.div
                key={index}
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={slideTransition}
                className="hero-slide active"
                style={{ 
                  position: 'absolute', 
                  inset: 0,
                  willChange: 'opacity'
                }}
              >
                <div
                  className="hero-slide-bg"
                  style={{ backgroundImage: `url(${img})` }}
                />
              </motion.div>
            )
          ))}
        </AnimatePresence>
        <div className="hero-slide-background" />
      </div>

      {/* OVERLAY */}
      <div className="panorama-overlay mobile" />

      {/* INFO */}
      <div className="apartment-info-mobile">
        <div className="apartment-info-header">
          <span className="apartment-info-eyebrow">Lifestyle · Luxury</span>
          <h2 className="apartment-info-title">{apartment.title}</h2>
        </div>

        <p className="apartment-info-description">{apartment.description}</p>

        {/* ЧИПСЫ */}
        <div className="apartment-features-mobile">
          <div className="feature-chip">До {apartment.maxGuests} гостей</div>
          <div className="feature-chip">{apartment.area} м²</div>
          {apartment.features?.slice(0, 3).map((item, i) => (
            <div className="feature-chip" key={i}>{item}</div>
          ))}
        </div>

        {!loading && !isActive && (
          <div className="panorama-unavailable-message mobile">
            <span className="unavailable-text">
              Апартамент временно недоступен
            </span>
          </div>
        )}
      </div>

      {/* ТОЛЬКО ТАЙМЛАЙН, БЕЗ СТРЕЛОК */}
      <Timeline />

      {/* ПОДСКАЗКА ДЛЯ СВАЙПА */}
      <div className="swipe-hint">
        <span>← свайп →</span>
      </div>
    </section>
  );
}