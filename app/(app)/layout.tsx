import AppSidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function getNavCounts() {
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM public.propiedades WHERE disponible) AS propiedades,
        (SELECT COUNT(*) FROM public.visitas_programadas WHERE estado<>'cancelada' AND fecha_visita=CURRENT_DATE) AS visitas_hoy,
        (SELECT COUNT(DISTINCT session_id) FROM public.conversaciones_inmobiliaria) AS chats,
        (SELECT COUNT(*) FROM public.derivaciones WHERE estado='pendiente') AS derivaciones
    `);
    const r = rows[0];
    return {
      '/propiedades': Number(r.propiedades) || 0,
      '/visitas': Number(r.visitas_hoy) || 0,
      '/chats': Number(r.chats) || 0,
    } as Record<string, number>;
  } catch {
    return {} as Record<string, number>;
  }
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const counts = await getNavCounts();
  return (
    <TooltipProvider delay={200}>
      <SidebarProvider>
        <AppSidebar counts={counts} />
        <SidebarInset>
          <Topbar />
          <main className="content">{children}</main>
        </SidebarInset>
      </SidebarProvider>
      <Toaster />
    </TooltipProvider>
  );
}
