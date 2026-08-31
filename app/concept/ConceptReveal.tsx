'use client';

import { useEffect } from 'react';

/**
 * Навешивает IntersectionObserver на элементы с классом .cp-reveal.
 * Элементы в viewport при монтировании — становятся видимыми немедленно.
 */
export default function ConceptReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>('.cp-reveal');
    if (!elements.length) return;

    /* Прячет блоки только этот класс, и вешает его сам скрипт. Без JS
       страница отдаётся видимой целиком: раньше .cp-reveal стоял с
       opacity:0 в самой вёрстке, и робот, не исполняющий скрипты, видел
       пустую страницу. Яндекс делает это не всегда. */
    document.documentElement.classList.add('cp-anim');

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
