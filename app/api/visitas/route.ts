import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { rows } = await pool.query(`
      SELECT id, chat_id, nombre_cliente, telefono, propiedad_id, propiedad_titulo,
             fecha_visita, hora_visita, notas, estado, creado_en, modificado_en
      FROM public.visitas_programadas
      ORDER BY fecha_visita ASC, hora_visita ASC
    `);
    return NextResponse.json(rows);
  } catch (err) {
    console.error('Error fetching visitas:', err);
    return NextResponse.json({ error: 'No se pudo consultar visitas' }, { status: 500 });
  }
}
