'use client';

import { useSofiaChatStatus } from './SofiaChatContext';

/**
 * Подсказка под подзаголовком и запасной блок, если виджет не открылся.
 *
 * Сам опрос DOM и клик по кнопке виджета живут в SofiaChatContext — здесь
 * только чтение готового статуса, чтобы не заводить второй таймер рядом
 * с бейджем (см. SofiaBadge.tsx).
 */
export default function SofiaOpenChat() {
  const status = useSofiaChatStatus();

  if (status !== 'failed') {
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
