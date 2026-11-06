import { pool } from '@/lib/db';
import PropiedadesClient, { Propiedad, Visita } from './PropiedadesClient';

export const dynamic = 'force-dynamic';

export default async function PropiedadesPage() {
  const [{ rows }, { rows: visitas }] = await Promise.all([
    pool.query(`
      SELECT id, titulo, descripcion, tipo, operacion, precio, moneda,
             ambientes, dormitorios, banos, superficie_m2, piso,
             direccion, barrio, ciudad, caracteristicas, expensas,
             requisitos_garantia, disponible, destacado,
             codigo_aviso, url_publica, imagen_principal, imagenes
      FROM public.propiedades
      ORDER BY destacado DESC, creado_en DESC
    `),
    pool.query(`
      SELECT id, propiedad_id, nombre_cliente, telefono,
             to_char(fecha_visita,'YYYY-MM-DD') AS fecha_visita,
             to_char(hora_visita,'HH24:MI') AS hora_visita, estado
      FROM public.visitas_programadas
      ORDER BY fecha_visita ASC, hora_visita ASC
    `),
  ]);
  return <PropiedadesClient inicial={rows as Propiedad[]} visitas={visitas as Visita[]} />;
}
