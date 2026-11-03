import { pool } from '@/lib/db';
import PropiedadesClient, { Propiedad } from './PropiedadesClient';

export const dynamic = 'force-dynamic';

export default async function PropiedadesPage() {
  const { rows } = await pool.query(`
    SELECT id, titulo, descripcion, tipo, operacion, precio, moneda,
           ambientes, dormitorios, banos, superficie_m2, piso,
           direccion, barrio, ciudad, caracteristicas, expensas,
           requisitos_garantia, disponible, destacado,
           codigo_aviso, url_publica, imagen_principal, imagenes
    FROM public.propiedades
    ORDER BY destacado DESC, creado_en DESC
  `);
  return (
    <div>
      <h2 className="page-title">Propiedades</h2>
      <PropiedadesClient inicial={rows as Propiedad[]} />
    </div>
  );
}
