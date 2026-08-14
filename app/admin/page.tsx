'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type DashboardStats = {
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  upcomingBookings: number;
  totalRevenue: number;
  apartmentsCount: number;
  activeSources: number;
  // Добавляем новое поле
  bySource?: {
    website: number;
    travelline: number;
  };
};

type BotStats = {
  sessions: number;
  messages: number;
  leads: number;
  active: boolean;
} | null;

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [botStats, setBotStats] = useState<BotStats>(null);
  const [botLoading, setBotLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch('https://optisphere.tech/api/bots/lifestyle-crimea/stats')
      .then(res => {
        if (!res.ok) throw new Error('not ok');
        return res.json();
      })
      .then(data => {
        setBotStats(data);
        setBotLoading(false);
      })
      .catch(() => setBotLoading(false));
  }, []);

  if (loading) return <div className="admin-loading">Загрузка...</div>;

  return (
    <div className="admin-dashboard">
      <h1 className="admin-title">Дашборд</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-value">{stats?.totalBookings || 0}</div>
            <div className="stat-label">Всего броней</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stats?.confirmedBookings || 0}</div>
            <div className="stat-label">Подтверждено</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-value">{stats?.pendingBookings || 0}</div>
            <div className="stat-label">Ожидают</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">{stats?.totalRevenue?.toLocaleString()} ₽</div>
            <div className="stat-label">Выручка</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <div className="stat-value">{stats?.apartmentsCount || 0}</div>
            <div className="stat-label">Апартаментов</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <div className="stat-value">{stats?.activeSources || 0}</div>
            <div className="stat-label">Активных ICS</div>
          </div>
        </div>
      </div>

      {/* Добавляем секцию с источниками */}
      {stats?.bySource && (
        <div className="sources-section">
          <h2>Распределение по источникам</h2>
          <div className="sources-grid">
            <div className="source-card website">
              <div className="source-icon">🌐</div>
              <div className="source-content">
                <div className="source-label">Сайт</div>
                <div className="source-value">{stats.bySource.website}</div>
              </div>
            </div>
            <div className="source-card travelline">
              <div className="source-icon">🔄</div>
              <div className="source-content">
                <div className="source-label">Travelline</div>
                <div className="source-value">{stats.bySource.travelline}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI-ассистент София */}
      <div className="yana-section">
        <h2>AI-ассистент София</h2>
        <div className="yana-card">
          <div className="yana-header">
            <div className="yana-icon">🤖</div>
            <div className="yana-meta">
              <div className="yana-title">София</div>
              {botLoading ? (
                <div className="yana-status loading">Загрузка…</div>
              ) : botStats === null ? (
                <div className="yana-status offline">Нет данных</div>
              ) : (
                <div className={`yana-status ${botStats.active ? 'online' : 'offline'}`}>
                  <span className={`yana-dot ${botStats.active ? 'online' : 'offline'}`} />
                  {botStats.active ? 'Активна' : 'Выкл'}
                </div>
              )}
            </div>
            <a
              href="https://optisphere.tech/aiadmin/lifestyle-crimea"
              target="_blank"
              rel="noopener noreferrer"
              className="yana-link"
            >
              Подробнее →
            </a>
          </div>
          <div className="yana-stats">
            <div className="yana-stat">
              <div className="yana-stat-value">
                {botLoading ? '—' : botStats === null ? '—' : botStats.sessions}
              </div>
              <div className="yana-stat-label">Диалогов</div>
            </div>
            <div className="yana-stat">
              <div className="yana-stat-value">
                {botLoading ? '—' : botStats === null ? '—' : botStats.messages}
              </div>
              <div className="yana-stat-label">Сообщений</div>
            </div>
            <div className="yana-stat">
              <div className="yana-stat-value">
                {botLoading ? '—' : botStats === null ? '—' : botStats.leads}
              </div>
              <div className="yana-stat-label">Заявок</div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="dashboard-section">
          <h2>Последние бронирования</h2>
          <Link href="/admin/bookings" className="section-link">Все брони →</Link>
        </div>

        <div className="dashboard-section">
          <h2>Ближайшие заезды</h2>
          <Link href="/admin/calendar" className="section-link">Календарь →</Link>
        </div>
      </div>

      <style jsx>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
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
        .sources-section {
          margin-bottom: 30px;
        }
        .sources-section h2 {
          font-size: 18px;
          margin-bottom: 16px;
          color: #1e293b;
        }
        .sources-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }
        .source-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .source-card.website {
          border-left: 4px solid #139ab6;
        }
        .source-card.travelline {
          border-left: 4px solid #8b5cf6;
        }
        .source-icon {
          font-size: 28px;
        }
        .source-label {
          color: #64748b;
          font-size: 14px;
        }
        .source-value {
          font-size: 24px;
          font-weight: 600;
          color: #1a2634;
        }
        .dashboard-sections {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
        }
        .dashboard-section {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .dashboard-section h2 {
          font-size: 18px;
          margin-bottom: 16px;
          color: #1e293b;
        }
        .section-link {
          float: right;
          color: #139ab6;
          text-decoration: none;
          font-size: 14px;
        }
        .yana-section {
          margin-bottom: 30px;
        }
        .yana-section h2 {
          font-size: 18px;
          margin-bottom: 16px;
          color: #1e293b;
        }
        .yana-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          border-left: 4px solid #0891b2;
        }
        .yana-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 20px;
        }
        .yana-icon {
          font-size: 28px;
          width: 52px;
          height: 52px;
          background: #f0f9ff;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .yana-meta {
          flex: 1;
        }
        .yana-title {
          font-size: 16px;
          font-weight: 600;
          color: #1a2634;
          line-height: 1.3;
        }
        .yana-status {
          font-size: 13px;
          margin-top: 2px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .yana-status.online {
          color: #16a34a;
        }
        .yana-status.offline {
          color: #94a3b8;
        }
        .yana-status.loading {
          color: #94a3b8;
        }
        .yana-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .yana-dot.online {
          background: #16a34a;
        }
        .yana-dot.offline {
          background: #94a3b8;
        }
        .yana-link {
          color: #0891b2;
          text-decoration: none;
          font-size: 14px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .yana-link:hover {
          text-decoration: underline;
        }
        .yana-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .yana-stat {
          background: #f8fafc;
          border-radius: 8px;
          padding: 14px;
          text-align: center;
        }
        .yana-stat-value {
          font-size: 24px;
          font-weight: 600;
          color: #1a2634;
          line-height: 1.2;
        }
        .yana-stat-label {
          color: #64748b;
          font-size: 13px;
          margin-top: 2px;
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .stat-card {
            padding: 14px;
            gap: 10px;
          }

          .stat-icon {
            font-size: 24px;
            width: 44px;
            height: 44px;
          }

          .stat-value {
            font-size: 22px;
          }

          .sources-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .dashboard-sections {
            grid-template-columns: 1fr;
          }

          .yana-header {
            flex-wrap: wrap;
            gap: 10px;
          }

          .yana-link {
            order: 3;
            width: 100%;
            text-align: right;
          }

          .yana-stats {
            gap: 8px;
          }

          .yana-stat {
            padding: 10px;
          }

          .yana-stat-value {
            font-size: 20px;
          }
        }

        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr 1fr;
          }

          .sources-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}