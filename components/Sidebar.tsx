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

function Logo() {
  return (
    <svg className="sidebar-logo" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="44" height="44" rx="11" fill="#1A2E3D" />
      {/* sol de atardecer */}
      <path d="M14 27a8 8 0 0 1 16 0" fill="#F26B3A" />
      {/* línea de horizonte */}
      <line x1="10" y1="27" x2="34" y2="27" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="13" y1="31" x2="31" y2="31" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

export default function Sidebar({ counts = {} }: { counts?: Record<string, number> }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Logo />
        <div>
          <div className="sidebar-name">horizonte</div>
          <div className="sidebar-sub">Inmobiliaria</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Operaciones</div>
        {NAV.map((item) => {
          const n = counts[item.href];
          const hot = item.href === '/chats';
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link${isActive(item.href) ? ' active' : ''}`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {n != null && n > 0 && (
                <span className={`nav-count${hot ? ' hot' : ''}`}>{n}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="op">
          <span className="status-dot ok" />
          Asistente operativo
        </div>
        <div className="st">El bot de WhatsApp está respondiendo leads en este momento.</div>
      </div>
    </aside>
  );
}
