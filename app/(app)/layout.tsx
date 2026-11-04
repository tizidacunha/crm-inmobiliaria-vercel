import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function getNavCounts() {
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM public.propiedades WHERE disponible) AS propiedades,
        (SELECT COUNT(*) FROM public.visitas_programadas WHERE estado='confirmada' AND fecha_visita=CURRENT_DATE) AS visitas_hoy,
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
    <div className="app-shell">
      <Sidebar counts={counts} />
      <div className="app-main">
        <Topbar />
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
