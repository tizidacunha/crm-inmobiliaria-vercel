import { pool } from '@/lib/db';
import { getChatPicture, resolvePhone } from '@/lib/waha';
import Avatar from '@/components/Avatar';
import AutoRefresh from '@/components/AutoRefresh';

export const dynamic = 'force-dynamic';

function formatTime(ts: Date) {
  return new Date(ts).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function ChatsPage() {
  const { rows } = await pool.query(`
    WITH latest AS (
      SELECT DISTINCT ON (user_id)
        user_id, message AS last_message, timestamp AS last_timestamp
      FROM public.conversaciones_inmobiliaria
      ORDER BY user_id, timestamp DESC
    ),
    names AS (
      SELECT DISTINCT ON (user_id) user_id, user_name
      FROM public.conversaciones_inmobiliaria
      WHERE user_name IS NOT NULL AND user_name <> 'Usuario'
      ORDER BY user_id, timestamp DESC
    )
    SELECT latest.user_id, COALESCE(names.user_name, 'Usuario') AS user_name,
           latest.last_message, latest.last_timestamp
    FROM latest
    LEFT JOIN names ON names.user_id = latest.user_id
  `);
  rows.sort((a, b) => new Date(b.last_timestamp).getTime() - new Date(a.last_timestamp).getTime());

  const pictures = await Promise.allSettled(rows.map((c) => getChatPicture(c.user_id)));
  const phones = await Promise.allSettled(rows.map((c) => resolvePhone(c.user_id)));

  return (
    <div>
      <div className="toolbar">
        <h2 className="page-title" style={{ marginBottom: 0 }}>Chats</h2>
        <AutoRefresh intervalMs={6000} />
      </div>
      <div className="card" style={{ padding: 0 }}>
        {rows.length === 0 && (
          <p style={{ padding: 20, color: 'var(--text-muted)' }}>Todavía no hay conversaciones.</p>
        )}
        {rows.map((c, i) => {
          const pic = pictures[i];
          const pictureUrl = pic.status === 'fulfilled' ? pic.value : null;
          const ph = phones[i];
          const phone = ph.status === 'fulfilled' ? ph.value : null;
          const realName = c.user_name && c.user_name !== 'Usuario' ? c.user_name : null;
          const titulo = realName || phone || c.user_id;
          return (
            <a
              key={c.user_id}
              href={`/chats/${encodeURIComponent(c.user_id)}`}
              className="chat-list-item"
            >
              <div className="row">
                <Avatar name={titulo} pictureUrl={pictureUrl} />
                <div style={{ minWidth: 0 }}>
                  <div className="name">
                    {titulo}
                    {realName && phone && <span className="chat-phone">{phone}</span>}
                  </div>
                  <div className="preview">{c.last_message}</div>
                </div>
              </div>
              <div className="time">{formatTime(c.last_timestamp)}</div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
