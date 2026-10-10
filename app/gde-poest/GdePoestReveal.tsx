'use client';

import { useEffect } from 'react';

/**
 * Навешивает IntersectionObserver на элементы с классом .gp-reveal.
 * Элементы в viewport при монтировании — становятся видимыми немедленно.
 *
 * ВАЖНО (та же причина, что в ServicesReveal): класс gp-anim вешается сам
 * скрипт на documentElement. Без JS страница отдаётся видимой целиком —
 * .gp-anim .gp-reveal { opacity: 0 } активируется только после загрузки
 * скрипта. Если прописать opacity:0 прямо в разметке, робот Яндекса, не
 * исполняющий JS, увидит пустую страницу.
 */
export default function GdePoestReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>('.gp-reveal');
    if (!elements.length) return;

    document.documentElement.classList.add('gp-anim');

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

    return () => {
      observer.disconnect();
      document.documentElement.classList.remove('gp-anim');
    };
  }, []);

  return null;
}
