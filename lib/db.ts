// ============================================================
//  Pool MOCK (demo) — reemplaza Postgres.
//  Rutea cada query conocida del CRM a los datos de prueba de ./mock.
//  No hay conexión a ninguna base de datos.
// ============================================================
import * as mock from './mock';

type Row = Record<string, unknown>;

function run(text: string, params: unknown[] = []): Row[] {
  const sql = text.replace(/\s+/g, ' ').trim();

  // Mutaciones (crear/editar/borrar): no persisten en la demo, devuelven OK.
  if (/^\s*(INSERT|UPDATE|DELETE)/i.test(text)) return [{ ok: true }];

  if (sql.includes('prop_activas')) return [mock.homeKpis()];
  if (sql.includes('AS propiedades,') && sql.includes('visitas_hoy')) return [mock.navCounts()];
  if (sql.includes('WITH ult AS')) return mock.ultimasConversaciones(6);

  // Chats: lista (página con WITH latest, y API con DISTINCT ON)
  if (sql.includes('WITH latest AS') || (sql.includes('DISTINCT ON (user_id)') && sql.includes('last_message'))) {
    return mock.chatsList();
  }
  // Conversación (thread) de un usuario
  if (sql.includes('WHERE user_id = $1') && sql.includes('ORDER BY timestamp ASC')) {
    return mock.thread(String(params[0] ?? ''));
  }

  // Visitas: próximas (home, LIMIT 6) vs. todas (calendario)
  if (sql.includes('FROM public.visitas_programadas')) {
    if (sql.includes('LIMIT 6') && sql.includes('>= CURRENT_DATE')) return mock.proximasVisitas(6);
    return mock.visitas;
  }

  if (sql.includes('FROM public.propiedades')) return mock.propiedades;
  if (sql.includes('FROM public.asesores')) return mock.asesores;

  return [];
}

export const pool = {
  // rows como any[] para igualar el tipado laxo de `pg` y no romper los consumidores.
  query: async (text: string, params?: unknown[]): Promise<{ rows: any[]; rowCount: number }> => {
    const rows = run(text, params) as any[];
    return { rows, rowCount: rows.length };
  },
};
