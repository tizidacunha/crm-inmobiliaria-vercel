import { pool } from '@/lib/db';
import { resolvePhone } from '@/lib/waha';
import AutoRefresh from '@/components/AutoRefresh';
import LeadList, { Lead } from '@/components/LeadList';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function leadStatus(msg: string): { cls: string; label: string; derivado: boolean; conVisita: boolean } {
  const m = (msg || '').toLowerCase();
  const derivado = /\bderiv|asesor\b/.test(m);
  const conVisita = /confirmad|agendad/.test(m);
  if (derivado) return { cls: 'derivado', label: 'Derivado', derivado, conVisita };
  if (conVisita) return { cls: 'confirmada', label: 'Visita confirmada', derivado, conVisita };
  if (/interesa|me interesa|sí me/.test(m)) return { cls: 'interesado', label: 'Interesado', derivado, conVisita };
  return { cls: 'consultando', label: 'Consultando', derivado, conVisita };
}

function iniciales(nombre: string) {
  const partes = String(nombre || '').trim().split(/\s+/).filter(Boolean);
  if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
  const limpio = String(nombre || '').replace(/[^A-Za-zÀ-ÿ0-9]/g, '');
  return (limpio.slice(0, 2) || '?').toUpperCase();
}

function esHoy(d: Date) {
  const n = new Date();
  return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}
function horaCorta(ts: unknown) {
  const d = new Date(ts as string);
  return esHoy(d)
    ? d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function hhmm(ts: unknown) {
  return new Date(ts as string).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}
function diaLargo(d: Date) {
  const base = `${d.getDate()} de ${MESES[d.getMonth()]}`;
  return esHoy(d) ? `Hoy, ${base}` : base;
}

const fmtPrecio = (p: { precio: number; moneda: string }) =>
  `${p.moneda === 'USD' ? 'USD' : '$'} ${Number(p.precio).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

/* Deriva "qué busca" y una propiedad sugerida a partir de los mensajes del cliente. */
function derivarContexto(mensajesCliente: string[], propiedades: any[]) {
  const texto = mensajesCliente.join(' ').toLowerCase();
  const chips: string[] = [];

  let operacion: string | null = null;
  if (/alquil/.test(texto)) { operacion = 'alquiler'; chips.push('Alquiler'); }
  else if (/venta|comprar|compra\b/.test(texto)) { operacion = 'venta'; chips.push('Venta'); }

  if (/mono\s*ambiente/.test(texto)) chips.push('Monoambiente');
  else {
    const amb = texto.match(/(\d+)\s*amb/);
    if (amb) chips.push(`${amb[1]} ambientes`);
  }

  const barrios = Array.from(new Set(propiedades.map((p) => String(p.barrio || '')).filter(Boolean)));
  const barrio = barrios.find((b) => texto.includes(b.toLowerCase())) || null;
  if (barrio) chips.push(barrio);

  // Propiedad sugerida: disponible, misma operación/barrio si se conocen, priorizando destacadas.
  const candidatas = propiedades
    .filter((p) => p.disponible)
    .filter((p) => (!operacion || String(p.operacion).startsWith(operacion)))
    .filter((p) => (!barrio || String(p.barrio).toLowerCase() === barrio.toLowerCase()))
    .sort((a, b) => Number(b.destacado) - Number(a.destacado));
  const sugerida = (barrio || operacion) ? candidatas[0] ?? null : null;

  return { chips, sugerida };
}

export default async function ChatsInbox({ selectedId }: { selectedId?: string }) {
  // Lista de leads (último mensaje por usuario)
  const { rows: listRows } = await pool.query(`
    WITH latest AS (
      SELECT DISTINCT ON (user_id) user_id, message AS last_message, timestamp AS last_timestamp
      FROM public.conversaciones_inmobiliaria ORDER BY user_id, timestamp DESC
    ),
    names AS (
      SELECT DISTINCT ON (user_id) user_id, user_name
      FROM public.conversaciones_inmobiliaria
      WHERE user_name IS NOT NULL AND user_name <> 'Usuario' ORDER BY user_id, timestamp DESC
    )
    SELECT latest.user_id, COALESCE(names.user_name, 'Usuario') AS user_name,
           latest.last_message, latest.last_timestamp
    FROM latest LEFT JOIN names ON names.user_id = latest.user_id
  `);
  listRows.sort((a, b) => new Date(b.last_timestamp).getTime() - new Date(a.last_timestamp).getTime());

  const leads: Lead[] = await Promise.all(listRows.map(async (c) => {
    const real = c.user_name && c.user_name !== 'Usuario' ? c.user_name : null;
    const phone = real ? null : await resolvePhone(c.user_id);
    const name = real || phone || c.user_id;
    const st = leadStatus(c.last_message);
    return {
      userId: c.user_id, name, preview: c.last_message, time: horaCorta(c.last_timestamp),
      initials: iniciales(name), statusCls: st.cls, statusLabel: st.label,
      derivado: st.derivado, conVisita: st.conVisita,
    };
  }));

  if (leads.length === 0) {
    return (
      <div className="card"><p className="muted">Todavía no hay conversaciones.</p></div>
    );
  }

  const selected = leads.find((l) => l.userId === selectedId) ?? leads[0];

  // Hilo del lead seleccionado
  const { rows: thread } = await pool.query(
    `SELECT user_id, user_name, message, role, timestamp, message_id
     FROM public.conversaciones_inmobiliaria WHERE user_id = $1 ORDER BY timestamp ASC`,
    [selected.userId]
  );
  const phone = await resolvePhone(selected.userId);

  // Contexto derivado
  const { rows: props } = await pool.query(`
    SELECT id, titulo, operacion, precio, moneda, ambientes, barrio, disponible, destacado
    FROM public.propiedades
  `);
  const mensajesCliente = thread.filter((m) => m.role !== 'IA').map((m) => String(m.message || ''));
  const { chips, sugerida } = derivarContexto(mensajesCliente, props);

  // Agrupar burbujas por día
  let lastDay = '';

  return (
    <div className="chats-layout">
      <LeadList leads={leads} selectedId={selected.userId} />

      <section className="chat-pane">
        <div className="chat-head">
          <div className="avatar">{selected.initials}</div>
          <div className="chat-head-info">
            <div className="chat-head-name">{selected.name}</div>
            <div className="chat-head-sub">
              {phone ? `${phone} · ` : ''}WhatsApp · atendido por el asistente
            </div>
          </div>
          <div className="chat-head-actions">
            <a className="btn btn-sm" href="/visitas">Agendar visita</a>
            <AutoRefresh intervalMs={4000} />
          </div>
        </div>

        <div className="thread-scroll">
          <div className="thread">
            {thread.map((m, i) => {
              const d = new Date(m.timestamp as string);
              const dayKey = d.toDateString();
              const showDay = dayKey !== lastDay;
              lastDay = dayKey;
              const isIA = m.role === 'IA';
              return (
                <div key={m.message_id || i} style={{ display: 'contents' }}>
                  {showDay && <div className="thread-day">{diaLargo(d)}</div>}
                  <div className={`bubble-row ${isIA ? 'ia' : 'cliente'}`}>
                    <div className={`bubble ${isIA ? 'ia' : 'cliente'}`}>
                      {isIA && (
                        <span className="sender">
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>wb_twilight</span>
                          Asistente Horizonte
                        </span>
                      )}
                      {m.message}
                      <span className="meta">{hhmm(m.timestamp)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {thread.length === 0 && <p className="muted">No hay mensajes en esta conversación.</p>}
          </div>
        </div>
      </section>

      <aside className="ctx-pane">
        {chips.length > 0 && (
          <div className="ctx-block">
            <div className="ctx-kick">Qué busca</div>
            <div className="ctx-chips">
              {chips.map((c, i) => (
                <span key={c} className={`ctx-chip${i === 0 ? '' : ' soft'}`}>{c}</span>
              ))}
            </div>
          </div>
        )}

        {sugerida && (
          <div className="ctx-block ctx-sug">
            <div className="ctx-kick">Propiedad sugerida</div>
            <div className="ctx-price">{fmtPrecio(sugerida)}</div>
            <div className="ctx-sug-sub">
              {[sugerida.ambientes != null ? `${sugerida.ambientes} amb.` : null, sugerida.barrio]
                .filter(Boolean).join(' · ')}
            </div>
            <a className="btn btn-primary" href="/propiedades">Ver ficha</a>
          </div>
        )}
      </aside>
    </div>
  );
}
