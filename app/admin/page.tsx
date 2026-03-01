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
      });
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
            <div className="stat-label">ICS источников</div>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="dashboard-section">
          <h2>Последние бронирования</h2>
          <Link href="/admin/bookings" className="section-link">Все брони →</Link>
          {/* Таблица последних броней будет здесь */}
        </div>

        <div className="dashboard-section">
          <h2>Ближайшие заезды</h2>
          <Link href="/admin/calendar" className="section-link">Календарь →</Link>
          {/* Список ближайших заездов */}
        </div>
      </div>
    </div>
  );
}