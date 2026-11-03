import { pool } from '@/lib/db';
import { resolvePhone } from '@/lib/waha';

export const dynamic = 'force-dynamic';

const waLink = (tel: string | null | undefined) => {
  const d = (tel ?? '').replace(/\D/g, '');
  return d.length >= 10 ? `https://wa.me/${d}` : null;
};

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

export default async function HomePage() {
  const { k, visitas, leads } = await getData();
  const n = (v: unknown) => Number(v) || 0;

  const kpis = [
    { label: 'Propiedades activas', value: n(k.prop_activas), icon: 'real_estate_agent' },
    { label: 'Visitas hoy', value: n(k.visitas_hoy), icon: 'event_available' },
    { label: 'Visitas próximas', value: n(k.visitas_prox), icon: 'calendar_month' },
    { label: 'Conversaciones', value: n(k.conversaciones), icon: 'forum' },
    { label: 'Derivaciones pendientes', value: n(k.derivaciones), icon: 'support_agent' },
  ];

  return (
    <div>
      <h2 className="page-title">Resumen</h2>
      <p className="page-sub">Un vistazo al estado de la operación, en vivo.</p>

      <div className="stat-grid">
        {kpis.map((s) => (
          <div className="stat-card" key={s.label}>
            <span className="material-symbols-outlined">{s.icon}</span>
            <span className="label">{s.label}</span>
            <span className="value">{s.value}</span>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 className="dash-card-title"><span className="material-symbols-outlined">inventory_2</span> Cartera disponible</h3>
        <p className="dash-card-sub">Distribución de las {n(k.prop_activas)} propiedades publicadas.</p>
        <div className="dash-split">
          <span className="dash-pill"><b>{n(k.prop_alquiler)}</b> en alquiler</span>
          <span className="dash-pill"><b>{n(k.prop_venta)}</b> en venta</span>
          <span className="dash-pill"><b>{n(k.prop_destacadas)}</b> destacadas</span>
        </div>
      </div>

      <div className="dash-grid">
        <div className="card">
          <h3 className="dash-card-title"><span className="material-symbols-outlined">event</span> Próximas visitas</h3>
          <p className="dash-card-sub">Agenda confirmada de los próximos días.</p>
          {visitas.length === 0 && <div className="dash-empty">No hay visitas próximas confirmadas.</div>}
          <ul className="dash-list">
            {visitas.map((v, i) => {
              const wa = waLink(v.telefono);
              return (
                <li key={i}>
                  <div className="main">
                    <div className="t1">{v.propiedad_titulo || 'Visita'}</div>
                    <div className="t2">{v.nombre_cliente || 'Sin nombre'} · {v.telefono || '—'}</div>
                  </div>
                  <div className="r">{v.fecha} · {v.hora} hs</div>
                  {wa && (
                    <a className="wa-ico" href={wa} target="_blank" rel="noreferrer" title="Contactar por WhatsApp">
                      <span className="material-symbols-outlined">chat</span>
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="card">
          <h3 className="dash-card-title"><span className="material-symbols-outlined">mark_chat_unread</span> Últimas conversaciones</h3>
          <p className="dash-card-sub">Los leads más recientes que atendió el asistente.</p>
          {leads.length === 0 && <div className="dash-empty">Todavía no hay conversaciones.</div>}
          <ul className="dash-list">
            {leads.map((l, i) => (
              <li key={i}>
                <div className="main">
                  <div className="t1">{l.display}</div>
                  <div className="t2">{l.message}</div>
                </div>
                <div className="r">{l.cuando}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
