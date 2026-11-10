import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { validarAsesor, duplicadosAsesor } from '@/lib/asesores';
import { leerJson } from '@/lib/api';

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
    const j = await leerJson(req);
    if (!j.ok) return j.res;
    const v = validarAsesor(j.body);
    if (!v.ok) {
      return NextResponse.json({ error: 'Revisá los datos del asesor', errores: v.errores }, { status: 400 });
    }
    const a = v.data;

    // Email y teléfono no pueden repetirse entre asesores (a quién le llega cada derivación).
    const { rows: existentes } = await pool.query(`SELECT id, email, telefono FROM public.asesores`);
    const dup = duplicadosAsesor(a, existentes);
    if (dup) return NextResponse.json({ error: 'Ya hay un asesor con esos datos', errores: dup }, { status: 409 });

    const { rows } = await pool.query(
      `INSERT INTO public.asesores (nombre, email, telefono, sucursal, zonas, activo)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [a.nombre, a.email, a.telefono, a.sucursal, a.zonas, a.activo]
    );
    return NextResponse.json({ id: rows[0]?.id ?? null }, { status: 201 });
  } catch (err) {
    console.error('Error creando asesor:', err);
    return NextResponse.json({ error: 'No se pudo crear el asesor' }, { status: 500 });
  }
}
