'use client';

import { useEffect, useState } from 'react';
import TelegramSettings from '@/components/admin/TelegramSettings';

export default function SettingsPage() {
  return (
    <div className="admin-page">
      <h1 className="admin-title">Настройки</h1>

      <div className="settings-section">
        <h2>Telegram уведомления</h2>
        <TelegramSettings />
      </div>

      <div className="settings-section">
        <h2>Общие настройки</h2>
        <div className="admin-form-card">
          <div className="form-group">
            <label>Название сайта</label>
            <input type="text" defaultValue="Life Style Crimea" />
          </div>
          <div className="form-group">
            <label>Email для уведомлений</label>
            <input type="email" defaultValue="admin@lovelifestyle.ru" />
          </div>
          <button className="admin-button primary">Сохранить</button>
        </div>
      </div>
    </div>
  );
}