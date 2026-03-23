'use client';

import { useEffect, useRef, useState } from 'react';
import { useHeader } from '@/components/HeaderContext';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

type HeroSlide = {
  id: number;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  sort_order: number;
  is_active: number;
};

export default function Hero() {
  const heroRef = useRef<HTMLDivElement | null>(null);
  
  const { ref: animationRef, isVisible } = useScrollAnimation({ 
    threshold: 0.3,
    once: true 
  });
  
  const { register, unregister } = useHeader();

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [active, setActive] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);

  // Загружаем слайды из БД
  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const res = await fetch('/api/hero-slides');
        const data = await res.json();
        setSlides(data);
      } catch (error) {
        console.error('Error fetching hero slides:', error);
        // Запасные слайды на случай ошибки
        setSlides([
          { id: 1, image_url: '/images/hero/hero1.webp', title: 'Стиль жизни', subtitle: 'Ваш стиль жизни у берега Черного моря', sort_order: 1, is_active: 1 },
          { id: 2, image_url: '/images/hero/hero2.webp', title: 'Премиальные апартаменты', subtitle: 'Премиальные апартаменты в Алуште', sort_order: 2, is_active: 1 },
          { id: 3, image_url: '/images/hero/hero3.webp', title: 'Комфорт и природа', subtitle: 'Комфорт, эстетика и природа', sort_order: 3, is_active: 1 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchSlides();
  }, []);

  // Фильтруем активные слайды и сортируем
  const activeSlides = slides.filter(slide => slide.is_active === 1).sort((a, b) => a.sort_order - b.sort_order);

  // ПРИНУДИТЕЛЬНЫЙ СБРОС ПРИ МОНТИРОВАНИИ
  useEffect(() => {
    const heroElement = heroRef.current;
    if (heroElement) {
      heroElement.classList.remove('mobile', 'desktop', 'fullscreen-mode');
    }
    
    const mainContainer = document.querySelector('.main-container');
    if (mainContainer) {
      const isMobile = window.innerWidth <= 768;
      mainContainer.classList.remove('mobile', 'desktop');
      mainContainer.classList.add(isMobile ? 'mobile' : 'desktop');
    }
  }, []);

  /* HEADER MODE (HERO) */
  useEffect(() => {
    if (!heroRef.current) return;

    const id = 'hero';

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          register(id, {
            mode: 'hero',
            priority: 1,
          });
        } else {
          unregister(id);
        }
      },
      {
        threshold: 0.6,
      }
    );

    observer.observe(heroRef.current);

    return () => {
      observer.disconnect();
      unregister(id);
    };
  }, [register, unregister]);

  /* PARALLAX / TILT */
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

  /* AUTOPLAY - обновлено для работы с динамическими слайдами */
  useEffect(() => {
    if (activeSlides.length <= 1) return;
    
    timeoutRef.current = setTimeout(() => {
      setActive(prev => (prev + 1) % activeSlides.length);
    }, 5000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [active, isHovered, activeSlides.length]);

  // Показываем заглушку при загрузке
  if (loading) {
    return (
      <section className="hero-loading">
        <div className="hero-loader" />
      </section>
    );
  }

  // Если нет слайдов, показываем заглушку
  if (activeSlides.length === 0) {
    return (
      <section className="hero-empty">
        <div className="hero-empty-content">
          <h1>Стиль Жизни</h1>
          <p>Премиальные апартаменты в Алуште</p>
        </div>
      </section>
    );
  }

  const currentSlide = activeSlides[active];

  return (
    <section
      ref={(el) => {
        if (el && el instanceof HTMLDivElement) {
          heroRef.current = el;
          (animationRef as React.MutableRefObject<HTMLElement | null>).current = el;
        }
      }}
      className="hero"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchStart === null) return;

        const diff = touchStart - e.changedTouches[0].clientX;

        if (diff > 50) {
          setActive(prev => (prev + 1) % activeSlides.length);
        }

        if (diff < -50) {
          setActive(prev =>
            prev === 0 ? activeSlides.length - 1 : prev - 1
          );
        }

        setTouchStart(null);
      }}
    >
      {/* SLIDES */}
      <div className="hero-slides">
        {activeSlides.map((slide, i) => (
          <div
            key={slide.id}
            className={`hero-slide ${i === active ? 'active' : ''}`}
            style={{ backgroundImage: `url(${slide.image_url})` }}
          />
        ))}
      </div>

      {/* SVG FRAME */}
      <svg
        className="hero-frame-svg"
        viewBox="0 0 1900 1300"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="
            M 0 0
            H 1900
            V 580
            L 1865 650
            L 1900 720
            V 1300
            H 0
            V 720
            L 35 650
            L 0 580
            Z
          "
          fill="none"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="1"
        />
      </svg>

      <button
        className="hero-arrow hero-arrow--left"
        onClick={() =>
          setActive(prev =>
            prev === 0 ? activeSlides.length - 1 : prev - 1
          )
        }
      >
        ‹
      </button>

      <button
        className="hero-arrow hero-arrow--right"
        onClick={() =>
          setActive(prev => (prev + 1) % activeSlides.length)
        }
      >
        ›
      </button>

      <div className="hero-accent-bar" />

      {/* CONTENT */}
      <div className="hero-content">
        <div className={`hero-text ${isVisible ? 'animate-in' : ''}`} key={active}>
          <h1 className="hero-title">
            {currentSlide.title || 'Стиль Жизни'}{' '}
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
            {currentSlide.subtitle}
          </p>
        </div>

        {/* TIMELINE */}
        <div className="hero-timeline">
          {activeSlides.map((_, i) => (
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