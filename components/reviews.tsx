'use client';

import { useEffect, useRef, useState } from 'react';
import { useHeader } from '@/components/HeaderContext';
import Footer from './Footer';

type Review = {
  author: string;
  text: string;
};

const REVIEWS: Review[] = [
  {
    author: 'Татьяна',
    text: 'Приятные апартаменты. Прожили 9 дней, остались в восторге. Красивый вид на море, стильный интерьер и чистота.',
  },
  {
    author: 'Радик',
    text: 'Лучше не придумать. Есть всё необходимое, полный набор техники и отличный ремонт.',
  },
  {
    author: 'Ольга',
    text: 'Огромная благодарность Марине за помощь. Заселились раньше, всё прошло идеально.',
  },
  {
    author: 'Айрат',
    text: 'В номере есть абсолютно всё. Вид с балкона — супертоп, рассветы и закаты прямо из номера.',
  },
  {
    author: 'Арсений',
    text: 'Очень понравились апартаменты, виды и сервис. Обязательно вернёмся.',
  },
  {
    author: 'Сергей',
    text: 'Чудесные апартаменты, есть всё необходимое. Администратор решает вопросы мгновенно.',
  },
  {
    author: 'Виктория',
    text: 'Номер полностью соответствует фото. Вид на море шикарный, комфорт на уровне.',
  },
];

export default function ReviewsFinal() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

  const { register, unregister } = useHeader();

  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Определяем мобилку
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Регистрация в HeaderContext
  useEffect(() => {
    if (!sectionRef.current) return;
    const id = 'reviews-final';
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          register(id, { mode: 'dark', priority: 3 });
        } else {
          unregister(id);
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(sectionRef.current);
    return () => {
      observer.disconnect();
      unregister(id);
    };
  }, [register, unregister]);

  // Анимация появления
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Автоплей - отключается при paused или hovered (на десктопе)
  useEffect(() => {
    if (paused || (hovered && !isMobile)) return;
    const id = setInterval(() => {
      setCurrentIndex(i => (i + 1) % REVIEWS.length);
    }, 5000);
    return () => clearInterval(id);
  }, [paused, hovered, isMobile]);

  // Обработчики для десктоп ховера
  const handleMouseEnter = () => setHovered(true);
  const handleMouseLeave = () => setHovered(false);

  // Обработчики свайпа для мобилок
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current || !touchStartY.current || !touchEndY.current) return;
    
    const diffX = touchStartX.current - touchEndX.current;
    const diffY = touchStartY.current - touchEndY.current;
    const minSwipe = 50;
    
    // На мобилке вертикальные свайпы
    if (isMobile) {
      if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > minSwipe) {
        if (diffY > 0) {
          // Свайп вверх - следующий
          setCurrentIndex(i => (i + 1) % REVIEWS.length);
        } else {
          // Свайп вниз - предыдущий
          setCurrentIndex(i => (i - 1 + REVIEWS.length) % REVIEWS.length);
        }
      }
    } else {
      // На десктопе горизонтальные свайпы (для тачпадов)
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > minSwipe) {
        if (diffX > 0) {
          setCurrentIndex(i => (i + 1) % REVIEWS.length);
        } else {
          setCurrentIndex(i => (i - 1 + REVIEWS.length) % REVIEWS.length);
        }
      }
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
    touchStartY.current = null;
    touchEndY.current = null;
    
    // Автоплей возобновится через 3 секунды
    setTimeout(() => setPaused(false), 3000);
  };

  // Клик по карточке
  const handleCardClick = (position: string) => {
    setPaused(true);
    if (position === 'prev') {
      setCurrentIndex(i => (i - 1 + REVIEWS.length) % REVIEWS.length);
    } else if (position === 'next') {
      setCurrentIndex(i => (i + 1) % REVIEWS.length);
    }
    setTimeout(() => setPaused(false), 3000);
  };

  // Получаем видимые карточки
  const getVisibleReviews = () => {
    if (!REVIEWS.length) return [];
    
    const total = REVIEWS.length;
    const prevIndex = (currentIndex - 1 + total) % total;
    const currIndex = currentIndex;
    const nextIndex = (currentIndex + 1) % total;
    
    if (isMobile) {
      // На мобилке показываем все отзывы вертикально
      return REVIEWS;
    } else {
      // На десктопе показываем 3: предыдущий, текущий, следующий
      return [
        REVIEWS[prevIndex],
        REVIEWS[currIndex],
        REVIEWS[nextIndex]
      ];
    }
  };

  const visibleReviews = getVisibleReviews();

  if (!visibleReviews.length) {
    return null;
  }

  return (
    <section
      ref={sectionRef}
      className={`rf-section ${visible ? 'rf-visible' : ''} ${isMobile ? 'rf-mobile' : 'rf-desktop'}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Контейнер отзывов */}
      <div className={`rf-container ${isMobile ? 'rf-container-mobile' : 'rf-container-desktop'}`}>
        <h2 className="rf-title">Отзывы гостей</h2>

        <div className="rf-slider">
          <div className="rf-track" ref={trackRef}>
            {visibleReviews.map((review, idx) => {
              // Определяем позицию карточки
              let position = 'center';
              if (!isMobile) {
                if (idx === 0) position = 'prev';
                else if (idx === 2) position = 'next';
              }
              
              return (
                <div 
                  className={`rf-card ${
                    isMobile 
                      ? (idx === currentIndex ? 'rf-card-center' : 'rf-card-side')
                      : (idx === 1 ? 'rf-card-center' : `rf-card-${position}`)
                  }`}
                  key={`${review.author}-${idx}-${currentIndex}`}
                  onClick={() => {
                    if (!isMobile && position !== 'center') {
                      handleCardClick(position);
                    } else if (isMobile && idx !== currentIndex) {
                      // На мобилке клик по любой карточке делает её центральной
                      setCurrentIndex(idx);
                      setPaused(true);
                      setTimeout(() => setPaused(false), 3000);
                    }
                  }}
                >
                  <p className="rf-card-text">{review.text}</p>
                  <div className="rf-card-author">{review.author}</div>
                </div>
              );
            })}
          </div>
        </div>

        <a
          className="rf-yandex-link"
          href="https://yandex.ru/maps/org/stil_zhizni/82645925123/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Смотреть все отзывы на Яндекс Картах
        </a>
      </div>

      {/* Футер */}
      <Footer isMobile={isMobile} />
    </section>
  );
}