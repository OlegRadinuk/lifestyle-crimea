'use client';

import { useEffect, useRef, useState } from 'react';
import { useHeader } from '@/components/HeaderContext';

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
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const { register, unregister } = useHeader();

  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(REVIEWS.length); // начинаем с первого оригинального
  const [paused, setPaused] = useState(false);
  const [slideWidth, setSlideWidth] = useState(0);

  const slides = [...REVIEWS, ...REVIEWS, ...REVIEWS]; // зацикливаем

  /* ===== HEADER MODE ===== */
  useEffect(() => {
    if (!sectionRef.current) return;

    const id = 'reviews';

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          register(id, {
            mode: 'dark',
            priority: 3,
          });
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

  /* ===== VISIBLE ANIMATION ===== */
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

  /* ===== CALC SLIDE WIDTH ===== */
  useEffect(() => {
    const calculateWidth = () => {
      if (!viewportRef.current) return;
      
      const viewportWidth = viewportRef.current.clientWidth;
      const gap = 20; // должно совпадать с gap в CSS
      const slidesPerView = window.innerWidth <= 768 ? 1 : window.innerWidth <= 1024 ? 2 : 3;
      const width = (viewportWidth - (gap * (slidesPerView - 1))) / slidesPerView;
      
      setSlideWidth(width);
    };

    calculateWidth();
    window.addEventListener('resize', calculateWidth);
    
    return () => window.removeEventListener('resize', calculateWidth);
  }, []);

  /* ===== AUTOPLAY ===== */
  useEffect(() => {
    if (paused) return;

    const id = setInterval(() => {
      setIndex(i => i + 1);
    }, 5000);

    return () => clearInterval(id);
  }, [paused]);

  /* ===== TRANSLATE ===== */
  useEffect(() => {
    if (!trackRef.current || slideWidth === 0) return;

    trackRef.current.style.transform = `translateX(-${index * (slideWidth + 20)}px)`;

    // бесконечная прокрутка
    if (index >= REVIEWS.length * 2) {
      setTimeout(() => {
        trackRef.current!.style.transition = 'none';
        setIndex(REVIEWS.length);
        requestAnimationFrame(() => {
          trackRef.current!.style.transition = 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)';
        });
      }, 600);
    }

    if (index <= 0) {
      setTimeout(() => {
        trackRef.current!.style.transition = 'none';
        setIndex(REVIEWS.length);
        requestAnimationFrame(() => {
          trackRef.current!.style.transition = 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)';
        });
      }, 600);
    }
  }, [index, slideWidth]);

  /* ===== TOUCH HANDLERS FOR SWIPE ===== */
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setPaused(true); // останавливаем автоплей при касании
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;

    const diffX = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50; // минимальное расстояние для свайпа

    if (Math.abs(diffX) > minSwipeDistance) {
      if (diffX > 0) {
        // свайп влево - следующий отзыв
        setIndex(i => i + 1);
      } else {
        // свайп вправо - предыдущий отзыв
        setIndex(i => i - 1);
      }
    }

    // сбрасываем значения
    touchStartX.current = null;
    touchEndX.current = null;
    
    // возобновляем автоплей через небольшую задержку
    setTimeout(() => setPaused(false), 3000);
  };

  return (
    <section
      ref={sectionRef}
      className={`reviews ${visible ? 'is-visible' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="reviews__mobile-content">
        <h2 className="reviews__title">
          Отзывы гостей о комплексе апартаментов «Стиль Жизни»
        </h2>

        <div
          className="reviews__outer"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Стрелки скрыты на мобильных через CSS, оставлены для десктопа */}
          <button
            className="reviews__arrow reviews__arrow--left"
            onClick={() => setIndex(i => i - 1)}
            aria-label="Предыдущие отзывы"
          >
            ‹
          </button>

          <div className="reviews__viewport" ref={viewportRef}>
            <div className="reviews__track" ref={trackRef}>
              {slides.map((review, i) => (
                <div className="review-card" key={`${review.author}-${i}`}>
                  <p className="review-card__text">{review.text}</p>
                  <div className="review-card__author">{review.author}</div>
                </div>
              ))}
            </div>
          </div>

          <button
            className="reviews__arrow reviews__arrow--right"
            onClick={() => setIndex(i => i + 1)}
            aria-label="Следующие отзывы"
          >
            ›
          </button>
        </div>

        <a
          className="reviews__yandex"
          href="https://yandex.ru/maps/org/stil_zhizni/82645925123/"
          target="_blank"
          rel="noreferrer"
        >
          Смотреть все отзывы на Яндекс Картах
        </a>
      </div>
    </section>
  );
}