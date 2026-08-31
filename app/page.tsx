'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import Hero from '@/components/Hero';
import PanoramaViewer from '@/components/PanoramaViewer';
import Reviews from '@/components/reviews';
import { LoadingScreen } from '@/components/LoadingScreen';

function resetHomeScroll() {
  window.scrollTo(0, 0);
  const main = document.querySelector('.main-container');
  if (main instanceof HTMLElement) main.scrollTop = 0;
}

export default function HomePage() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mountKey, setMountKey] = useState(() => Date.now());

  const mainContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      node.scrollTop = 0;
      window.scrollTo(0, 0);
    }
  }, []);

  // Если пользователь ушёл на /apartments/[id] и потом вернулся на '/',
  // иногда часть DOM/состояния может сохраняться (особенно на мобилках и в bfcache).
  // Поэтому жёстко пересоздаём сцены через mountKey при переходе обратно на '/'.
  const prevPathRef = useRef<string | null>(null);
  useEffect(() => {
    const prev = prevPathRef.current;
    prevPathRef.current = pathname;

    if (pathname === '/' && prev && prev !== '/') {
      setMountKey(Date.now());
      const main = document.querySelector('.main-container');
      if (main instanceof HTMLElement) {
        main.scrollTop = 0;
      }
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  // Держим лоад-скрин, пока реально не загрузится ПЕРВАЯ картинка hero.
  // Ждём только «начало» (первый экран), а не весь сайт. С минимальным
  // временем показа (не мельтешит) и страховочным максимумом (не зависает).
  useEffect(() => {
    let done = false;
    const start = Date.now();
    const MIN_MS = 700;
    const MAX_MS = 5000;

    const finish = () => {
      if (done) return;
      done = true;
      const elapsed = Date.now() - start;
      window.setTimeout(() => setIsLoading(false), Math.max(0, MIN_MS - elapsed));
    };

    const maxTimer = window.setTimeout(finish, MAX_MS);

    fetch('/api/hero-slides')
      .then((r) => (r.ok ? r.json() : []))
      .then((slides: Array<{ image_url: string; media_type: string; is_active: number; sort_order: number }>) => {
        const active = Array.isArray(slides)
          ? slides.filter((s) => s.is_active === 1).sort((a, b) => a.sort_order - b.sort_order)
          : [];
        const first = active[0];
        // Нет слайдов / видео / нет url — не ждём картинку, считаем готовым
        if (!first || first.media_type === 'video' || !first.image_url) {
          finish();
          return;
        }
        const img = new window.Image();
        img.onload = finish;
        img.onerror = finish;
        img.src = first.image_url;
        if (img.complete) finish(); // уже в кэше
      })
      .catch(finish);

    return () => window.clearTimeout(maxTimer);
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) resetHomeScroll();
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  // visibilitychange намеренно не сбрасывает скролл и не пересоздаёт компоненты:
  // пользователь мог уйти в другую вкладку с середины страницы и ожидает вернуться туда же.

  return (
    <>
      
      <AnimatePresence mode="wait">
        {isLoading && <LoadingScreen />}
      </AnimatePresence>

      <div 
        ref={mainContainerRef}
        className={`main-container ${isMobile ? 'mobile' : 'desktop'}`}
      >
        {/* Сцена 1 - Hero */}
        <section className="scene scene--hero">
          {/* Единственный H1 страницы, и он обязан быть в серверном HTML.
              Внутри Hero его держать нельзя: там useState(true) на loading,
              на сервере компонент уходит в ранний return со спиннером, и до
              разметки заголовок не доезжает вообще — робот получал главную
              без H1 совсем. Подпись слайда на эту роль всё равно не годится:
              её ставит менеджер в админке («Стиль Жизни с любовью...»), и она
              не говорит ни про город, ни про то, что здесь сдают.
              Видимой вёрстки не трогаем — экран отдан сцене, — но страница
              наконец называет себя и для робота, и для скринридера. */}
          <h1 className="visually-hidden">
            Апартаменты в Алуште у моря — апарт-отель «Стиль Жизни» в Профессорском уголке
          </h1>
          <Hero key={`hero-${mountKey}`} />
        </section>

        {/* Спейсер между Hero и Panorama (только на десктопе) */}
        {!isMobile && <div className="scene-spacer" />}

        {/* Сцена 2 - Panorama */}
        <section className="scene scene--panorama">
          <PanoramaViewer key={`panorama-${mountKey}`} />
        </section>

        {/* Спейсер между Panorama и Reviews (только на десктопе) */}
        {!isMobile && <div className="scene-spacer" />}

        {/* Сцена 3 - Отзывы + Футер */}
        <section className="scene scene--reviews-footer">
          <Reviews key={`reviews-${mountKey}`} />
        </section>
      </div>
    </>
  );
}