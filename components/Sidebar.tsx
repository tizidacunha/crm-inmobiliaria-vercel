'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

// badge: sufijo visible junto al número + texto del tooltip, para que se entienda qué cuenta.
const NAV: { href: string; label: string; icon: string; badge?: { sufijo?: string; ayuda: (n: number) => string } }[] = [
  { href: '/', label: 'Resumen', icon: 'dashboard' },
  { href: '/propiedades', label: 'Propiedades', icon: 'real_estate_agent', badge: { ayuda: (n) => `${n} propiedades disponibles` } },
  { href: '/visitas', label: 'Calendario de visitas', icon: 'calendar_month', badge: { ayuda: (n) => `${n} visitas para hoy (confirmadas y pendientes)` } },
  { href: '/chats', label: 'Chats del bot', icon: 'forum', badge: { ayuda: (n) => `${n} conversaciones con el bot` } },
  { href: '/asesores', label: 'Equipo de asesores', icon: 'badge' },
];

function Logo() {
  return (
    <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="size-11 shrink-0">
      <rect width="44" height="44" rx="11" fill="#1A2E3D" />
      <path d="M14 27a8 8 0 0 1 16 0" fill="#F26B3A" />
      <line x1="10" y1="27" x2="34" y2="27" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="13" y1="31" x2="31" y2="31" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

export default function AppSidebar({ counts = {} }: { counts?: Record<string, number> }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <Sidebar>
      <SidebarHeader className="h-21 flex-row items-center gap-3 px-5">
        <Logo />
        <div className="leading-none">
          <div className="font-display text-[22px] font-extrabold tracking-[-0.02em] text-white">horizonte</div>
          <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/60">
            Inmobiliaria
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel>Operaciones</SidebarGroupLabel>
          <SidebarMenu>
            {NAV.map((item) => {
              const active = isActive(item.href);
              const n = counts[item.href];
              const hot = item.href === '/chats';
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={active}
                    render={<Link href={item.href} />}
                    className={cn(
                      'min-h-11 text-[15px] font-medium',
                      active &&
                        'bg-sidebar-primary! font-bold text-sidebar-primary-foreground! hover:bg-sidebar-primary!'
                    )}
                  >
                    <span className="material-symbols-outlined">{item.icon}</span>
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                  {n != null && n > 0 && (
                    <SidebarMenuBadge
                      title={item.badge?.ayuda(n)}
                      aria-label={item.badge?.ayuda(n)}
                      className={cn(
                        'gap-1 text-sidebar-foreground',
                        hot && !active && 'bg-sidebar-primary text-sidebar-primary-foreground'
                      )}
                    >
                      {n}
                      {item.badge?.sufijo && <span className="font-normal opacity-70">{item.badge.sufijo}</span>}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="rounded-lg bg-sidebar-accent p-3.5">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-white">
            <span className="size-2.5 rounded-full bg-success shadow-[0_0_0_3px_rgba(91,214,160,0.18)]" />
            Asistente operativo
          </div>
          <div className="mt-1 text-xs leading-snug text-sidebar-foreground/60">
            El bot de WhatsApp está respondiendo leads en este momento.
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
