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
  const { register, unregister } = useHeader();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!sectionRef.current) return;

    const id = 'reviews';

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          register(id, { mode: 'dark', priority: 3 });
          setVisible(true);
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

  return (
    <section ref={sectionRef} className="reviews">
      <div className="reviews__content">
        <h2 className="reviews__title">
          Отзывы гостей
        </h2>

        <div className="reviews__grid">
          {REVIEWS.map((review, i) => (
            <div 
              key={i} 
              className="review-card"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <p className="review-card__text">{review.text}</p>
              <div className="review-card__author">{review.author}</div>
            </div>
          ))}
        </div>

        <a
  className="reviews__yandex"
  href="https://yandex.ru/maps/org/stil_zhizni/82645925123/"
  target="_blank"
  rel="noopener noreferrer"
>
  Все отзывы на Яндекс Картах
</a>
      </div>
    </section>
  );
}