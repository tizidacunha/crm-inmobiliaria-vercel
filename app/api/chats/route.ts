import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { rows } = await pool.query(`
      SELECT DISTINCT ON (user_id)
        user_id, user_name, message AS last_message, role AS last_role, timestamp AS last_timestamp
      FROM public.conversaciones_inmobiliaria
      ORDER BY user_id, timestamp DESC
    `);
    rows.sort(
      (a, b) => new Date(b.last_timestamp).getTime() - new Date(a.last_timestamp).getTime()
    );
    return NextResponse.json(rows);
  } catch (err) {
    console.error('Error fetching chats:', err);
    return NextResponse.json({ error: 'No se pudo consultar chats' }, { status: 500 });
  }
}
