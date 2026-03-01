'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { href: '/admin', label: '📊 Дашборд', icon: '📊' },
    { href: '/admin/apartments', label: '🏢 Апартаменты', icon: '🏢' },
    { href: '/admin/bookings', label: '📋 Бронирования', icon: '📋' },
    { href: '/admin/calendar', label: '📅 Календарь', icon: '📅' },
    { href: '/admin/sync/sources', label: '🔄 ICS источники', icon: '🔄' },
    { href: '/admin/sync/logs', label: '📝 Логи синхронизации', icon: '📝' },
    { href: '/admin/settings', label: '⚙️ Настройки', icon: '⚙️' },
  ];

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="admin-sidebar-header">
          <h2>Lifestyle Admin</h2>
          <button onClick={() => setCollapsed(!collapsed)} className="admin-sidebar-toggle">
            {collapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="admin-nav">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="admin-nav-icon">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <Link href="/" className="admin-nav-item" target="_blank">
            <span className="admin-nav-icon">🏠</span>
            {!collapsed && <span>На сайт</span>}
          </Link>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-content">{children}</div>
      </main>
    </div>
  );
}