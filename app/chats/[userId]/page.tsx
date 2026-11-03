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

export default async function ChatThreadPage({ params }: { params: { userId: string } }) {
  const userId = decodeURIComponent(params.userId);
  const { rows } = await pool.query(
    `SELECT user_id, user_name, message, role, timestamp, message_id
     FROM public.conversaciones_inmobiliaria
     WHERE user_id = $1
     ORDER BY timestamp ASC`,
    [userId]
  );

  const telefono = await resolvePhone(userId);
  const realName = rows.find((r) => r.user_name && r.user_name !== 'Usuario')?.user_name || null;
  const nombre = realName || telefono || userId;
  const subtitulo = realName && telefono ? telefono : null;
  const pictureUrl = await getChatPicture(userId);

  return (
    <div>
      <a className="back-link" href="/chats">&larr; Volver a chats</a>
      <div className="thread-header">
        <Avatar name={nombre} pictureUrl={pictureUrl} large />
        <div>
          <h2 className="page-title" style={{ marginBottom: 2 }}>{nombre}</h2>
          {subtitulo && <div className="muted" style={{ fontSize: 13 }}>{subtitulo}</div>}
        </div>
        <AutoRefresh intervalMs={3000} />
      </div>
      <div className="card">
        <div className="thread">
          {rows.map((m, i) => {
            const isIA = m.role === 'IA';
            return (
              <div key={m.message_id || i} className={`bubble-row ${isIA ? 'ia' : 'cliente'}`}>
                <div className={`bubble ${isIA ? 'ia' : 'cliente'}`}>
                  {m.message}
                  <span className="meta">{formatTime(m.timestamp)}</span>
                </div>
              </div>
            );
          })}
          {rows.length === 0 && (
            <p style={{ color: 'var(--text-muted)' }}>No hay mensajes en esta conversación.</p>
          )}
        </div>
      </div>
    </div>
  );
}
