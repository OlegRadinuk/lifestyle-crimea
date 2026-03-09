'use client';

import { useEffect, useRef, useState } from 'react';
import { useHeader } from '@/components/HeaderContext';

const slides = [
  {
    id: 1,
    image: '/images/hero/hero1.webp',
    text: 'Ваш стиль жизни у берега Черного моря',
  },
  {
    id: 2,
    image: '/images/hero/hero2.webp',
    text: 'Премиальные апартаменты в Алуште',
  },
  {
    id: 3,
    image: '/images/hero/hero3.webp',
    text: 'Комфорт, эстетика и природа',
  },
];

export default function Hero() {
  const { register, unregister } = useHeader();

  const heroRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>(null);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [active, setActive] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Header mode registration
  useEffect(() => {
    if (!heroRef.current) return;

    const id = 'hero';

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          register(id, { mode: 'hero', priority: 1 });
        } else {
          unregister(id);
        }
      },
      { threshold: 0.6 }
    );

    observer.observe(heroRef.current);

    return () => {
      observer.disconnect();
      unregister(id);
    };
  }, [register, unregister]);

  // Parallax / Tilt effect
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      targetX = (x / rect.width - 0.5) * 6;
      targetY = (y / rect.height - 0.5) * -6;
    };

    const animate = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      hero.style.setProperty('--rx', `${currentY}deg`);
      hero.style.setProperty('--ry', `${currentX}deg`);

      requestAnimationFrame(animate);
    };

    animate();
    window.addEventListener('mousemove', onMouseMove);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  // Autoplay
  useEffect(() => {
    if (isHovered) return;

    timeoutRef.current = setTimeout(() => {
      setActive(prev => (prev + 1) % slides.length);
    }, 4000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [active, isHovered]);

  const handlePrev = () => {
    setActive(prev => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActive(prev => (prev + 1) % slides.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;

    const diff = touchStart - e.changedTouches[0].clientX;

    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }

    setTouchStart(null);
  };

  return (
    <section
      ref={heroRef}
      className="hero"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides */}
      <div className="hero-slides">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className={`hero-slide ${i === active ? 'active' : ''}`}
            style={{ backgroundImage: `url(${slide.image})` }}
          />
        ))}
      </div>

      {/* SVG Frame */}
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

      {/* Arrows */}
      <button
        className="hero-arrow hero-arrow--left"
        onClick={handlePrev}
        aria-label="Предыдущий слайд"
      >
        ‹
      </button>

      <button
        className="hero-arrow hero-arrow--right"
        onClick={handleNext}
        aria-label="Следующий слайд"
      >
        ›
      </button>

      {/* Content */}
      <div className="hero-content">
        <div className="hero-text" key={active}>
          <h1 className="hero-title">
            Стиль Жизни{' '}
            <span className="hero-love">
              {'с любовью...'.split('').map((char, i) => (
                <span
                  key={i}
                  className="hero-love-char"
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ))}
            </span>
          </h1>

          <p className="hero-description">
            {slides[active].text}
          </p>
        </div>

        {/* Timeline */}
        <div className="hero-timeline">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`hero-timeline-item ${i === active ? 'active' : ''}`}
              onClick={() => setActive(i)}
            >
              {String(i + 1).padStart(2, '0')}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}