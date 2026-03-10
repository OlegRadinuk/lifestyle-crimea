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

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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
      `}</style>
    </div>
  );
}