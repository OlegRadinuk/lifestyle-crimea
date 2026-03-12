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

export default function Reviews() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const { register, unregister } = useHeader();

  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(1);
  const [paused, setPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [cardsPerView, setCardsPerView] = useState(3);

  // Определяем количество карточек на экране
  useEffect(() => {
    const updateCardsPerView = () => {
      const width = window.innerWidth;
      if (width <= 768) {
        setCardsPerView(1);
        setIsMobile(true);
      } else if (width <= 1024) {
        setCardsPerView(2);
        setIsMobile(false);
      } else {
        setCardsPerView(3);
        setIsMobile(false);
      }
    };
    
    updateCardsPerView();
    window.addEventListener('resize', updateCardsPerView);
    return () => window.removeEventListener('resize', updateCardsPerView);
  }, []);

  // Регистрация в HeaderContext
  useEffect(() => {
    if (!sectionRef.current) return;
    const id = 'reviews';
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

  // Автоплей
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setCurrentIndex(i => (i + 1) % REVIEWS.length);
    }, 5000);
    return () => clearInterval(id);
  }, [paused]);

  // Обработчики свайпа
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    const minSwipe = 50;
    
    if (Math.abs(diff) > minSwipe) {
      if (diff > 0) {
        setCurrentIndex(i => (i + 1) % REVIEWS.length);
      } else {
        setCurrentIndex(i => (i - 1 + REVIEWS.length) % REVIEWS.length);
      }
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
    setTimeout(() => setPaused(false), 3000);
  };

  // Получаем видимые карточки
  const getVisibleReviews = () => {
    const result = [];
    for (let i = -1; i <= 1; i++) {
      const index = (currentIndex + i + REVIEWS.length) % REVIEWS.length;
      result.push(REVIEWS[index]);
    }
    return result;
  };

  const visibleReviews = getVisibleReviews();

  return (
    <section
      ref={sectionRef}
      className={`reviews ${visible ? 'is-visible' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="reviews__container">
        <h2 className="reviews__title">
          Отзывы гостей
        </h2>

        <div className="reviews__slider" ref={sliderRef}>
          <div className="reviews__track" ref={trackRef}>
            {visibleReviews.map((review, idx) => (
              <div 
                className="review-card" 
                key={`${review.author}-${idx}`}
                style={{
                  transform: idx === 1 ? 'scale(1.05)' : 'scale(0.95)',
                  opacity: idx === 1 ? 1 : 0.7,
                  transition: 'all 0.3s ease'
                }}
              >
                <p className="review-card__text">{review.text}</p>
                <div className="review-card__author">{review.author}</div>
              </div>
            ))}
          </div>
        </div>

        <a
          className="reviews__yandex"
          href="https://yandex.ru/maps/org/stil_zhizni/82645925123/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Смотреть все отзывы на Яндекс Картах
        </a>
      </div>

      {/* Footer ВНУТРИ секции, чтобы CSS работал */}
      <Footer />
    </section>
  );
}