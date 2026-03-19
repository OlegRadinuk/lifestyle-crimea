'use client';

import { useEffect, useState } from 'react';
import { useHeader } from '@/components/HeaderContext';
import { usePhotoModal } from '@/components/photo-modal/PhotoModalContext';
import { motion } from "framer-motion";
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

  // Определяем мобилку
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /* ===============================
     АНИМАЦИЯ ДЫХАНИЯ (НЕПРЕРЫВНАЯ)
  =============================== */
  useEffect(() => {
    const container = document.querySelector('.apartment-hero .hero-slider');
    if (!container) return;

    let animationFrame: number;
    let startTime: number | null = null;

    const animateBreathing = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      
      const progress = (timestamp - startTime) / 6000; // 6 секунд на цикл
      const normalizedProgress = progress % 1; // 0 to 1
      
      // Плавное дыхание от 1.06 до 1 и обратно
      const scale = 1.03 + 0.03 * Math.sin(normalizedProgress * Math.PI * 2);
      
      // Применяем масштаб только к активному слайду
      const activeSlide = container.querySelector('.hero-slide.active .hero-slide-bg');
      if (activeSlide instanceof HTMLElement) {
        activeSlide.style.transform = `scale(${scale})`;
      }

      animationFrame = requestAnimationFrame(animateBreathing);
    };

    animationFrame = requestAnimationFrame(animateBreathing);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, []); // Пустой массив - анимация не перезапускается

  /* ===============================
     СВАЙП (ГОРИЗОНТАЛЬНЫЙ И ВЕРТИКАЛЬНЫЙ)
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
      const touchEvent = e as TouchEvent;
      touchStartX = touchEvent.touches[0].clientX;
      touchStartY = touchEvent.touches[0].clientY;
      isSwiping = true;
      setPaused(true);
    };

    const handleTouchMove = (e: Event) => {
      if (!isSwiping) return;
      const touchEvent = e as TouchEvent;
      touchEndX = touchEvent.touches[0].clientX;
      touchEndY = touchEvent.touches[0].clientY;
    };

    const handleTouchEnd = () => {
      if (!isSwiping) return;
      
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Определяем направление свайпа (и горизонтальный, и вертикальный)
      if (absDeltaX > 50 && absDeltaX > absDeltaY) {
        // Горизонтальный свайп
        if (deltaX > 0) {
          // Свайп вправо - предыдущий слайд
          setActive(prev => prev === 0 ? apartment.images.length - 1 : prev - 1);
        } else {
          // Свайп влево - следующий слайд
          setActive(prev => (prev + 1) % apartment.images.length);
        }
      } else if (absDeltaY > 50 && absDeltaY > absDeltaX) {
        // Вертикальный свайп
        if (deltaY > 0) {
          // Свайп вниз - предыдущий слайд
          setActive(prev => prev === 0 ? apartment.images.length - 1 : prev - 1);
        } else {
          // Свайп вверх - следующий слайд
          setActive(prev => (prev + 1) % apartment.images.length);
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
  }, [isMobile, apartment.images.length]);

  // HEADER MODE
  useEffect(() => {
    const id = 'apartment-hero';
    register(id, { mode: 'apartment', priority: 2 });
    return () => unregister(id);
  }, [register, unregister]);

  // AUTOPLAY
  useEffect(() => {
    if (paused || !apartment.images?.length) return;

    const timer = setInterval(() => {
      setActive(prev => (prev + 1) % apartment.images.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [paused, apartment.images]);

  if (!apartment.images?.length) {
    return <div>Нет изображений</div>;
  }

  const isActive = apartment.isActive !== false;

  // Общие компоненты для десктопа и мобилки
  const SliderArrows = () => (
    <>
      <button
        className={`hero-arrow hero-arrow--left ${isMobile ? 'mobile' : ''}`}
        onClick={() => setActive(prev => prev === 0 ? apartment.images.length - 1 : prev - 1)}
      >
        ‹
      </button>
      <button
        className={`hero-arrow hero-arrow--right ${isMobile ? 'mobile' : ''}`}
        onClick={() => setActive(prev => (prev + 1) % apartment.images.length)}
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
          className={`hero-timeline-item ${index === active ? 'active' : ''}`}
          onClick={() => setActive(index)}
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
        <div className="hero-slider">
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
      <div className="hero-slider">
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