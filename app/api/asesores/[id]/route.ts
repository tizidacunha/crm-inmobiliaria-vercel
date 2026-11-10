import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { validarAsesor, duplicadosAsesor } from '@/lib/asesores';
import { leerJson, idValido, idInvalido } from '@/lib/api';

export const dynamic = 'force-dynamic';

// Edición de asesor
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = idValido(params.id);
    if (!id) return idInvalido();
    const j = await leerJson(req);
    if (!j.ok) return j.res;

    const actual = await pool.query(`SELECT zonas FROM public.asesores WHERE id=$1`, [id]);
    if (!actual.rowCount) return NextResponse.json({ error: 'No existe' }, { status: 404 });

    // Las zonas que ya tenía guardadas se aceptan aunque no estén en el catálogo (registros viejos)
    const v = validarAsesor(j.body, actual.rows[0].zonas ?? []);
    if (!v.ok) {
      return NextResponse.json({ error: 'Revisá los datos del asesor', errores: v.errores }, { status: 400 });
    }
    const a = v.data;

    const { rows: existentes } = await pool.query(`SELECT id, email, telefono FROM public.asesores`);
    const dup = duplicadosAsesor(a, existentes, id);
    if (dup) return NextResponse.json({ error: 'Ya hay un asesor con esos datos', errores: dup }, { status: 409 });

    const { rowCount } = await pool.query(
      `UPDATE public.asesores SET nombre=$1, email=$2, telefono=$3, sucursal=$4, zonas=$5, activo=$6
       WHERE id=$7`,
      [a.nombre, a.email, a.telefono, a.sucursal, a.zonas, a.activo, id]
    );
    if (!rowCount) return NextResponse.json({ error: 'No existe' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error editando asesor:', err);
    return NextResponse.json({ error: 'No se pudo editar el asesor' }, { status: 500 });
  }
}

// Baja de asesor (borrado lógico: activo = false)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = idValido(params.id);
    if (!id) return idInvalido();
    const { rowCount } = await pool.query(
      `UPDATE public.asesores SET activo=false WHERE id=$1`,
      [id]
    );
    if (!rowCount) return NextResponse.json({ error: 'No existe' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error dando de baja asesor:', err);
    return NextResponse.json({ error: 'No se pudo dar de baja el asesor' }, { status: 500 });
  }
}
