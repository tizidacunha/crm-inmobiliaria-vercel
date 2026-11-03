'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const NAV = [
  { href: '/', label: 'Resumen', icon: 'dashboard' },
  { href: '/propiedades', label: 'Propiedades', icon: 'real_estate_agent' },
  { href: '/visitas', label: 'Calendario de visitas', icon: 'calendar_month' },
  { href: '/chats', label: 'Chats del bot', icon: 'forum' },
  { href: '/asesores', label: 'Equipo de asesores', icon: 'badge' },
];

export default function Sidebar({ counts = {} }: { counts?: Record<string, number> }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <span className="material-symbols-outlined">cottage</span>
        </div>
        <div>
          <div className="sidebar-name">Horizonte</div>
          <div className="sidebar-sub">Inmobiliaria</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Operaciones</div>
        {NAV.map((item) => {
          const n = counts[item.href];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link${isActive(item.href) ? ' active' : ''}`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {n != null && n > 0 && <span className="nav-count">{n}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <span className="status-dot ok" />
        <span className="sidebar-footer-text">Asistente operativo</span>
      </div>
    </aside>
  );
}
