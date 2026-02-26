'use client';

import { useState, useEffect } from 'react';

export default function TelegramSettings() {
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [currentSettings, setCurrentSettings] = useState<any>(null);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/telegram/status');
      const data = await res.json();
      if (data.configured) {
        setCurrentSettings(data);
        setChatId(data.chatId);
      }
    } catch (error) {
      console.error('Failed to check status:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/telegram/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken, chatId }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage('✅ Telegram бот успешно настроен! Проверьте тестовое сообщение.');
        setBotToken('');
        checkStatus();
      } else {
        setStatus('error');
        setMessage(`❌ Ошибка: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setStatus('error');
      setMessage('❌ Ошибка при настройке');
    }
  };

  return (
    <div className="telegram-settings">
      <h2>Настройки Telegram бота</h2>
      
      {currentSettings && (
        <div className="current-settings">
          <h3>Текущие настройки:</h3>
          <p>✅ Бот активен</p>
          <p>Chat ID: {currentSettings.chatId}</p>
          {currentSettings.botInfo && (
            <p>Бот: @{currentSettings.botInfo.username}</p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="settings-form">
        <div className="form-group">
          <label>Bot Token:</label>
          <input
            type="text"
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            placeholder="7234567890:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw"
            required
          />
          <small>Получите у @BotFather в Telegram</small>
        </div>

        <div className="form-group">
          <label>Chat ID:</label>
          <input
            type="text"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder="123456789"
            required
          />
          <small>Ваш Telegram ID (можно узнать через @userinfobot)</small>
        </div>

        {message && (
          <div className={`message ${status}`}>{message}</div>
        )}

        <button 
          type="submit" 
          disabled={status === 'loading'}
          className="submit-btn"
        >
          {status === 'loading' ? '⏳ Сохранение...' : '💾 Сохранить настройки'}
        </button>
      </form>
    </div>
  );
}
