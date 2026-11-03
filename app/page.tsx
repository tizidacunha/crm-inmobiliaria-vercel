import { pool } from '@/lib/db';
import { resolvePhone } from '@/lib/waha';

export const dynamic = 'force-dynamic';

const waLink = (tel: string | null | undefined) => {
  const d = (tel ?? '').replace(/\D/g, '');
  return d.length >= 10 ? `https://wa.me/${d}` : null;
};

const WEEKDAYS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

/* De 'DD/MM' → { d, w, hoy } para el bloque de fecha de cada visita. */
function fechaBlock(fecha: string) {
  const [dd, mm] = (fecha || '').split('/').map((x) => parseInt(x, 10));
  const now = new Date();
  const date = new Date(now.getFullYear(), (mm || 1) - 1, dd || 1);
  const hoy = dd === now.getDate() && mm === now.getMonth() + 1;
  return { d: String(dd || '').padStart(2, '0'), w: WEEKDAYS[date.getDay()] ?? '', hoy };
}

/* Estado del lead inferido del último mensaje del hilo. */
function leadStatus(msg: string): { cls: string; label: string } {
  const m = (msg || '').toLowerCase();
  if (/\bderiv|asesor\b/.test(m)) return { cls: 'derivado', label: 'Derivado' };
  if (/confirmad/.test(m)) return { cls: 'confirmada', label: 'Visita confirmada' };
  if (/interesa|me interesa|sí me/.test(m)) return { cls: 'interesado', label: 'Interesado' };
  return { cls: 'consultando', label: 'Consultando' };
}

async function getData() {
  const [kpis, visitas, leadsRaw] = await Promise.all([
    pool.query(`
      SELECT
        (SELECT COUNT(*) FROM public.propiedades WHERE disponible) AS prop_activas,
        (SELECT COUNT(*) FROM public.propiedades WHERE disponible AND operacion LIKE 'alquiler%') AS prop_alquiler,
        (SELECT COUNT(*) FROM public.propiedades WHERE disponible AND operacion='venta') AS prop_venta,
        (SELECT COUNT(*) FROM public.propiedades WHERE disponible AND destacado) AS prop_destacadas,
        (SELECT COUNT(*) FROM public.visitas_programadas WHERE estado='confirmada' AND fecha_visita=CURRENT_DATE) AS visitas_hoy,
        (SELECT COUNT(*) FROM public.visitas_programadas WHERE estado='confirmada' AND fecha_visita>=CURRENT_DATE) AS visitas_prox,
        (SELECT COUNT(DISTINCT session_id) FROM public.conversaciones_inmobiliaria) AS conversaciones,
        (SELECT COUNT(*) FROM public.derivaciones WHERE estado='pendiente') AS derivaciones
    `),
    pool.query(`
      SELECT nombre_cliente, telefono, propiedad_titulo,
             to_char(fecha_visita,'DD/MM') AS fecha, to_char(hora_visita,'HH24:MI') AS hora
      FROM public.visitas_programadas
      WHERE estado='confirmada' AND fecha_visita >= CURRENT_DATE
      ORDER BY fecha_visita ASC, hora_visita ASC LIMIT 6
    `),
    pool.query(`
      WITH ult AS (
        SELECT DISTINCT ON (session_id) session_id, user_id, user_name, message, timestamp
        FROM public.conversaciones_inmobiliaria ORDER BY session_id, timestamp DESC
      )
      SELECT user_id, user_name, message, to_char(timestamp,'DD/MM HH24:MI') AS cuando
      FROM ult ORDER BY timestamp DESC LIMIT 6
    `),
  ]);
  const leads = await Promise.all(
    leadsRaw.rows.map(async (l) => {
      const real = l.user_name && l.user_name !== 'Usuario' ? l.user_name : null;
      const phone = real ? null : await resolvePhone(l.user_id);
      return { ...l, display: real || phone || l.user_id };
    })
  );
  return { k: kpis.rows[0], visitas: visitas.rows, leads };
}

function SunArt() {
  return (
    <svg className="hero-art" viewBox="0 0 460 320" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="300" cy="196" r="78" fill="#F26B3A" opacity="0.92" />
      <circle cx="300" cy="196" r="110" stroke="#3A4F60" strokeWidth="1.4" opacity="0.5" />
      <circle cx="300" cy="196" r="146" stroke="#3A4F60" strokeWidth="1.2" opacity="0.3" />
      <line x1="40" y1="232" x2="440" y2="232" stroke="#E6EBEF" strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
      <line x1="90" y1="258" x2="400" y2="258" stroke="#E6EBEF" strokeWidth="1.6" strokeLinecap="round" opacity="0.35" />
      <line x1="140" y1="284" x2="360" y2="284" stroke="#E6EBEF" strokeWidth="1.6" strokeLinecap="round" opacity="0.18" />
    </svg>
  );
}

export default async function HomePage() {
  const { k, visitas, leads } = await getData();
  const n = (v: unknown) => Number(v) || 0;

  const hoyStr = new Date()
    .toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
    .toUpperCase();

  const visitasHoy = n(k.visitas_hoy);
  const derivaciones = n(k.derivaciones);
  const propActivas = n(k.prop_activas);
  const alquiler = n(k.prop_alquiler);
  const venta = n(k.prop_venta);
  const totalOps = alquiler + venta || 1;
  const prox = visitas[0];

  const kpis = [
    { label: 'Propiedades activas', value: propActivas, dot: 'ink', hint: `${n(k.prop_destacadas)} destacadas en portada` },
    { label: 'Visitas hoy', value: visitasHoy, dot: 'accent', hint: `${n(k.visitas_prox)} en los próximos días` },
    { label: 'Conversaciones', value: n(k.conversaciones), dot: 'success', hint: 'Leads atendidos por el asistente' },
  ];

  return (
    <div>
      {/* ===== Hero ===== */}
      <section className="hero">
        <SunArt />
        <div className="hero-date">{hoyStr}</div>
        <h1 className="hero-title">
          Buen día, equipo.{visitasHoy > 0 ? ` Hoy hay ${visitasHoy} ${visitasHoy === 1 ? 'visita' : 'visitas'} en agenda.` : ' Hoy no hay visitas en agenda.'}
        </h1>
        {prox && (
          <p className="hero-next">
            Próxima visita: <b>{prox.propiedad_titulo}</b> con {prox.nombre_cliente} · {prox.fecha} a las {prox.hora} hs.
          </p>
        )}
        <div className="hero-ctas">
          <a className="cta cta-solid" href="/visitas">Ver agenda de hoy</a>
          {derivaciones > 0 && (
            <a className="cta cta-outline" href="/chats">
              Revisar {derivaciones} {derivaciones === 1 ? 'derivación' : 'derivaciones'}
            </a>
          )}
        </div>
      </section>

      {/* ===== KPIs ===== */}
      <div className="stat-grid">
        {kpis.map((s) => (
          <div className="stat-card" key={s.label}>
            <span className="label"><span className={`dot ${s.dot}`} />{s.label}</span>
            <span className="value">{s.value}</span>
            <span className="hint">{s.hint}</span>
          </div>
        ))}
        <a className="stat-card action" href="/chats">
          <span className="label"><span className="dot" />Derivaciones pendientes</span>
          <span className="value">{derivaciones}</span>
          <span className="hint">Clientes esperando un asesor →</span>
        </a>
      </div>

      {/* ===== Cartera ===== */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="cartera-head">
          <div>
            <h3 className="dash-card-title">Cartera disponible</h3>
            <p className="dash-card-sub">Distribución de las {propActivas} propiedades publicadas.</p>
          </div>
          <a className="cartera-link" href="/propiedades">Ver propiedades →</a>
        </div>
        <div className="cartera-bar">
          <div className="cartera-seg ink" style={{ width: `${(alquiler / totalOps) * 100}%` }} />
          <div className="cartera-seg venta" style={{ width: `${(venta / totalOps) * 100}%` }} />
        </div>
        <div className="cartera-legend">
          <span className="leg"><span className="sw ink" /><span className="n">{alquiler}</span> en alquiler</span>
          <span className="leg"><span className="sw venta" /><span className="n">{venta}</span> en venta</span>
          <span className="leg"><span className="star material-symbols-outlined">star</span><span className="n">{n(k.prop_destacadas)}</span> destacadas</span>
        </div>
      </div>

      {/* ===== Paneles ===== */}
      <div className="dash-grid">
        <div className="card">
          <h3 className="dash-card-title">Próximas visitas</h3>
          <p className="dash-card-sub">Agenda confirmada de los próximos días.</p>
          {visitas.length === 0 && <div className="dash-empty">No hay visitas próximas confirmadas.</div>}
          {visitas.map((v, i) => {
            const fb = fechaBlock(v.fecha);
            const wa = waLink(v.telefono);
            return (
              <div className="visita-row" key={i}>
                <div className={`visita-date${fb.hoy ? ' hoy' : ''}`}>
                  <span className="d">{fb.d}</span>
                  <span className="w">{fb.hoy ? 'HOY' : fb.w}</span>
                </div>
                <div className="visita-main">
                  <div className="visita-t1">{v.propiedad_titulo || 'Visita'}</div>
                  <div className="visita-t2">{v.nombre_cliente || 'Sin nombre'} · {v.hora} hs</div>
                </div>
                {wa && (
                  <a className="visita-chat" href={wa} target="_blank" rel="noreferrer" title="Contactar por WhatsApp">
                    <span className="material-symbols-outlined">chat</span>
                  </a>
                )}
              </div>
            );
          })}
        </div>

        <div className="card">
          <h3 className="dash-card-title">Últimas conversaciones</h3>
          <p className="dash-card-sub">Los leads más recientes que atendió el asistente.</p>
          {leads.length === 0 && <div className="dash-empty">Todavía no hay conversaciones.</div>}
          {leads.map((l, i) => {
            const st = leadStatus(l.message);
            const initial = String(l.display || '?').trim().charAt(0).toUpperCase();
            return (
              <div className="conv-row" key={i}>
                <div className={`conv-av v${i % 3}`}>{initial}</div>
                <div className="conv-main">
                  <div className="conv-head">
                    <span className="conv-name">{l.display}</span>
                    <span className={`cstatus ${st.cls}`}>{st.label}</span>
                  </div>
                  <div className="conv-msg">{l.message}</div>
                </div>
                <span className="conv-time">{l.cuando}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
