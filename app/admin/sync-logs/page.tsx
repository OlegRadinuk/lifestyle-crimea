'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type SyncStats = {
  total: number;
  successful: number;
  failed: number;
  lastSync: string | null;
  blockedFuture: number;
};

type SyncLog = {
  id: number;
  source: string;
  last_sync: string;
  status: string;
  message: string;
  created_at: string;
};

export default function SyncLogsPage() {
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [dbLogs, setDbLogs] = useState<SyncLog[]>([]);
  const [fileLogs, setFileLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('db');
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    fetchLogs();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchLogs, 30000); // каждые 30 сек
    }
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/admin/sync-logs?lines=100');
      const data = await res.json();
      setStats(data.stats);
      setDbLogs(data.dbLogs);
      setFileLogs(data.fileLogs);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <span className="badge success">✅ Успешно</span>;
      case 'error':
        return <span className="badge error">❌ Ошибка</span>;
      default:
        return <span className="badge warning">⏳ {status}</span>;
    }
  };

  if (loading) {
    return <div className="admin-loading">Загрузка логов...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">📋 Логи синхронизации Travelline</h1>
        <div className="header-controls">
          <label className="auto-refresh">
            <input 
              type="checkbox" 
              checked={autoRefresh} 
              onChange={(e) => setAutoRefresh(e.target.checked)} 
            />
            Автообновление (30с)
          </label>
          <button onClick={fetchLogs} className="admin-button">
            🔄 Обновить
          </button>
        </div>
      </div>

      {/* Статистика */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Всего синхронизаций</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-value">{stats.successful}</div>
              <div className="stat-label">Успешных</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">❌</div>
            <div className="stat-content">
              <div className="stat-value">{stats.failed}</div>
              <div className="stat-label">Ошибок</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <div className="stat-value">{stats.blockedFuture}</div>
              <div className="stat-label">Будущих броней</div>
            </div>
          </div>
        </div>
      )}

      {/* Информация о последней синхронизации */}
      {stats?.lastSync && (
        <div className="last-sync-info">
          <span className="label">Последняя синхронизация:</span>
          <span className="value">{formatDate(stats.lastSync)}</span>
        </div>
      )}

      {/* Табы */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'db' ? 'active' : ''}`}
          onClick={() => setActiveTab('db')}
        >
          📊 Логи из БД
        </button>
        <button 
          className={`tab ${activeTab === 'file' ? 'active' : ''}`}
          onClick={() => setActiveTab('file')}
        >
          📝 Файловые логи
        </button>
      </div>

      {/* Контент табов */}
      <div className="tab-content">
        {activeTab === 'db' && (
          <div className="db-logs">
            {dbLogs.length === 0 ? (
              <p className="no-data">Нет записей в логах</p>
            ) : (
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>Время</th>
                    <th>Статус</th>
                    <th>Результат</th>
                  </tr>
                </thead>
                <tbody>
                  {dbLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{formatDate(log.last_sync)}</td>
                      <td>{getStatusBadge(log.status)}</td>
                      <td className="log-message">{log.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'file' && (
          <div className="file-logs">
            {fileLogs.length === 0 ? (
              <p className="no-data">Файл лога пуст или не найден</p>
            ) : (
              <pre className="log-pre">
                {fileLogs.map((line, i) => (
                  <div key={i} className="log-line">{line}</div>
                ))}
              </pre>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 15px;
        }
        .header-controls {
          display: flex;
          gap: 15px;
          align-items: center;
        }
        .auto-refresh {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #64748b;
          font-size: 14px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }
        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .stat-icon {
          font-size: 32px;
          width: 60px;
          height: 60px;
          background: #f0f9ff;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stat-content {
          flex: 1;
        }
        .stat-value {
          font-size: 28px;
          font-weight: 600;
          color: #1a2634;
          line-height: 1.2;
        }
        .stat-label {
          color: #64748b;
          font-size: 14px;
        }
        .last-sync-info {
          background: #f8fafc;
          padding: 15px 20px;
          border-radius: 8px;
          margin-bottom: 30px;
          border-left: 4px solid #139ab6;
        }
        .last-sync-info .label {
          color: #64748b;
          margin-right: 10px;
        }
        .last-sync-info .value {
          font-weight: 600;
          color: #1a2634;
        }
        .tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 10px;
        }
        .tab {
          padding: 8px 16px;
          border: none;
          background: none;
          font-size: 16px;
          color: #64748b;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s;
        }
        .tab:hover {
          background: #f1f5f9;
          color: #1a2634;
        }
        .tab.active {
          background: #139ab6;
          color: white;
        }
        .tab-content {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .logs-table {
          width: 100%;
          border-collapse: collapse;
        }
        .logs-table th {
          text-align: left;
          padding: 12px;
          background: #f8fafc;
          color: #475569;
          font-weight: 600;
          font-size: 14px;
        }
        .logs-table td {
          padding: 12px;
          border-bottom: 1px solid #e2e8f0;
        }
        .badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
        .badge.success {
          background: #d1fae5;
          color: #065f46;
        }
        .badge.error {
          background: #fee2e2;
          color: #991b1b;
        }
        .badge.warning {
          background: #fff3cd;
          color: #856404;
        }
        .log-message {
          font-family: monospace;
          font-size: 13px;
          max-width: 500px;
          overflow-x: auto;
        }
        .file-logs {
          max-height: 600px;
          overflow-y: auto;
        }
        .log-pre {
          margin: 0;
          font-family: monospace;
          font-size: 12px;
          line-height: 1.5;
          color: #334155;
        }
        .log-line {
          padding: 2px 0;
          border-bottom: 1px solid #f1f5f9;
          white-space: pre-wrap;
          word-break: break-all;
        }
        .log-line:hover {
          background: #f8fafc;
        }
        .no-data {
          text-align: center;
          color: #94a3b8;
          padding: 40px;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}