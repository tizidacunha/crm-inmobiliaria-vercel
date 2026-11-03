import { pool } from '@/lib/db';
import CalendarClient from './CalendarClient';

export const dynamic = 'force-dynamic';

export default async function VisitasPage() {
  const { rows } = await pool.query(`
    SELECT id, chat_id, nombre_cliente, telefono, propiedad_id, propiedad_titulo,
           to_char(fecha_visita, 'YYYY-MM-DD') AS fecha_visita,
           to_char(hora_visita, 'HH24:MI:SS') AS hora_visita,
           notas, estado
    FROM public.visitas_programadas
    ORDER BY fecha_visita ASC, hora_visita ASC
  `);

  return (
    <div>
      <h2 className="page-title">Visitas</h2>
      <CalendarClient visitas={rows} />
    </div>
  );
}
