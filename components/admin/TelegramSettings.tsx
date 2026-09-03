'use client';

import { useState, useEffect } from 'react';

export default function TelegramSettings() {
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [currentSettings, setCurrentSettings] = useState<any>(null);

  /* Чаты, которые бот уже видел. Нужны, чтобы не искать chat_id группы
     руками через сторонних ботов: у групп он отрицательный и нигде в
     интерфейсе Telegram не показывается. */
  const [chats, setChats] = useState<{ id: string; title: string; type: string; isGroup: boolean }[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);

  const findChats = async () => {
    setChatsLoading(true);
    setMessage('');
    try {
      const qs = botToken ? `?botToken=${encodeURIComponent(botToken)}` : '';
      const res = await fetch(`/api/telegram/chats${qs}`);
      const data = await res.json();
      if (!res.ok) {
        setStatus('error');
        setMessage(`❌ ${data.error}${data.details ? `: ${data.details}` : ''}`);
      } else {
        setChats(data.chats || []);
        if (data.hint) setMessage(`ℹ️ ${data.hint}`);
      }
    } catch {
      setStatus('error');
      setMessage('❌ Не удалось получить список чатов');
    } finally {
      setChatsLoading(false);
    }
  };

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
        const where = data.chat?.title ? ` Чат: «${data.chat.title}».` : '';
        setMessage(`✅ Готово — тестовое сообщение доставлено.${where}`);
        setBotToken('');
        checkStatus();
      } else {
        /* Показываем и причину от Telegram, и человеческую подсказку:
           «chat not found» само по себе ничего не объясняет. */
        setStatus('error');
        setMessage(
          `❌ ${data.error || 'Ошибка'}${data.details ? ` (${data.details})` : ''}`
          + (data.hint ? `\n${data.hint}` : '')
        );
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
            placeholder="123456789 или -1001234567890 для группы"
            required
          />
          <small>
            Личный чат или группа. У групп ID отрицательный — не ищите его руками,
            нажмите «Найти чаты».
          </small>

          <button
            type="button"
            className="tg-find-btn"
            onClick={findChats}
            disabled={chatsLoading}
          >
            {chatsLoading ? 'Ищу…' : '🔍 Найти чаты'}
          </button>

          {chats.length > 0 && (
            <ul className="tg-chats">
              {chats.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => setChatId(c.id)}>
                    <span className="tg-chats__title">
                      {c.isGroup ? '👥 ' : '👤 '}{c.title}
                    </span>
                    <span className="tg-chats__id">{c.id}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <details className="tg-help">
            <summary>Как подключить группу</summary>
            <ol>
              <li>Добавьте бота в группу.</li>
              <li>Напишите в группе любое сообщение — так Telegram покажет её боту.</li>
              <li>Нажмите «Найти чаты» и выберите группу из списка.</li>
              <li>Сохраните настройки — в группу придёт тестовое сообщение.</li>
            </ol>
            <p>
              Если группы нет в списке, проверьте, что бот в ней состоит и ему
              разрешено отправлять сообщения.
            </p>
          </details>
        </div>

        {message && (
          <div className={`message ${status}`} style={{ whiteSpace: 'pre-line' }}>{message}</div>
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
