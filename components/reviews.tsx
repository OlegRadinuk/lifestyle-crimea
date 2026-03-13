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
  const { register, unregister } = useHeader();

  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  // Автоплей - только для мобилки
  useEffect(() => {
    if (!isMobile) return;
    if (paused) return;
    
    const id = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % REVIEWS.length);
    }, 4000);
    
    return () => clearInterval(id);
  }, [paused, isMobile]);

  // Переключение слайда
  const goToSlide = (index: number) => {
    if (index === currentIndex) return;
    setPaused(true);
    setCurrentIndex(index);
    setTimeout(() => setPaused(false), 5000);
  };

  const nextSlide = () => {
    setPaused(true);
    setCurrentIndex(prev => (prev + 1) % REVIEWS.length);
    setTimeout(() => setPaused(false), 5000);
  };

  const prevSlide = () => {
    setPaused(true);
    setCurrentIndex(prev => (prev - 1 + REVIEWS.length) % REVIEWS.length);
    setTimeout(() => setPaused(false), 5000);
  };

  return (
    <section
      ref={sectionRef}
      className={`rf-section ${visible ? 'rf-visible' : ''} ${isMobile ? 'rf-mobile' : 'rf-desktop'}`}
    >
      {/* Контейнер отзывов */}
      <div className={`rf-container ${isMobile ? 'rf-container-mobile' : 'rf-container-desktop'}`}>
        <h2 className="rf-title">Отзывы наших гостей</h2>

        {isMobile ? (
  /* Мобильная версия - два слайда */
  <div className="rf-mobile-layout">
    {/* Вертикальная навигация слева */}
    <div className="rf-mobile-nav">
      {REVIEWS.map((_, idx) => (
        <button
          key={idx}
          className={`rf-mobile-nav-item ${idx === currentIndex ? 'rf-mobile-nav-active' : ''}`}
          onClick={() => {
            setPaused(true);
            setCurrentIndex(idx);
            setTimeout(() => setPaused(false), 5000);
          }}
          aria-label={`Перейти к отзыву ${idx + 1}`}
        />
      ))}
    </div>

    {/* Слайды */}
    <div className="rf-mobile-slides">
      {/* Текущий слайд (сверху) */}
      <div className="rf-mobile-slide rf-mobile-slide-current">
        <div className="rf-card rf-card-center">
          <p className="rf-card-text">{REVIEWS[currentIndex].text}</p>
          <div className="rf-card-author">{REVIEWS[currentIndex].author}</div>
        </div>
      </div>

      {/* Следующий слайд (снизу) */}
      <div className="rf-mobile-slide rf-mobile-slide-next">
        <div 
          className="rf-card rf-card-side"
          onClick={() => {
            const nextIndex = (currentIndex + 1) % REVIEWS.length;
            setPaused(true);
            setCurrentIndex(nextIndex);
            setTimeout(() => setPaused(false), 5000);
          }}
        >
          <p className="rf-card-text">{REVIEWS[(currentIndex + 1) % REVIEWS.length].text}</p>
          <div className="rf-card-author">{REVIEWS[(currentIndex + 1) % REVIEWS.length].author}</div>
        </div>
      </div>
    </div>
  </div>
) : (
          /* Десктоп версия */
          <>
            <div className="rf-slider">
              <div className="rf-track">
                {[
                  (currentIndex - 1 + REVIEWS.length) % REVIEWS.length,
                  currentIndex,
                  (currentIndex + 1) % REVIEWS.length
                ].map((idx, position) => (
                  <div 
                    className={`rf-card ${position === 1 ? 'rf-card-center' : position === 0 ? 'rf-card-prev' : 'rf-card-next'}`}
                    key={`${REVIEWS[idx].author}-${idx}`}
                    onClick={() => {
                      if (position === 0) {
                        setPaused(true);
                        setCurrentIndex(idx);
                        setTimeout(() => setPaused(false), 3000);
                      } else if (position === 2) {
                        setPaused(true);
                        setCurrentIndex(idx);
                        setTimeout(() => setPaused(false), 3000);
                      }
                    }}
                  >
                    <p className="rf-card-text">{REVIEWS[idx].text}</p>
                    <div className="rf-card-author">{REVIEWS[idx].author}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

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