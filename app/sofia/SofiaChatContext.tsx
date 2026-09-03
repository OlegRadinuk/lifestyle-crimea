'use client';

import { createContext, useContext, useEffect, useState } from 'react';

/**
 * Единственное место, где идёт опрос DOM на появление кнопки виджета.
 *
 * Статус нужен в двух местах страницы одновременно: бейдж наверху сцены
 * («открываю чат…» / «онлайн») и подсказка с запасным блоком под
 * подзаголовком. Если бы каждое место опрашивало DOM само — это два
 * независимых таймера и два клика по кнопке виджета вместо одного.
 * Контекст запускает опрос ровно один раз, оба потребителя просто читают
 * готовый статус.
 */

export type SofiaChatStatus = 'opening' | 'opened' | 'failed';

const SofiaChatStatusContext = createContext<SofiaChatStatus>('opening');

export function SofiaChatProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SofiaChatStatus>('opening');

  useEffect(() => {
    let clicked = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 40; // 40 × 200мс = 8с

    const timer = window.setInterval(() => {
      attempts += 1;
      const btn = document.querySelector<HTMLButtonElement>('#opsph-btn');

      if (btn && !clicked) {
        clicked = true;
        window.clearInterval(timer);
        btn.click();
        setStatus('opened');
        return;
      }

      if (attempts >= MAX_ATTEMPTS) {
        window.clearInterval(timer);
        if (!clicked) setStatus('failed');
      }
    }, 200);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <SofiaChatStatusContext.Provider value={status}>{children}</SofiaChatStatusContext.Provider>
  );
}

export function useSofiaChatStatus() {
  return useContext(SofiaChatStatusContext);
}
