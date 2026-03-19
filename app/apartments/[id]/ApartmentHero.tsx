'use client';

import { useEffect, useState, useRef } from 'react';
import { useHeader } from '@/components/HeaderContext';
import { usePhotoModal } from '@/components/photo-modal/PhotoModalContext';
import { motion, AnimatePresence } from "framer-motion";
import Link from 'next/link';
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
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const slideRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  // Определяем мобилку
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /* ===============================
     АНИМАЦИЯ ДЫХАНИЯ (ТОЛЬКО ДЛЯ АКТИВНОГО СЛАЙДА)
  =============================== */
  useEffect(() => {
    const activeSlide = document.querySelector('.hero-slide.active .hero-slide-bg');
    if (!activeSlide || !(activeSlide instanceof HTMLElement)) return;

    let startTime: number | null = null;
    
    const animateBreathing = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      
      const progress = (timestamp - startTime) / 8000;
      const normalizedProgress = progress % 1;
      
      const scale = 1.06 + 0.02 * Math.sin(normalizedProgress * Math.PI * 2);
      
      if (activeSlide instanceof HTMLElement) {
        activeSlide.style.transform = `scale(${scale})`;
      }

      animationRef.current = requestAnimationFrame(animateBreathing);
    };

    animationRef.current = requestAnimationFrame(animateBreathing);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [active]);

  /* ===============================
     ПЛАВНОЕ ПЕРЕКЛЮЧЕНИЕ СЛАЙДОВ
  =============================== */
  const changeSlide = (newIndex: number) => {
    if (isTransitioning || newIndex === active) return;
    
    setIsTransitioning(true);
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    setActive(newIndex);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 600);
  };

  const nextSlide = () => {
    if (isTransitioning) return;
    const newIndex = (active + 1) % apartment.images.length;
    changeSlide(newIndex);
  };

  const prevSlide = () => {
    if (isTransitioning) return;
    const newIndex = active === 0 ? apartment.images.length - 1 : active - 1;
    changeSlide(newIndex);
  };

  /* ===============================
     СВАЙП
  =============================== */
  useEffect(() => {
    if (!isMobile) return;

    const container = document.querySelector('.apartment-hero.mobile');
    if (!container) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    let isSwiping = false;

    const handleTouchStart = (e: Event) => {
      if (isTransitioning) return;
      const touchEvent = e as TouchEvent;
      touchStartX = touchEvent.touches[0].clientX;
      touchStartY = touchEvent.touches[0].clientY;
      isSwiping = true;
      setPaused(true);
    };

    const handleTouchMove = (e: Event) => {
      if (!isSwiping || isTransitioning) return;
      const touchEvent = e as TouchEvent;
      touchEndX = touchEvent.touches[0].clientX;
      touchEndY = touchEvent.touches[0].clientY;
    };

    const handleTouchEnd = () => {
      if (!isSwiping || isTransitioning) return;
      
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      if (absDeltaX > 50 && absDeltaX > absDeltaY) {
        if (deltaX > 0) {
          prevSlide();
        } else {
          nextSlide();
        }
      } else if (absDeltaY > 50 && absDeltaY > absDeltaX) {
        if (deltaY > 0) {
          prevSlide();
        } else {
          nextSlide();
        }
      }

      isSwiping = false;
      setTimeout(() => setPaused(false), 3000);
    };

    container.addEventListener('touchstart', handleTouchStart as EventListener);
    container.addEventListener('touchmove', handleTouchMove as EventListener);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart as EventListener);
      container.removeEventListener('touchmove', handleTouchMove as EventListener);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, isTransitioning]);

  // HEADER MODE
  useEffect(() => {
    const id = 'apartment-hero';
    register(id, { mode: 'apartment', priority: 2 });
    return () => unregister(id);
  }, [register, unregister]);

  // AUTOPLAY
  useEffect(() => {
    if (paused || isTransitioning || !apartment.images?.length) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 6000);

    return () => clearInterval(timer);
  }, [paused, isTransitioning, apartment.images]);

  if (!apartment.images?.length) {
    return <div>Нет изображений</div>;
  }

  const isActive = apartment.isActive !== false;

  // Общие компоненты
  const SliderArrows = () => (
    <>
      <button
        className={`hero-arrow hero-arrow--left ${isMobile ? 'mobile' : ''} ${isTransitioning ? 'disabled' : ''}`}
        onClick={prevSlide}
        disabled={isTransitioning}
      >
        ‹
      </button>
      <button
        className={`hero-arrow hero-arrow--right ${isMobile ? 'mobile' : ''} ${isTransitioning ? 'disabled' : ''}`}
        onClick={nextSlide}
        disabled={isTransitioning}
      >
        ›
      </button>
    </>
  );

  const Timeline = () => (
    <div className={`hero-timeline ${isMobile ? 'mobile' : ''}`}>
      {apartment.images.map((_, index) => (
        <button
          key={index}
          className={`hero-timeline-item ${index === active ? 'active' : ''} ${isTransitioning ? 'disabled' : ''}`}
          onClick={() => !isTransitioning && changeSlide(index)}
          disabled={isTransitioning}
        >
          {String(index + 1).padStart(2, '0')}
        </button>
      ))}
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
        <div className="hero-slider" ref={slideRef}>
          {apartment.images.map((img, index) => (
            <div
              key={index}
              className={`hero-slide ${index === active ? 'active' : ''}`}
            >
              <div
                className="hero-slide-bg"
                style={{ backgroundImage: `url(${img})` }}
              />
            </div>
          ))}
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
          <div className="panorama-info-inner animate-in">
            <span className="panorama-info-eyebrow">Lifestyle · Luxury</span>
            <h2 className="panorama-info-title">{apartment.title}</h2>
            <p className="panorama-info-description">{apartment.description}</p>
            
            <ul className="panorama-info-meta">
              <li>До {apartment.maxGuests} гостей</li>
              <li>{apartment.area} м²</li>
              {apartment.features?.map((item, i) => (
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
      {/* SLIDER */}
      <div className="hero-slider" ref={slideRef}>
        {apartment.images.map((img, index) => (
          <div
            key={index}
            className={`hero-slide ${index === active ? 'active' : ''}`}
          >
            <div
              className="hero-slide-bg"
              style={{ backgroundImage: `url(${img})` }}
            />
          </div>
        ))}
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