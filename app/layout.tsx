import './globals.css';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { pool } from '@/lib/db';

export const metadata = {
  title: 'CRM Inmobiliaria Horizonte',
  description: 'Panel interno: propiedades, visitas y chats del bot de WhatsApp',
};

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const counts = await getNavCounts();
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Hanken+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="app-shell">
          <Sidebar counts={counts} />
          <div className="app-main">
            <Topbar />
            <main className="content">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
