'use client';

import { useEffect, useRef } from 'react';

export function useSmoothScroll() {
  const currentSectionRef = useRef(0);
  const isScrollingRef = useRef(false);
  const touchStartRef = useRef(0);
  const touchEndRef = useRef(0);
  const sectionsRef = useRef<HTMLElement[]>([]);
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Находим все секции
    containerRef.current = document.querySelector('.frame') as HTMLElement;
    sectionsRef.current = Array.from(document.querySelectorAll('.layer'));
    
    if (sectionsRef.current.length === 0) return;

    // Определяем текущую секцию при загрузке
    const findCurrentSection = () => {
      const scrollPosition = window.scrollY;
      for (let i = 0; i < sectionsRef.current.length; i++) {
        const section = sectionsRef.current[i];
        const offsetTop = section.offsetTop;
        const offsetBottom = offsetTop + section.offsetHeight;
        
        if (scrollPosition >= offsetTop - 100 && scrollPosition < offsetBottom - 100) {
          currentSectionRef.current = i;
          break;
        }
      }
    };
    
    findCurrentSection();

    // Обработчик колесика мыши
    const handleWheel = (e: WheelEvent) => {
      // На мобильных не блокируем нативный скролл
      if (window.innerWidth <= 768) return;
      
      e.preventDefault();
      
      if (isScrollingRef.current) return;
      
      const delta = e.deltaY;
      const direction = delta > 0 ? 1 : -1;
      const nextSection = currentSectionRef.current + direction;
      
      if (nextSection >= 0 && nextSection < sectionsRef.current.length) {
        isScrollingRef.current = true;
        currentSectionRef.current = nextSection;
        
        const targetSection = sectionsRef.current[nextSection];
        
        window.scrollTo({
          top: targetSection.offsetTop,
          behavior: 'smooth'
        });
        
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 800);
      }
    };

    // Обработчики для мобильных
    const handleTouchStart = (e: TouchEvent) => {
      if (window.innerWidth > 768) return;
      touchStartRef.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (window.innerWidth > 768) return;
      touchEndRef.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (window.innerWidth > 768) return;
      if (isScrollingRef.current) return;
      
      const diff = touchStartRef.current - touchEndRef.current;
      const minSwipeDistance = 40; // Чувствительность свайпа
      
      if (Math.abs(diff) > minSwipeDistance) {
        const direction = diff > 0 ? 1 : -1;
        const nextSection = currentSectionRef.current + direction;
        
        if (nextSection >= 0 && nextSection < sectionsRef.current.length) {
          isScrollingRef.current = true;
          currentSectionRef.current = nextSection;
          
          const targetSection = sectionsRef.current[nextSection];
          
          window.scrollTo({
            top: targetSection.offsetTop,
            behavior: 'smooth'
          });
          
          setTimeout(() => {
            isScrollingRef.current = false;
          }, 600);
        }
      }
      
      touchStartRef.current = 0;
      touchEndRef.current = 0;
    };

    // Добавляем обработчики
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return null;
}