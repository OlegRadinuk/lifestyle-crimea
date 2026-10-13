'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import '@/app/globals.css';

/* === Иконки сайдбара админки ===
   Монолинейные SVG, viewBox 32, stroke=currentColor, stroke-width=1.5 —
   тот же стиль, что в публичной части (app/services/icons.tsx). Эмодзи здесь
   запрещены (правило заказчика). */

type IconProps = { className?: string };

function IconDashboard({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="4" y="4" width="10" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="18" y="4" width="10" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="4" y="20" width="10" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="18" y="15" width="10" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconBuilding({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="6" y="4" width="20" height="24" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 9h3M18 9h3M11 14h3M18 14h3M11 19h3M18 19h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13 28v-5h6v5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function IconImage({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="4" y="6" width="24" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="13" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 22l7-6 6 5 4-3 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconNews({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M6 6h18a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M26 10h2v14a2 2 0 0 1-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 11h10M10 15h10M10 19h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconBell({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M8 22h16l-2-3V14a6 6 0 1 0-12 0v5l-2 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M13 26a3 3 0 0 0 6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconClipboard({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M8 7h4M20 7h4a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="12" y="4" width="8" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 15h12M10 19h12M10 23h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconSync({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M26 14a10 10 0 0 0-17-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 18a10 10 0 0 0 17 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M22 5v6h-6M10 27v-6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconLogs({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M8 4h12l6 6v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M20 4v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M11 16h10M11 20h10M11 24h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconCalendar({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="4" y="7" width="24" height="21" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 13h24" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 4v6M21 4v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 18h3M15 18h3M20 18h3M10 23h3M15 23h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconLink({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M14 20l-3 3a5 5 0 0 1-7-7l5-5a5 5 0 0 1 7 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 12l3-3a5 5 0 0 1 7 7l-5 5a5 5 0 0 1-7 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 19l6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconGear({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="16" cy="16" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M16 3v3M16 26v3M3 16h3M26 16h3M6.5 6.5l2.1 2.1M23.4 23.4l2.1 2.1M6.5 25.5l2.1-2.1M23.4 8.6l2.1-2.1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconLogout({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M14 6H8a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 10l6 6-6 6M12 16h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconHome({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M5 15L16 5l11 10v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V15z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M13 29v-8h6v8" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

type MenuItem = {
  href: string;
  label: string;
  Icon: React.ComponentType<IconProps>;
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (pathname === '/admin/login' || pathname === '/admin/setup') {
      setIsAuthorized(true);
      return;
    }

    fetch('/api/admin/me').then(res => {
      if (res.ok) {
        setIsAuthorized(true);
      } else {
        router.push('/admin/login');
      }
    }).catch(() => router.push('/admin/login'));
  }, [pathname, router]);

  if (pathname === '/admin/login' || pathname === '/admin/setup') {
    return <>{children}</>;
  }

  if (!isAuthorized) {
    return null;
  }

  const menuItems: MenuItem[] = [
    { href: '/admin', label: 'Дашборд', Icon: IconDashboard },
    { href: '/admin/apartments', label: 'Апартаменты', Icon: IconBuilding },
    { href: '/admin/hero-slides', label: 'Слайды главной', Icon: IconImage },
    { href: '/admin/news', label: 'Новости', Icon: IconNews },
    { href: '/admin/services', label: 'Услуги', Icon: IconBell },
    { href: '/admin/bookings', label: 'Брони (сайт)', Icon: IconClipboard },
    { href: '/admin/travelline-bookings', label: 'Брони (Travelline)', Icon: IconSync },
    { href: '/admin/sync-logs', label: 'Логи синхронизации', Icon: IconLogs },
    { href: '/admin/calendar', label: 'Календарь', Icon: IconCalendar },
    { href: '/admin/apartment-groups', label: 'Связки', Icon: IconLink },
    { href: '/admin/settings', label: 'Настройки', Icon: IconGear },
  ];

  const handleLogout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    router.push('/admin/login');
  };

  return (
    <div className="admin-layout">
      {/* Скрыть виджет Sofia (optisphere) в админке */}
      <style>{`
        #opsph-btn, #opsph-bubble, #opsph-wrap, #opsph-overlay { display: none !important; }
      `}</style>
      {/* Мобильный топ-бар */}
      <div className="admin-mobile-topbar">
        <button
          className="admin-mobile-menu-btn"
          onClick={() => setMobileMenuOpen(true)}
        >
          <svg viewBox="0 0 32 32" width="22" height="22" fill="none" aria-hidden="true">
            <path d="M5 10h22M5 16h22M5 22h22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <span className="admin-mobile-title">Lifestyle Admin</span>
      </div>

      {/* Оверлей при открытом мобильном меню */}
      {mobileMenuOpen && (
        <div
          className="admin-mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="admin-sidebar-header">
          {!collapsed ? (
            <h2>Lifestyle Admin</h2>
          ) : (
            <h2 style={{ fontSize: '14px', writingMode: 'vertical-rl' }}>Админ</h2>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="admin-sidebar-toggle" aria-label={collapsed ? 'Развернуть меню' : 'Свернуть меню'}>
            <svg viewBox="0 0 32 32" width="18" height="18" fill="none" aria-hidden="true">
              {collapsed ? (
                <path d="M12 8l8 8-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M20 8l-8 8 8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </button>
        </div>

        <nav className="admin-nav">
          {menuItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href + '/'));
            const Icon = item.Icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-item ${isActive ? 'active' : ''}`}
                title={collapsed ? item.label : undefined}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="admin-nav-icon">
                  <Icon className="admin-nav-icon-svg" />
                </span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="admin-nav-item">
            <span className="admin-nav-icon">
              <IconLogout className="admin-nav-icon-svg" />
            </span>
            {!collapsed && <span>Выйти</span>}
          </button>
          <Link href="/" className="admin-nav-item" target="_blank">
            <span className="admin-nav-icon">
              <IconHome className="admin-nav-icon-svg" />
            </span>
            {!collapsed && <span>На сайт</span>}
          </Link>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-content">{children}</div>
      </main>

      <style jsx global>{`
        .admin-nav-icon-svg {
          width: 20px;
          height: 20px;
          display: block;
          color: inherit;
        }
      `}</style>
    </div>
  );
}
