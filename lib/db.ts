// ============================================================
//  Pool MOCK (demo) — reemplaza Postgres.
//  Rutea cada query conocida del CRM a los datos de prueba de ./mock.
//  No hay conexión a ninguna base de datos.
// ============================================================
import * as mock from './mock';

type Row = Record<string, unknown>;

function run(text: string, params: unknown[] = []): Row[] {
  const sql = text.replace(/\s+/g, ' ').trim();

  // Mutaciones (crear/editar/borrar): no persisten en la demo.
  // Igual que Postgres: un UPDATE/DELETE sobre un id inexistente afecta 0 filas (→ 404 en la API),
  // y un INSERT devuelve un id nuevo.
  if (/^\s*(INSERT|UPDATE|DELETE)/i.test(text)) {
    const tabla = sql.match(/(?:INTO|UPDATE|FROM)\s+public\.(\w+)/i)?.[1];
    const filas = tabla === 'propiedades' ? mock.propiedades : tabla === 'asesores' ? mock.asesores : null;
    if (/^\s*INSERT/i.test(text)) return [{ id: filas ? Math.max(0, ...filas.map((f) => Number(f.id))) + 1 : 1 }];
    const id = /WHERE id=\$(\d+)/i.exec(sql)?.[1];
    if (filas && id) return filas.some((f) => String(f.id) === String(params[Number(id) - 1])) ? [{ ok: true }] : [];
    return [{ ok: true }];
  }

  if (sql.includes('prop_activas')) return [mock.homeKpis()];
  if (sql.includes('AS propiedades,') && sql.includes('visitas_hoy')) return [mock.navCounts()];
  if (sql.includes('WITH ult AS')) return mock.ultimasConversaciones(6);

  // Chats: lista (página con WITH latest, y API con DISTINCT ON)
  if (sql.includes('WITH latest AS') || (sql.includes('DISTINCT ON (user_id)') && sql.includes('last_message'))) {
    return mock.chatsList();
  }
  // Mensajes de clientes (para detectar qué busca cada chat)
  if (sql.includes('FROM public.conversaciones_inmobiliaria') && sql.includes("role <> 'IA'")) {
    return mock.mensajesClientes();
  }
  // Conversación (thread) de un usuario
  if (sql.includes('WHERE user_id = $1') && sql.includes('ORDER BY timestamp ASC')) {
    return mock.thread(String(params[0] ?? ''));
  }

  // Visitas: próximas (home, LIMIT 6) vs. todas (calendario)
  if (sql.includes('FROM public.visitas_programadas')) {
    if (sql.includes('LIMIT 6') && sql.includes('>= CURRENT_DATE')) return mock.proximasVisitas(6);
    // Igual que el ORDER BY fecha_visita, hora_visita de la query real.
    return [...mock.visitas].sort((a, b) =>
      `${a.fecha_visita} ${a.hora_visita}`.localeCompare(`${b.fecha_visita} ${b.hora_visita}`));
  }

  if (sql.includes('FROM public.propiedades')) return mock.propiedades;
  if (sql.includes('FROM public.asesores')) {
    // Respeta el "WHERE activo" (sugerencia de asesor en Chats): un asesor dado de baja no recibe derivaciones.
    if (/WHERE id=\$1/.test(sql)) return mock.asesores.filter((a) => String(a.id) === String(params[0]));
    return /WHERE activo\b/.test(sql) ? mock.asesores.filter((a) => a.activo) : mock.asesores;
  }

  return [];
}

export const pool = {
  // rows como any[] para igualar el tipado laxo de `pg` y no romper los consumidores.
  query: async (text: string, params?: unknown[]): Promise<{ rows: any[]; rowCount: number }> => {
    const rows = run(text, params) as any[];
    return { rows, rowCount: rows.length };
  },
};
