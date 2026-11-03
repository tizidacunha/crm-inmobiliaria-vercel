import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

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

// Alta de propiedad
export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    if (!b.titulo || !b.tipo || !b.operacion || b.precio == null || !b.direccion || !b.barrio) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }
    const caracteristicas: string[] = Array.isArray(b.caracteristicas)
      ? b.caracteristicas
      : String(b.caracteristicas || '').split(',').map((s: string) => s.trim()).filter(Boolean);
    const imagenes: string[] = Array.isArray(b.imagenes)
      ? b.imagenes
      : String(b.imagenes || '').split(/\s+/).map((s: string) => s.trim()).filter(Boolean);

    const { rows } = await pool.query(
      `INSERT INTO public.propiedades
        (titulo, descripcion, tipo, operacion, precio, moneda, ambientes, dormitorios,
         banos, superficie_m2, piso, direccion, barrio, ciudad, caracteristicas,
         expensas, requisitos_garantia, disponible, destacado,
         codigo_aviso, url_publica, imagen_principal, imagenes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
       RETURNING id`,
      [
        b.titulo, b.descripcion || null, b.tipo, b.operacion, b.precio, b.moneda || 'USD',
        b.ambientes ?? null, b.dormitorios ?? null, b.banos ?? null, b.superficie_m2 ?? null,
        b.piso || null, b.direccion, b.barrio, b.ciudad || 'Buenos Aires', caracteristicas,
        b.expensas ?? null, b.requisitos_garantia || null,
        b.disponible ?? true, b.destacado ?? false,
        b.codigo_aviso || null, b.url_publica || null, b.imagen_principal || imagenes[0] || null, imagenes,
      ]
    );
    return NextResponse.json({ id: rows[0].id }, { status: 201 });
  } catch (err) {
    console.error('Error creando propiedad:', err);
    return NextResponse.json({ error: 'No se pudo crear la propiedad' }, { status: 500 });
  }
}
