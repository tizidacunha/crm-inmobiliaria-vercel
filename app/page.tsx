import { pool } from '@/lib/db';
import { resolvePhone } from '@/lib/waha';

export const dynamic = 'force-dynamic';

const waLink = (tel: string | null | undefined) => {
  const d = (tel ?? '').replace(/\D/g, '');
  return d.length >= 10 ? `https://wa.me/${d}` : null;
};

const WEEKDAYS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/* De 'DD/MM' → { d, w, hoy } para el bloque de fecha de cada visita. */
function fechaBlock(fecha: string) {
  const [dd, mm] = (fecha || '').split('/').map((x) => parseInt(x, 10));
  const now = new Date();
  const date = new Date(now.getFullYear(), (mm || 1) - 1, dd || 1);
  const hoy = dd === now.getDate() && mm === now.getMonth() + 1;
  return { d: String(dd || '').padStart(2, '0'), w: WEEKDAYS[date.getDay()] ?? '', hoy };
}

/* 'DD/MM' → "viernes 7" (día de la semana + número) para hints. */
function fechaLarga(fecha: string) {
  const [dd, mm] = (fecha || '').split('/').map((x) => parseInt(x, 10));
  if (!dd) return '';
  const d = new Date(new Date().getFullYear(), (mm || 1) - 1, dd);
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  return `${dias[d.getDay()]} ${dd}`;
}

/* Estado del lead inferido del último mensaje del hilo. */
function leadStatus(msg: string): { cls: string; label: string } {
  const m = (msg || '').toLowerCase();
  if (/\bderiv|asesor\b/.test(m)) return { cls: 'derivado', label: 'Derivado' };
  if (/confirmad/.test(m)) return { cls: 'confirmada', label: 'Visita confirmada' };
  if (/interesa|me interesa|sí me/.test(m)) return { cls: 'interesado', label: 'Interesado' };
  return { cls: 'consultando', label: 'Consultando' };
}

/* Iniciales de 2 letras a partir del nombre (o del teléfono). */
function iniciales(nombre: string) {
  const s = String(nombre || '').trim();
  const partes = s.split(/\s+/).filter(Boolean);
  if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
  const limpio = s.replace(/[^A-Za-zÀ-ÿ0-9]/g, '');
  return (limpio.slice(0, 2) || '?').toUpperCase();
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
      SELECT user_id, user_name, message, to_char(timestamp,'HH24:MI') AS cuando
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
    <svg className="hero-art" viewBox="0 0 520 300" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* líneas de horizonte */}
      <line x1="40" y1="210" x2="505" y2="210" stroke="#E6EBEF" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
      <line x1="95" y1="236" x2="470" y2="236" stroke="#E6EBEF" strokeWidth="1.6" strokeLinecap="round" opacity="0.32" />
      <line x1="150" y1="262" x2="430" y2="262" stroke="#E6EBEF" strokeWidth="1.6" strokeLinecap="round" opacity="0.16" />
      {/* arcos concéntricos */}
      <path d="M185 210 A175 175 0 0 1 535 210" stroke="#3A4F60" strokeWidth="1.3" opacity="0.32" />
      <path d="M225 210 A135 135 0 0 1 495 210" stroke="#3A4F60" strokeWidth="1.3" opacity="0.5" />
      {/* sol semicírculo sobre el horizonte */}
      <path d="M265 210 A95 95 0 0 1 455 210 Z" fill="#F26B3A" />
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
  const visitasProx = n(k.visitas_prox);
  const derivaciones = n(k.derivaciones);
  const propActivas = n(k.prop_activas);
  const alquiler = n(k.prop_alquiler);
  const venta = n(k.prop_venta);
  const totalOps = alquiler + venta || 1;
  const prox = visitas[0];

  const primeraHoy = visitas.find((v) => fechaBlock(v.fecha).hoy)?.hora;
  const ultimaProx = visitas.length ? fechaLarga(visitas[visitas.length - 1].fecha) : '';

  const kpis = [
    { label: 'Propiedades activas', value: propActivas, dot: 'ink', hint: `${alquiler} alquiler · ${venta} venta` },
    { label: 'Visitas hoy', value: visitasHoy, dot: 'accent', hint: primeraHoy ? `Primera a las ${primeraHoy}` : 'Sin visitas hoy' },
    { label: 'Visitas próximas', value: visitasProx, dot: 'ink', hint: ultimaProx ? `Hasta el ${ultimaProx}` : 'Agenda despejada' },
    { label: 'Conversaciones', value: n(k.conversaciones), dot: 'success', hint: 'Atendidas por el bot' },
  ];

  return (
    <div>
      {/* ===== Hero ===== */}
      <section className="hero">
        <SunArt />
        <div className="hero-date">{hoyStr}</div>
        <h1 className="hero-title">
          Buen día, equipo.<br />
          {visitasHoy > 0 ? `Hoy hay ${visitasHoy} ${visitasHoy === 1 ? 'visita' : 'visitas'} en agenda.` : 'Hoy no hay visitas en agenda.'}
        </h1>
        {prox && (
          <p className="hero-next">
            Próxima: <b>{prox.hora} hs</b> · {prox.propiedad_titulo} con {prox.nombre_cliente}.
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
            <span className={`kdot ${s.dot}`} />
            <span className="label">{s.label}</span>
            <span className="value">{s.value}</span>
            <span className="hint">{s.hint}</span>
          </div>
        ))}
        <a className="stat-card action" href="/chats">
          <span className="kdot" />
          <span className="label">Derivaciones</span>
          <span className="value">{derivaciones}</span>
          <span className="hint">Requiere un asesor</span>
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
            const cls = i === leads.length - 1 ? 'v1' : 'v0';
            return (
              <div className="conv-row" key={i}>
                <div className={`conv-av ${cls}`}>{iniciales(l.display)}</div>
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
