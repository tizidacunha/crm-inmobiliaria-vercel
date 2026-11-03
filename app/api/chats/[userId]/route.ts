import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { rows } = await pool.query(
      `SELECT user_id, user_name, message, role, timestamp, message_id
       FROM public.conversaciones_inmobiliaria
       WHERE user_id = $1
       ORDER BY timestamp ASC`,
      [decodeURIComponent(params.userId)]
    );
    return NextResponse.json(rows);
  } catch (err) {
    console.error('Error fetching thread:', err);
    return NextResponse.json({ error: 'No se pudo consultar la conversación' }, { status: 500 });
  }
}
