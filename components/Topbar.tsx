'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Topbar() {
  async function cerrarSesion() {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } finally {
      window.location.assign('/login');
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-21 shrink-0 items-center gap-3 border-b border-border bg-background px-4 md:px-10">
      <SidebarTrigger className="md:hidden" />

      <div className="ml-auto flex items-center gap-2 md:gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex items-center gap-2.5 rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50" />
            }
          >
            <Avatar className="size-11 rounded-full bg-secondary text-secondary-foreground">
              <AvatarFallback className="bg-secondary font-display font-bold text-white">H</AvatarFallback>
            </Avatar>
            <div className="hidden text-left leading-tight md:block">
              <div className="text-sm font-bold text-foreground">Panel interno</div>
              <div className="text-xs text-muted-foreground">Inmobiliaria Horizonte</div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Panel interno</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={cerrarSesion}>
              <span className="material-symbols-outlined">logout</span>
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
