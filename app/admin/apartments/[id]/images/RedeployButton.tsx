'use client';

import { useState } from 'react';

interface RedeployButtonProps {
  apartmentId: string;
}

export default function RedeployButton({ apartmentId }: RedeployButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleRedeploy = async () => {
    if (!confirm('Перезапустить приложение для применения новых фото?\nЭто займет несколько секунд.')) {
      return;
    }

    setLoading(true);
    setMessage('Перезапуск...');

    try {
      const res = await fetch(`/api/rebuild?apartmentId=${apartmentId}`, {
        method: 'POST',
      });

      if (res.ok) {
        setMessage('✅ Готово! Страница обновится...');
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setMessage('❌ Ошибка');
      }
    } catch (error) {
      setMessage('❌ Ошибка');
      console.error(error);
    } finally {
      setTimeout(() => setLoading(false), 3000);
    }
  };

  return (
    <div className="redeploy-container">
      <button
        onClick={handleRedeploy}
        disabled={loading}
        className="redeploy-button"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 4v6h-6" />
          <path d="M1 20v-6h6" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
        {loading ? message : '🔄 Применить новые фото'}
      </button>
      
      <p className="redeploy-hint">
        Если новые фото не отображаются, нажмите эту кнопку
      </p>

      <style jsx>{`
        .redeploy-container {
          margin: 20px 0;
          padding: 16px;
          background: #f0f9ff;
          border-radius: 12px;
          border: 1px solid #bae6fd;
        }
        
        .redeploy-button {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 24px;
          background: linear-gradient(135deg, #139ab6, #0f7a91);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .redeploy-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(19, 154, 182, 0.4);
        }
        
        .redeploy-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .redeploy-hint {
          margin: 12px 0 0 0;
          font-size: 13px;
          color: #0369a1;
        }
      `}</style>
    </div>
  );
}