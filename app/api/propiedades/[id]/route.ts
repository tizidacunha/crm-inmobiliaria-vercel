import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Edición de propiedad
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const b = await req.json();
    const caracteristicas: string[] = Array.isArray(b.caracteristicas)
      ? b.caracteristicas
      : String(b.caracteristicas || '').split(',').map((s: string) => s.trim()).filter(Boolean);
    const imagenes: string[] = Array.isArray(b.imagenes)
      ? b.imagenes
      : String(b.imagenes || '').split(/\s+/).map((s: string) => s.trim()).filter(Boolean);

    const { rowCount } = await pool.query(
      `UPDATE public.propiedades SET
         titulo=$1, descripcion=$2, tipo=$3, operacion=$4, precio=$5, moneda=$6,
         ambientes=$7, dormitorios=$8, banos=$9, superficie_m2=$10, piso=$11,
         direccion=$12, barrio=$13, ciudad=$14, caracteristicas=$15, expensas=$16,
         requisitos_garantia=$17, disponible=$18, destacado=$19,
         codigo_aviso=$20, url_publica=$21, imagen_principal=$22, imagenes=$23, actualizado_en=now()
       WHERE id=$24`,
      [
        b.titulo, b.descripcion || null, b.tipo, b.operacion, b.precio, b.moneda || 'USD',
        b.ambientes ?? null, b.dormitorios ?? null, b.banos ?? null, b.superficie_m2 ?? null,
        b.piso || null, b.direccion, b.barrio, b.ciudad || 'Buenos Aires', caracteristicas,
        b.expensas ?? null, b.requisitos_garantia || null,
        b.disponible ?? true, b.destacado ?? false,
        b.codigo_aviso || null, b.url_publica || null, b.imagen_principal || imagenes[0] || null, imagenes,
        params.id,
      ]
    );
    if (!rowCount) return NextResponse.json({ error: 'No existe' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error editando propiedad:', err);
    return NextResponse.json({ error: 'No se pudo editar la propiedad' }, { status: 500 });
  }
}

// HU-05: marcar disponible / no disponible en un clic
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { disponible } = await req.json();
    const { rowCount } = await pool.query(
      `UPDATE public.propiedades SET disponible=$1, actualizado_en=now() WHERE id=$2`,
      [!!disponible, params.id]
    );
    if (!rowCount) return NextResponse.json({ error: 'No existe' }, { status: 404 });
    return NextResponse.json({ ok: true, disponible: !!disponible });
  } catch (err) {
    console.error('Error cambiando disponibilidad:', err);
    return NextResponse.json({ error: 'No se pudo cambiar el estado' }, { status: 500 });
  }
}
