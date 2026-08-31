'use client';

import { useEffect } from 'react';

/**
 * Появление блоков по скроллу для .pu-reveal.
 *
 * Прятать содержимое умеет только сам скрипт: класс .pu-anim вешается здесь,
 * и лишь под ним CSS обнуляет прозрачность. Без JS страница отдаётся видимой
 * целиком — это гео-посадочная, она существует ради текста, и текст не должен
 * зависеть от того, исполнил ли робот скрипты. Яндекс делает это не всегда.
 *
 * Всё, что уже в зоне видимости на монтировании, показываем в том же тике —
 * иначе первый экран мигнёт пустотой.
 */
export default function PuReveal() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.pu-page');
    const elements = document.querySelectorAll<HTMLElement>('.pu-reveal');
    if (!root || !elements.length) return;

    root.classList.add('pu-anim');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );

    elements.forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight) {
        el.classList.add('visible');
      } else {
        observer.observe(el);
      }
    });

    return () => {
      observer.disconnect();
      root.classList.remove('pu-anim');
    };
  }, []);

  return null;
}
