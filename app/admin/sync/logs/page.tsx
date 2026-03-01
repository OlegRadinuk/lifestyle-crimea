'use client';

import { useEffect, useState } from 'react';

export default function SyncLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    const res = await fetch('/api/admin/sync/logs');
    const data = await res.json();
    setLogs(data);
    setLoading(false);
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="admin-page">
      <h1 className="admin-title">Логи синхронизации</h1>

      <div className="logs-table">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Время</th>
              <th>Источник</th>
              <th>Действие</th>
              <th>Статус</th>
              <th>Событий</th>
              <th>Ошибка</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log: any) => (
              <tr key={log.id}>
                <td>{new Date(log.created_at).toLocaleString()}</td>
                <td>{log.source_name}</td>
                <td>{log.action === 'import' ? 'Импорт' : 'Экспорт'}</td>
                <td>
                  <span className={`status-badge ${log.status}`}>
                    {log.status === 'success' ? '✓ Успех' : '✗ Ошибка'}
                  </span>
                </td>
                <td>{log.events_count || 0}</td>
                <td className="error-message">{log.error_message || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}