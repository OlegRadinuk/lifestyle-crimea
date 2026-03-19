'use client';

import { useEffect, useState, useCallback } from 'react';
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
    if (paused || !apartment.images?.length) return;

    const timer = setInterval(() => {
      goToNext();
    }, 6000);

    return () => clearInterval(timer);
  }, [paused, apartment.images.length, goToNext]);

  if (!apartment.images?.length) {
    return <div>Нет изображений</div>;
  }

  const isActive = apartment.isActive !== false;

  // Анимация для слайда - только opacity
  const slideVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { opacity: { duration: 0.4 } }
    },
    exit: { 
      opacity: 0,
      transition: { opacity: { duration: 0.3 } }
    }
  };

  // Компонент стрелок
  const SliderArrows = () => (
    <>
      <button
        className={`hero-arrow hero-arrow--left ${isMobile ? 'mobile' : ''}`}
        onClick={goToPrev}
        aria-label="Предыдущее фото"
      >
        ‹
      </button>
      <button
        className={`hero-arrow hero-arrow--right ${isMobile ? 'mobile' : ''}`}
        onClick={goToNext}
        aria-label="Следующее фото"
      >
        ›
      </button>
    </>
  );

  // Компонент таймлайна
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
        {/* SLIDER с AnimatePresence */}
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
                  className="hero-slide active"
                  style={{ 
                    position: 'absolute', 
                    inset: 0,
                    willChange: 'opacity'
                  }}
                >
                  {/* Картинка с анимацией приближения через CSS */}
                  <div
                    className="hero-slide-bg"
                    style={{ 
                      backgroundImage: `url(${img})`,
                    }}
                  />
                </motion.div>
              )
            ))}
          </AnimatePresence>
          
          {/* Бэкграунд для предотвращения мигания */}
          <div 
            className="hero-slide-background"
            style={{
              position: 'absolute',
              inset: 0,
              background: '#000',
              zIndex: -1
            }}
          />
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

  // Мобильная версия
  return (
    <section
      className="apartment-hero mobile"
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setTimeout(() => setPaused(false), 3000)}
    >
      {/* SLIDER с AnimatePresence */}
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
                className="hero-slide active"
                style={{ 
                  position: 'absolute', 
                  inset: 0,
                  willChange: 'opacity'
                }}
              >
                <div
                  className="hero-slide-bg"
                  style={{ 
                    backgroundImage: `url(${img})`,
                  }}
                />
              </motion.div>
            )
          ))}
        </AnimatePresence>
        
        {/* Бэкграунд для предотвращения мигания */}
        <div 
          className="hero-slide-background"
          style={{
            position: 'absolute',
            inset: 0,
            background: '#000',
            zIndex: -1
          }}
        />
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

        {/* ХАРАКТЕРИСТИКИ - ЧИПСЫ */}
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

      <SliderArrows />
      <Timeline />
    </section>
  );
}