'use client';

import { useEffect } from 'react';

/**
 * Навешивает IntersectionObserver на все элементы с классом .np-reveal.
 * Элементы уже во viewport при монтировании — становятся видимыми немедленно.
 * Элементы ниже fold — анимируются при появлении.
 */
export default function NewsReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>('.np-reveal');
    if (!elements.length) return;

    /* Прячет блоки только этот класс, и вешает его сам скрипт. Без JS
       страница отдаётся видимой целиком: раньше .np-reveal стоял с
       opacity:0 в самой вёрстке, и робот, не исполняющий скрипты, видел
       пустую страницу. Яндекс делает это не всегда. */
    document.documentElement.classList.add('np-anim');

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

    // Немедленно активируем элементы в зоне видимости
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        el.classList.add('visible');
      } else {
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
