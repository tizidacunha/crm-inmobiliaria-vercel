'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { cn } from '@/lib/utils';
import { telefonoLocal, formatearTelefono } from '@/lib/asesores';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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

// El color de cada visita indica SOLO su estado. El día de hoy ya se distingue por la celda resaltada del calendario.
const COLORS: Record<string, { bg: string; border: string; text: string }> = {
  confirmada: { bg: '#E7EAED', border: '#0F1E2A', text: '#0F1E2A' },
  cancelada: { bg: '#EEF0F2', border: '#C7CCD1', text: '#6B7280' },
  pendiente: { bg: '#FEF3C7', border: '#EAB308', text: '#854D0E' },
};
const colorDe = (estado: string) => COLORS[estado] ?? COLORS.pendiente;
const inicial = (n: string | null) => (n?.trim()?.[0] ?? '?').toUpperCase();

// "2026-11-11" → "miércoles 11/11/2026" (mediodía para que la zona horaria no corra el día).
const fechaLarga = (iso: string) => {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.toLocaleDateString('es-AR', { weekday: 'long' })} ${d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
};
// "5491144556677" → "+54 9 11 4455-6677"; si no es un celular argentino, se muestra tal cual.
const telefonoLegible = (tel: string | null) => {
  if (!tel) return '—';
  const local = telefonoLocal(tel);
  return local.length === 10 ? `+54 9 ${formatearTelefono(local)}` : tel;
};

const LEYENDA = [
  { k: 'Confirmada', c: '#0F1E2A' },
  { k: 'Pendiente', c: '#EAB308' },
  { k: 'Cancelada', c: '#C7CCD1' },
];

const ESTADO_BADGE: Record<string, string> = {
  confirmada: 'bg-secondary text-white',
  reprogramada: 'bg-accent text-accent-foreground',
  pendiente: 'bg-yellow-100 text-yellow-800',
  cancelada: 'bg-muted text-muted-foreground',
};

export default function CalendarClient({ visitas }: { visitas: Visita[] }) {
  const isMobile = useIsMobile();
  const params = useSearchParams();

  const hoy = new Date().toLocaleDateString('en-CA');
  const en7 = new Date(Date.now() + 7 * 864e5).toLocaleDateString('en-CA');

  const [sel, setSel] = useState<Visita | null>(null);
  // Día seleccionado (YYYY-MM-DD). Si venimos del resumen con ?dia=hoy, arranca en hoy.
  const [diaSel, setDiaSel] = useState<string | null>(params.get('dia') === 'hoy' ? hoy : null);
  const kpi = {
    hoy: visitas.filter((v) => v.fecha_visita === hoy && v.estado !== 'cancelada').length,
    semana: visitas.filter((v) => v.fecha_visita >= hoy && v.fecha_visita <= en7 && v.estado !== 'cancelada').length,
    confirmadas: visitas.filter((v) => v.estado === 'confirmada').length,
    canceladas: visitas.filter((v) => v.estado === 'cancelada').length,
  };

  const proximas = visitas.filter((v) => v.estado !== 'cancelada' && v.fecha_visita >= hoy).slice(0, 5);

  const visitasDia = diaSel
    ? visitas
        .filter((v) => v.fecha_visita === diaSel)
        .sort((a, b) => (a.hora_visita ?? '').localeCompare(b.hora_visita ?? ''))
    : [];
  const fmtDia = (d: string) =>
    new Date(`${d}T00:00:00`).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

  const events = visitas.map((v) => {
    const c = colorDe(v.estado);
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

  const kpis = [
    { label: 'Visitas hoy', value: kpi.hoy, cls: 'text-foreground' },
    { label: 'Próximos 7 días', value: kpi.semana, cls: 'text-foreground' },
    { label: 'Confirmadas', value: kpi.confirmadas, cls: 'text-primary' },
    { label: 'Canceladas', value: kpi.canceladas, cls: 'text-destructive' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((s) => (
          <Card key={s.label} className="gap-0 py-5">
            <CardContent className="flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{s.label}</span>
              <span className={cn('font-display text-5xl font-extrabold leading-[0.9] tracking-[-0.04em]', s.cls)}>{s.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardContent>
            <FullCalendar
              key={isMobile ? 'list' : 'grid'}
              plugins={[dayGridPlugin, listPlugin, interactionPlugin]}
              initialView={isMobile ? 'listWeek' : 'dayGridMonth'}
              initialDate={diaSel ?? undefined}
              locale="es"
              firstDay={1}
              height="auto"
              buttonText={{ today: 'Hoy', list: 'Lista', month: 'Mes' }}
              headerToolbar={
                isMobile
                  ? { left: 'title', center: '', right: 'prev,next' }
                  : { left: 'title', center: '', right: 'prev,today,next' }
              }
              dayMaxEvents={3}
              events={events}
              dateClick={(info) => { setDiaSel(info.dateStr); setSel(null); }}
              eventClick={(info) => setSel(info.event.extendedProps as Visita)}
              noEventsText="No hay visitas en este rango"
            />
            <div className="mt-4 flex flex-wrap gap-4 border-t border-muted pt-4">
              {LEYENDA.map((l) => (
                <span key={l.k} className="inline-flex items-center gap-2 text-[13px] font-semibold text-muted-foreground">
                  <span className="size-2.5 rounded-full" style={{ background: l.c }} />
                  {l.k}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:sticky lg:top-24 lg:self-start">
          <CardContent>
            {!sel && diaSel && (
              <>
                <div className="mb-3.5 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-xl font-bold capitalize tracking-[-0.02em]">{fmtDia(diaSel)}</h3>
                    <p className="text-[12.5px] text-muted-foreground">{visitasDia.length} {visitasDia.length === 1 ? 'visita' : 'visitas'}</p>
                  </div>
                  <button onClick={() => setDiaSel(null)} className="shrink-0 text-[13px] font-bold text-cobalt">Próximas</button>
                </div>
                {visitasDia.length === 0 && (
                  <p className="text-[13px] text-muted-foreground">No hay visitas este día.</p>
                )}
                <ul className="flex flex-col gap-1">
                  {visitasDia.map((v) => (
                    <li
                      key={v.id}
                      onClick={() => setSel(v)}
                      className="flex cursor-pointer items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted"
                    >
                      <Avatar className="size-10">
                        <AvatarFallback className="bg-secondary font-display text-sm font-bold text-white">{inicial(v.nombre_cliente)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13.5px] font-semibold">{v.propiedad_titulo ?? 'Visita'}</div>
                        <div className="text-[12.5px] text-muted-foreground">{v.hora_visita?.slice(0, 5)} · {v.nombre_cliente || 'Sin nombre'}</div>
                      </div>
                      <Badge className={cn('shrink-0 border-transparent capitalize', ESTADO_BADGE[v.estado] ?? 'bg-muted text-muted-foreground')}>{v.estado}</Badge>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {!sel && !diaSel && (
              <>
                <h3 className="mb-3.5 font-display text-xl font-bold tracking-[-0.02em]">Próximas visitas</h3>
                <p className="mb-3 text-[12.5px] text-muted-foreground">Tocá un día del calendario para ver todas sus visitas.</p>
                {proximas.length === 0 && (
                  <p className="text-[13px] text-muted-foreground">No hay visitas próximas. Hacé click en una del calendario para ver el detalle.</p>
                )}
                <ul className="flex flex-col gap-1">
                  {proximas.map((v) => (
                    <li
                      key={v.id}
                      onClick={() => setSel(v)}
                      className="flex cursor-pointer items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted"
                    >
                      <Avatar className="size-10">
                        <AvatarFallback className="bg-secondary font-display text-sm font-bold text-white">{inicial(v.nombre_cliente)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="truncate text-[13.5px] font-semibold">{v.propiedad_titulo ?? 'Visita'}</div>
                        <div className="text-[12.5px] text-muted-foreground">{v.fecha_visita} · {v.hora_visita?.slice(0, 5)}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {sel && (
              <>
                <div className="mb-4 flex items-center gap-3">
                  <Avatar className="size-13">
                    <AvatarFallback className="bg-secondary font-display text-base font-bold text-white">{inicial(sel.nombre_cliente)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-display text-lg font-bold tracking-[-0.02em]">{sel.nombre_cliente || 'Sin nombre'}</div>
                    <Badge className={cn('mt-1 border-transparent capitalize', ESTADO_BADGE[sel.estado] ?? 'bg-muted text-muted-foreground')}>
                      {sel.estado}
                    </Badge>
                  </div>
                </div>

                <dl className="flex flex-col gap-3.5">
                  <Row t="Propiedad" d={sel.propiedad_titulo || '—'} />
                  <Row t="Fecha y hora" d={`${fechaLarga(sel.fecha_visita)} · ${sel.hora_visita?.slice(0, 5)} hs`} />
                  <Row t="Teléfono" d={telefonoLegible(sel.telefono)} />
                  {sel.notas && <Row t="Notas" d={sel.notas} />}
                </dl>

                {waLink(sel.telefono) && (
                  <Button variant="secondary" render={<a href={waLink(sel.telefono)!} target="_blank" rel="noreferrer" />} className="mt-4 w-full">
                    <span className="material-symbols-outlined">chat</span>
                    Contactar por WhatsApp
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSel(null)} className="mt-2 w-full">Cerrar</Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ t, d }: { t: string; d: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{t}</dt>
      <dd className="text-[14.5px] font-medium">{d}</dd>
    </div>
  );
}
