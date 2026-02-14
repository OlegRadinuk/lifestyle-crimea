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

  const { register, unregister } = useHeader();

  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const slides = [...REVIEWS, ...REVIEWS, ...REVIEWS];
  const VISIBLE = 3;

  /* ===== HEADER MODE (DARK) ===== */
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

  /* ===== intersection animation ===== */
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  /* ===== autoplay ===== */
  useEffect(() => {
    if (paused) return;

    const id = setInterval(() => {
      setIndex(i => i + 1);
    }, 5000);

    return () => clearInterval(id);
  }, [paused]);

  /* ===== translate ===== */
  useEffect(() => {
    if (!trackRef.current) return;

    const slideWidth = trackRef.current.clientWidth / VISIBLE;
    trackRef.current.style.transform = `translateX(-${index * slideWidth}px)`;

    if (index >= REVIEWS.length * 2) {
      setTimeout(() => {
        trackRef.current!.style.transition = 'none';
        setIndex(REVIEWS.length);
        requestAnimationFrame(() => {
          trackRef.current!.style.transition = 'transform 0.6s ease';
        });
      }, 600);
    }
  }, [index]);

  return (
    <section
      ref={sectionRef}
      className={`reviews ${visible ? 'is-visible' : ''}`}
    >
      <h2 className="reviews__title">
        Отзывы гостей о комплексе апартаментов «Стиль Жизни»
      </h2>

      <div
        className="reviews__outer"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <button
          className="reviews__arrow reviews__arrow--left"
          onClick={() => setIndex(i => i - 1)}
        >
          ‹
        </button>

        <div className="reviews__viewport">
          <div className="reviews__track" ref={trackRef}>
            {slides.map((r, i) => (
              <div className="review-card" key={i}>
                <p className="review-card__text">{r.text}</p>
                <div className="review-card__author">{r.author}</div>
              </div>
            ))}
          </div>
        </div>

        <button
          className="reviews__arrow reviews__arrow--right"
          onClick={() => setIndex(i => i + 1)}
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
    </section>
  );
}
