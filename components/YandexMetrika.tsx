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

    /* Первый хит шлёт сама Метрика — ssr:true здесь стоять НЕ должен.
       Он глушит автоматический хит в расчёте на то, что приложение пошлёт
       его само, а мы этого не делаем: строкой ниже lastUrl приравнивается
       текущему адресу, и эффект на pathname выходит по раннему return.
       Замерено на живом счётчике, одинаковый код, разница только в флаге:
       без ssr — 2 запроса к /watch, с ssr — ноль. Визит без переходов по
       сайту не записывался вообще.
       Дубля первого хита при этом не будет: тот же ранний return его и
       съедает, для того lastUrl и выставляется. */
    window.ym(YM_ID, 'init', {
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
