'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Проверка авторизации
  useEffect(() => {
    // Если мы уже на странице логина - пропускаем
    if (pathname === '/admin/login') {
      setIsAuthorized(true);
      return;
    }

    const auth = localStorage.getItem('admin_auth');
    if (auth !== 'true') {
      router.push('/admin/login');
    } else {
      setIsAuthorized(true);
    }
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    router.push('/admin/login');
  };

  // Если не авторизован и не на логине - показываем ничего
  if (!isAuthorized && pathname !== '/admin/login') {
    return null;
  }

  // Если на странице логина - показываем только её
  if (pathname === '/admin/login') {
    return children;
  }

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
          <button onClick={handleLogout} className="admin-nav-item" style={{ width: '100%' }}>
            <span className="admin-nav-icon">🚪</span>
            {!collapsed && <span>Выйти</span>}
          </button>
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