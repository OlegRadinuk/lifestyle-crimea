'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  YM_ID,
  CONSENT_EVENT,
  analyticsAllowed,
  hit,
  reachGoal,
  type YmFn,
} from '@/lib/analytics';

const TAG_SRC = 'https://mc.yandex.ru/metrika/tag.js';

/* Счётчик Метрики.
 *
 * Грузится только после согласия — своего или пришедшего событием от баннера,
 * поэтому обычный <Script> здесь не подходит: момент загрузки неизвестен на
 * рендере. Инжектим скрипт руками.
 *
 * init идёт с defer:true — иначе Метрика сама шлёт первый хит, и на смене
 * маршрута мы получаем его второй раз. Все хиты шлём отсюда. */
export default function YandexMetrika() {
  const pathname = usePathname();
  const loaded = useRef(false);
  const lastUrl = useRef<string | null>(null);

  const load = useCallback(() => {
    if (loaded.current || !YM_ID || typeof window === 'undefined') return;
    loaded.current = true;

    if (!window.ym) {
      /* Дословно как в официальном сниппете: в очередь кладём arguments.
         Массив здесь не работает — tag.js такую очередь не разбирает,
         счётчик грузится, но не инициализируется. */
      const stub = function (this: unknown) {
        // eslint-disable-next-line prefer-rest-params
        (stub.a = stub.a || []).push(arguments);
      } as YmFn;
      stub.l = Date.now();
      window.ym = stub;
    }

    const script = document.createElement('script');
    script.src = TAG_SRC;
    script.async = true;
    document.head.appendChild(script);

    /* Без defer: первый хит шлёт сама Метрика. С defer:true и ручным первым
       хитом счётчик не поднимался вовсе — на рабочем сайте с тем же tag.js
       в очереди лежит только init, и этого достаточно. Дубля не будет:
       эффект ниже пропускает первый pathname. */
    window.ym(YM_ID, 'init', {
      ssr: true,
      webvisor: true,
      clickmap: true,
      ecommerce: 'dataLayer',
      accurateTrackBounce: true,
      trackLinks: true,
    });

    lastUrl.current = window.location.href;
  }, []);

  useEffect(() => {
    if (!YM_ID) return;

    if (analyticsAllowed()) load();

    const onConsent = () => {
      if (analyticsAllowed()) load();
    };
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, [load]);

  /* App Router не шлёт хит на клиентской навигации — шлём сами.
     Читаем location, а не useSearchParams: тот требует Suspense вокруг и
     ломает статическую генерацию страниц, которым параметры не нужны. */
  useEffect(() => {
    if (!loaded.current) return;
    const url = window.location.href;
    if (lastUrl.current === url) return;
    hit(url, lastUrl.current ?? undefined);
    lastUrl.current = url;
  }, [pathname]);

  /* Телефоны разбросаны по хедеру, футеру, бургеру и двум страницам —
     один делегированный слушатель вместо правки каждой ссылки.
     capture: клик ловится даже если обработчик выше остановит всплытие. */
  useEffect(() => {
    if (!YM_ID) return;

    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const link = target?.closest?.('a[href^="tel:"]');
      if (link) reachGoal('phone_click');
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}
