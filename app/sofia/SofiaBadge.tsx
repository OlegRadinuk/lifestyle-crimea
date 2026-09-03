'use client';

import Image from 'next/image';
import { useSofiaChatStatus } from './SofiaChatContext';

/**
 * Бейдж наверху сцены. Пока идёт попытка открыть чат (до 8с) — пульсирующий
 * логотип и «Открываю чат…», чтобы гость видел: что-то происходит, а не
 * решил, что страница зависла. Как только чат правда открылся — обычный
 * статус «онлайн».
 */
export default function SofiaBadge() {
  const status = useSofiaChatStatus();

  if (status === 'opening') {
    return (
      <span className="sofia-badge sofia-badge--opening">
        <span className="sofia-badge-logo" aria-hidden="true">
          <Image src="/images/logo/logo-white.webp" alt="" width={14} height={14} />
        </span>
        Открываю чат…
      </span>
    );
  }

  return (
    <span className="sofia-badge">
      <span className="sofia-badge-dot" aria-hidden="true" />
      София · онлайн
    </span>
  );
}
