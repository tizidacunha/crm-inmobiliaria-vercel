import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Edición de asesor
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const b = await req.json();
    const zonas: string[] = Array.isArray(b.zonas)
      ? b.zonas
      : String(b.zonas || '').split(',').map((s: string) => s.trim()).filter(Boolean);

    const { rowCount } = await pool.query(
      `UPDATE public.asesores SET nombre=$1, email=$2, telefono=$3, sucursal=$4, zonas=$5, activo=$6
       WHERE id=$7`,
      [b.nombre, b.email || null, b.telefono || null, b.sucursal, zonas, b.activo ?? true, params.id]
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
    const { rowCount } = await pool.query(
      `UPDATE public.asesores SET activo=false WHERE id=$1`,
      [params.id]
    );
    if (!rowCount) return NextResponse.json({ error: 'No existe' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error dando de baja asesor:', err);
    return NextResponse.json({ error: 'No se pudo dar de baja el asesor' }, { status: 500 });
  }
}
