import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Lista de asesores
export async function GET() {
  try {
    const { rows } = await pool.query(`
      SELECT id, nombre, email, telefono, sucursal, zonas, activo
      FROM public.asesores
      ORDER BY activo DESC, nombre ASC
    `);
    return NextResponse.json(rows);
  } catch (err) {
    console.error('Error listando asesores:', err);
    return NextResponse.json({ error: 'No se pudo consultar asesores' }, { status: 500 });
  }
}

// Alta de asesor (con sucursal y una o varias zonas)
export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    if (!b.nombre || !b.sucursal) {
      return NextResponse.json({ error: 'Nombre y sucursal son obligatorios' }, { status: 400 });
    }
    const zonas: string[] = Array.isArray(b.zonas)
      ? b.zonas
      : String(b.zonas || '').split(',').map((s: string) => s.trim()).filter(Boolean);

    const { rows } = await pool.query(
      `INSERT INTO public.asesores (nombre, email, telefono, sucursal, zonas, activo)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [b.nombre, b.email || null, b.telefono || null, b.sucursal, zonas, b.activo ?? true]
    );
    return NextResponse.json({ id: rows[0].id }, { status: 201 });
  } catch (err) {
    console.error('Error creando asesor:', err);
    return NextResponse.json({ error: 'No se pudo crear el asesor' }, { status: 500 });
  }
}
