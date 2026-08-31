'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CONSENT_EVENT, CONSENT_KEY, type ConsentValue } from '@/lib/analytics';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) setVisible(true);
  }, []);

  function accept(value: ConsentValue) {
    localStorage.setItem(CONSENT_KEY, value);
    /* Без события Метрика поднялась бы только со следующей загрузки страницы,
       и первый — самый интересный — визит уходил бы мимо статистики. */
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 16,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      backgroundColor: 'rgba(20,20,20,0.92)',
      backdropFilter: 'blur(8px)',
      color: '#f0f0f0',
      padding: '10px 16px',
      borderRadius: 10,
      boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      flexWrap: 'wrap',
      maxWidth: 640,
      width: 'calc(100% - 32px)',
      fontSize: 13,
    }}>
      <span style={{ flex: 1, minWidth: 160, lineHeight: 1.4 }}>
        Мы используем cookies.{' '}
        <Link href="/privacy" style={{ color: '#139AB6' }}>Подробнее</Link>
      </span>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button onClick={() => accept('essential')} style={{
          background: 'transparent',
          color: '#aaa',
          border: '1px solid #444',
          borderRadius: 6,
          padding: '5px 12px',
          fontSize: 12,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}>
          Только нужные
        </button>
        <button onClick={() => accept('all')} style={{
          background: '#139AB6',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          padding: '5px 14px',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}>
          Принять
        </button>
      </div>
    </div>
  );
}
