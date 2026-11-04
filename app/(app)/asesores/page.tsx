import { pool } from '@/lib/db';
import AsesoresClient, { Asesor } from './AsesoresClient';

export const dynamic = 'force-dynamic';

export default async function AsesoresPage() {
  const { rows } = await pool.query(`
    SELECT id, nombre, email, telefono, sucursal, zonas, activo
    FROM public.asesores
    ORDER BY activo DESC, nombre ASC
  `);
  return <AsesoresClient inicial={rows as Asesor[]} />;
}
