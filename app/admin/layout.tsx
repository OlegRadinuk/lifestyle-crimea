'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Проверка авторизации
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

  // На странице логина показываем только контент
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!isAuthorized) {
    return null;
  }

  const menuItems = [
    { href: '/admin', label: 'Дашборд', icon: '📊' },
    { href: '/admin/apartments', label: 'Апартаменты', icon: '🏢' },
    { href: '/admin/bookings', label: 'Бронирования', icon: '📋' },
    { href: '/admin/calendar', label: 'Календарь', icon: '📅' },
    { href: '/admin/settings', label: 'Настройки', icon: '⚙️' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    router.push('/admin/login');
  };

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="admin-sidebar-header">
          {!collapsed ? (
            <h2>Lifestyle Admin</h2>
          ) : (
            <h2 style={{ fontSize: '14px', writingMode: 'vertical-rl' }}>Админ</h2>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="admin-sidebar-toggle">
            {collapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="admin-nav">
  {menuItems.map((item) => {
    const isActive = pathname === item.href || 
      (item.href !== '/admin' && pathname.startsWith(item.href + '/'));
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`admin-nav-item ${isActive ? 'active' : ''}`}
        title={collapsed ? item.label : undefined}
      >
        <span className="admin-nav-icon">{item.icon}</span>
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );
  })}
</nav>

        <div className="admin-sidebar-footer">
          <button onClick={handleLogout} className="admin-nav-item">
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