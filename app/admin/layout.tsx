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

  // На странице логина не показываем сайдбар
  if (pathname === '/admin/login') {
    return children;
  }

  const menuItems = [
    { href: '/admin', label: 'Дашборд', icon: '📊' },
    { href: '/admin/apartments', label: 'Апартаменты', icon: '🏢' },
    { href: '/admin/bookings', label: 'Бронирования', icon: '📋' },
    { href: '/admin/calendar', label: 'Календарь', icon: '📅' },
    { href: '/admin/sync/sources', label: 'ICS источники', icon: '🔄' },
    { href: '/admin/sync/logs', label: 'Логи синхронизации', icon: '📝' },
    { href: '/admin/settings', label: 'Настройки', icon: '⚙️' },
  ];

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="admin-sidebar-header">
          <h2>Lifestyle Admin</h2>
          <button onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? '→' : '←'}
          </button>
        </div>
        <nav>
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? 'active' : ''}
            >
              <span>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>
      </aside>
      <main>{children}</main>
    </div>
  );
}