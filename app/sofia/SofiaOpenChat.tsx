'use client';

import { useEffect, useState } from 'react';

/**
 * Автоматически открывает чат с Софией на этой странице.
 *
 * Виджет — сторонний скрипт (optisphere.tech/widget.js, подключён в
 * app/layout.tsx для всего сайта), у него нет своего API для программного
 * открытия и нет события «я готов». Единственный публичный хук —
 * кнопка #opsph-btn: клик по ней и есть штатное открытие (widget.js делает
 * ровно то же самое по клику пользователя). Поэтому ждём её появления в DOM
 * и кликаем один раз сами — это тот же путь, каким открывает виджет живой
 * человек, а не обход его логики.
 *
 * Если кнопка не появилась за 8 секунд — скрипт заблокирован адблокером
 * или не догрузился. Показываем обычные контакты вместо вечного ожидания.
 *
 * Живёт внутри тёмной героя-сцены (фото + затемнение), поэтому и подсказка,
 * и запасной блок стилизованы под светлый текст на тёмном фоне.
 */
export default function SofiaOpenChat() {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let opened = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 40; // 40 × 200мс = 8с

    const timer = window.setInterval(() => {
      attempts += 1;
      const btn = document.querySelector<HTMLButtonElement>('#opsph-btn');

      if (btn && !opened) {
        opened = true;
        window.clearInterval(timer);
        btn.click();
        return;
      }

      if (attempts >= MAX_ATTEMPTS) {
        window.clearInterval(timer);
        if (!opened) setFailed(true);
      }
    }, 200);

    return () => window.clearInterval(timer);
  }, []);

  if (!failed) {
    return (
      <p className="sofia-hint">Чат откроется сам — обычно за несколько секунд.</p>
    );
  }

  return (
    <div className="sofia-fallback" role="alert">
      <p className="sofia-fallback-title">Чат сейчас не открылся</p>
      <p className="sofia-fallback-text">
        Возможно, его блокирует расширение в браузере. Напишите напрямую — ответим так же
        быстро.
      </p>
      <div className="sofia-fallback-actions">
        <a href="https://wa.me/79785036363" className="lp-btn lp-btn-primary" target="_blank" rel="noopener noreferrer">
          WhatsApp
        </a>
        <a href="https://t.me/lifestylecrimea" className="lp-btn lp-btn-ghost" target="_blank" rel="noopener noreferrer">
          Telegram
        </a>
      </div>
    </div>
  );
}
