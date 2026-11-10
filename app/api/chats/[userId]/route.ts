import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { decodificar, USER_ID_RE } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { userId: string } }
) {
  const userId = decodificar(params.userId);
  if (!userId || !USER_ID_RE.test(userId)) {
    return NextResponse.json({ error: 'Id de conversación inválido' }, { status: 400 });
  }
  try {
    const { rows } = await pool.query(
      `SELECT user_id, user_name, message, role, timestamp, message_id
       FROM public.conversaciones_inmobiliaria
       WHERE user_id = $1
       ORDER BY timestamp ASC`,
      [userId]
    );
    if (rows.length === 0) return NextResponse.json({ error: 'No existe' }, { status: 404 });
    return NextResponse.json(rows);
  } catch (err) {
    console.error('Error fetching thread:', err);
    return NextResponse.json({ error: 'No se pudo consultar la conversación' }, { status: 500 });
  }
}
