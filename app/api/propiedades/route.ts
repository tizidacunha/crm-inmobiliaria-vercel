import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { leerJson } from '@/lib/api';
import { validarPropiedad } from '@/lib/propiedades';

export const dynamic = 'force-dynamic';

// Lista de propiedades
export async function GET() {
  try {
    const { rows } = await pool.query(`
      SELECT id, titulo, descripcion, tipo, operacion, precio, moneda,
             ambientes, dormitorios, banos, superficie_m2, piso,
             direccion, barrio, ciudad, caracteristicas, expensas,
             requisitos_garantia, disponible, destacado,
             codigo_aviso, url_publica, imagen_principal, imagenes
      FROM public.propiedades
      ORDER BY destacado DESC, creado_en DESC
    `);
    return NextResponse.json(rows);
  } catch (err) {
    console.error('Error listando propiedades:', err);
    return NextResponse.json({ error: 'No se pudo consultar propiedades' }, { status: 500 });
  }
}

// Alta de propiedad (validada y normalizada con validarPropiedad)
export async function POST(req: NextRequest) {
  try {
    const j = await leerJson(req);
    if (!j.ok) return j.res;
    const v = validarPropiedad(j.body);
    if (!v.ok) return NextResponse.json({ error: 'Revisá los datos de la propiedad', errores: v.errores }, { status: 400 });
    const p = v.data;

    const { rows } = await pool.query(
      `INSERT INTO public.propiedades
        (titulo, descripcion, tipo, operacion, precio, moneda, ambientes, dormitorios,
         banos, superficie_m2, piso, direccion, barrio, ciudad, caracteristicas,
         expensas, requisitos_garantia, disponible, destacado,
         codigo_aviso, url_publica, imagen_principal, imagenes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
       RETURNING id`,
      [
        p.titulo, p.descripcion, p.tipo, p.operacion, p.precio, p.moneda,
        p.ambientes, p.dormitorios, p.banos, p.superficie_m2, p.piso,
        p.direccion, p.barrio, p.ciudad, p.caracteristicas, p.expensas, p.requisitos_garantia,
        p.disponible, p.destacado, p.codigo_aviso, p.url_publica, p.imagen_principal, p.imagenes,
      ]
    );
    return NextResponse.json({ id: rows[0]?.id ?? null }, { status: 201 });
  } catch (err) {
    console.error('Error creando propiedad:', err);
    return NextResponse.json({ error: 'No se pudo crear la propiedad' }, { status: 500 });
  }
}
