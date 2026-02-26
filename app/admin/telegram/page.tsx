'use client';

import TelegramSettings from '@/components/admin/TelegramSettings';

export default function TelegramAdminPage() {
  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Настройки уведомлений</h1>
      </div>
      <TelegramSettings />
    </div>
  );
}
