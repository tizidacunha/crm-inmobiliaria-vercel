'use client';

import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';

type Visita = {
  id: number;
  chat_id: string;
  nombre_cliente: string | null;
  telefono: string | null;
  propiedad_titulo: string | null;
  fecha_visita: string;
  hora_visita: string;
  notas: string | null;
  estado: string;
};

const COLORS: Record<string, { bg: string; border: string; text: string }> = {
  confirmada: { bg: '#E7EAED', border: '#0F1E2A', text: '#0F1E2A' },
  hoy: { bg: '#FDE6DB', border: '#F26B3A', text: '#B8441A' },
  cancelada: { bg: '#EEF0F2', border: '#C7CCD1', text: '#6B7280' },
  pendiente: { bg: '#FDE6DB', border: '#F0B79A', text: '#8F3212' },
};
const colorDe = (estado: string, esHoy = false) =>
  esHoy && estado !== 'cancelada' ? COLORS.hoy : COLORS[estado] ?? COLORS.pendiente;
const inicial = (n: string | null) => (n?.trim()?.[0] ?? '?').toUpperCase();

export default function CalendarClient({ visitas }: { visitas: Visita[] }) {
  const [sel, setSel] = useState<Visita | null>(null);

  const hoy = new Date().toLocaleDateString('en-CA');
  const en7 = new Date(Date.now() + 7 * 864e5).toLocaleDateString('en-CA');
  const kpi = {
    hoy: visitas.filter((v) => v.fecha_visita === hoy && v.estado !== 'cancelada').length,
    semana: visitas.filter((v) => v.fecha_visita >= hoy && v.fecha_visita <= en7 && v.estado !== 'cancelada').length,
    confirmadas: visitas.filter((v) => v.estado === 'confirmada').length,
    canceladas: visitas.filter((v) => v.estado === 'cancelada').length,
  };

  const proximas = visitas.filter((v) => v.estado !== 'cancelada' && v.fecha_visita >= hoy).slice(0, 5);

  const events = visitas.map((v) => {
    const c = colorDe(v.estado, v.fecha_visita === hoy);
    return {
      id: String(v.id),
      title: `${v.hora_visita?.slice(0, 5) ?? ''} · ${v.propiedad_titulo ?? 'Visita'}`,
      date: v.fecha_visita,
      backgroundColor: c.bg,
      borderColor: c.border,
      textColor: c.text,
      extendedProps: v,
    };
  });

  const waLink = (tel: string | null) => {
    const d = (tel ?? '').replace(/\D/g, '');
    return d.length >= 8 ? `https://wa.me/${d}` : null;
  };

  return (
    <div className="visitas-page">
      <div className="stat-grid">
        <div className="stat-card"><span className="label">Visitas hoy</span><span className="value">{kpi.hoy}</span></div>
        <div className="stat-card"><span className="label">Próximos 7 días</span><span className="value">{kpi.semana}</span></div>
        <div className="stat-card"><span className="label">Confirmadas</span><span className="value" style={{ color: 'var(--accent)' }}>{kpi.confirmadas}</span></div>
        <div className="stat-card"><span className="label">Canceladas</span><span className="value" style={{ color: 'var(--danger)' }}>{kpi.canceladas}</span></div>
      </div>

      <div className="visitas-grid">
        <div className="card visitas-cal">
          <FullCalendar
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            locale="es"
            firstDay={1}
            height="auto"
            buttonText={{ today: 'Hoy' }}
            headerToolbar={{ left: 'title', center: '', right: 'prev,today,next' }}
            dayMaxEvents={3}
            events={events}
            eventClick={(info) => setSel(info.event.extendedProps as Visita)}
          />
          <div className="cal-legend">
            <span className="cal-leg"><span className="sw confirmada" />Confirmada</span>
            <span className="cal-leg"><span className="sw hoy" />Hoy</span>
            <span className="cal-leg"><span className="sw pendiente" />Pendiente</span>
            <span className="cal-leg"><span className="sw cancelada" />Cancelada</span>
          </div>
        </div>

        <aside className="card visita-panel">
          {!sel && (
            <>
              <h3 className="panel-title">Próximas visitas</h3>
              {proximas.length === 0 && (
                <p className="muted" style={{ fontSize: 13 }}>No hay visitas próximas. Hacé click en una del calendario para ver el detalle.</p>
              )}
              <ul className="prox-list">
                {proximas.map((v) => (
                  <li key={v.id} onClick={() => setSel(v)}>
                    <div className="avatar">{inicial(v.nombre_cliente)}</div>
                    <div className="prox-info">
                      <span className="prox-prop">{v.propiedad_titulo ?? 'Visita'}</span>
                      <span className="prox-when">{v.fecha_visita} · {v.hora_visita?.slice(0, 5)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          {sel && (
            <>
              <div className="panel-head">
                <div className="avatar large">{inicial(sel.nombre_cliente)}</div>
                <div>
                  <div className="panel-name">{sel.nombre_cliente || 'Sin nombre'}</div>
                  <span className={`badge ${sel.estado}`}>{sel.estado}</span>
                </div>
              </div>

              <dl className="panel-rows">
                <div><dt>Propiedad</dt><dd>{sel.propiedad_titulo || '—'}</dd></div>
                <div><dt>Fecha y hora</dt><dd>{sel.fecha_visita} · {sel.hora_visita?.slice(0, 5)} hs</dd></div>
                <div><dt>Teléfono</dt><dd>{sel.telefono || '—'}</dd></div>
                {sel.notas && <div><dt>Notas</dt><dd>{sel.notas}</dd></div>}
              </dl>

              {waLink(sel.telefono) && (
                <a className="btn btn-success panel-wa" href={waLink(sel.telefono)!} target="_blank" rel="noreferrer">
                  <span className="material-symbols-outlined">chat</span>
                  Contactar por WhatsApp
                </a>
              )}
              <button className="btn panel-close" onClick={() => setSel(null)}>Cerrar</button>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
