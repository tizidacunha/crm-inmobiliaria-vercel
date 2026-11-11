import Link from 'next/link';
import { pool } from '@/lib/db';
import { resolvePhone } from '@/lib/waha';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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

const STATUS_CLS: Record<string, string> = {
  interesado: 'border-transparent bg-success/15 text-success-foreground',
  consultando: 'border-transparent bg-muted text-muted-foreground',
  derivado: 'border-transparent bg-accent text-accent-foreground',
  confirmada: 'border-transparent bg-secondary text-secondary-foreground',
};
const DOT_CLS: Record<string, string> = {
  ink: 'bg-secondary',
  accent: 'bg-primary',
  success: 'bg-success',
};

async function getData() {
  const [kpis, visitas, leadsRaw] = await Promise.all([
    pool.query(`
      SELECT
        (SELECT COUNT(*) FROM public.propiedades WHERE disponible) AS prop_activas,
        (SELECT COUNT(*) FROM public.propiedades WHERE disponible AND operacion LIKE 'alquiler%') AS prop_alquiler,
        (SELECT COUNT(*) FROM public.propiedades WHERE disponible AND operacion='venta') AS prop_venta,
        (SELECT COUNT(*) FROM public.propiedades WHERE disponible AND destacado) AS prop_destacadas,
        (SELECT COUNT(*) FROM public.visitas_programadas WHERE estado<>'cancelada' AND fecha_visita=CURRENT_DATE) AS visitas_hoy,
        (SELECT COUNT(*) FROM public.visitas_programadas WHERE estado<>'cancelada' AND fecha_visita>=CURRENT_DATE) AS visitas_prox,
        (SELECT COUNT(DISTINCT session_id) FROM public.conversaciones_inmobiliaria) AS conversaciones,
        (SELECT COUNT(*) FROM public.derivaciones WHERE estado='pendiente') AS derivaciones
    `),
    pool.query(`
      SELECT nombre_cliente, telefono, propiedad_titulo, estado,
             to_char(fecha_visita,'DD/MM') AS fecha, to_char(hora_visita,'HH24:MI') AS hora
      FROM public.visitas_programadas
      WHERE estado<>'cancelada' AND fecha_visita >= CURRENT_DATE
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
    <svg
      className="pointer-events-none absolute bottom-0 right-0 hidden h-[300px] w-[520px] md:block"
      viewBox="0 0 520 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <line x1="40" y1="210" x2="505" y2="210" stroke="#E6EBEF" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
      <line x1="95" y1="236" x2="470" y2="236" stroke="#E6EBEF" strokeWidth="1.6" strokeLinecap="round" opacity="0.32" />
      <line x1="150" y1="262" x2="430" y2="262" stroke="#E6EBEF" strokeWidth="1.6" strokeLinecap="round" opacity="0.16" />
      <path d="M185 210 A175 175 0 0 1 535 210" stroke="#3A4F60" strokeWidth="1.3" opacity="0.32" />
      <path d="M225 210 A135 135 0 0 1 495 210" stroke="#3A4F60" strokeWidth="1.3" opacity="0.5" />
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
    <div className="flex flex-col gap-6">
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden rounded-[22px] bg-secondary px-6 py-9 text-secondary-foreground md:px-10">
        <SunArt />
        <div className="text-xs font-bold uppercase tracking-[0.14em] text-secondary-foreground/60">{hoyStr}</div>
        <h1 className="my-3.5 max-w-[560px] font-display text-[32px] font-extrabold leading-[1.04] tracking-[-0.03em] text-white md:text-[44px]">
          Buen día, equipo.
          <br />
          {visitasHoy > 0
            ? `Hoy hay ${visitasHoy} ${visitasHoy === 1 ? 'visita' : 'visitas'} en agenda.`
            : 'Hoy no hay visitas en agenda.'}
        </h1>
        {prox && (
          <p className="max-w-[560px] text-sm text-secondary-foreground/90">
            Próxima: <b className="text-white">{prox.hora} hs</b> · {prox.propiedad_titulo} con {prox.nombre_cliente}.
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button render={<Link href="/visitas?dia=hoy" />}>
            <span className="material-symbols-outlined">calendar_month</span>
            Ver agenda de hoy
          </Button>
          {derivaciones > 0 && (
            <Button
              variant="outline"
              render={<Link href="/chats?filtro=derivados" />}
              className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              Revisar {derivaciones} {derivaciones === 1 ? 'derivación' : 'derivaciones'}
            </Button>
          )}
        </div>
      </section>

      {/* ===== KPIs ===== */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
        {kpis.map((s) => (
          <Card key={s.label} className="relative gap-0 py-5">
            <CardContent className="flex flex-col gap-2.5">
              <span className={cn('absolute right-5 top-5 size-2 rounded-full', DOT_CLS[s.dot])} />
              <span className="pr-5 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{s.label}</span>
              <span className="font-display text-5xl font-extrabold leading-[0.9] tracking-[-0.04em]">{s.value}</span>
              <span className="text-[13px] text-muted-foreground">{s.hint}</span>
            </CardContent>
          </Card>
        ))}
        <Link href="/chats?filtro=derivados" className="contents">
          <Card className="relative cursor-pointer gap-0 bg-primary py-5 text-primary-foreground ring-0 transition-transform hover:-translate-y-0.5">
            <CardContent className="flex flex-col gap-2.5">
              <span className="absolute right-5 top-5 size-2 rounded-full bg-secondary" />
              <span className="pr-5 text-[11px] font-bold uppercase tracking-[0.1em]">Derivaciones</span>
              <span className="font-display text-5xl font-extrabold leading-[0.9] tracking-[-0.04em]">{derivaciones}</span>
              <span className="text-[13px]">Requiere un asesor</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* ===== Cartera ===== */}
      <Card className="gap-4">
        <CardHeader className="flex-row items-start justify-between">
          <div>
            <CardTitle className="font-display text-2xl tracking-[-0.02em]">Cartera disponible</CardTitle>
            <CardDescription>Distribución de las {propActivas} propiedades publicadas.</CardDescription>
          </div>
          <Link href="/propiedades" className="text-sm font-bold text-cobalt">
            Ver propiedades →
          </Link>
        </CardHeader>
        <CardContent>
          <div className="flex h-4 gap-1.5">
            <div className="h-full rounded-full bg-secondary" style={{ width: `${(alquiler / totalOps) * 100}%` }} />
            <div className="h-full rounded-full bg-primary" style={{ width: `${(venta / totalOps) * 100}%` }} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <span className="size-2.5 rounded-sm bg-secondary" />
              <b className="font-display text-xl text-foreground">{alquiler}</b> en alquiler
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="size-2.5 rounded-sm bg-primary" />
              <b className="font-display text-xl text-foreground">{venta}</b> en venta
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">star</span>
              <b className="font-display text-xl text-foreground">{n(k.prop_destacadas)}</b> destacadas
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ===== Paneles ===== */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-2xl tracking-[-0.02em]">Próximas visitas</CardTitle>
            <CardDescription>Agenda de los próximos días (confirmadas y pendientes).</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col">
            {visitas.length === 0 && <div className="py-3.5 text-sm text-muted-foreground">No hay visitas próximas.</div>}
            {visitas.map((v, i) => {
              const fb = fechaBlock(v.fecha);
              const wa = waLink(v.telefono);
              return (
                <div key={i} className="flex items-center gap-4 border-t border-muted py-3 first:border-t-0">
                  <div
                    className={cn(
                      'flex h-14 w-13 shrink-0 flex-col items-center justify-center rounded-lg',
                      fb.hoy ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground'
                    )}
                  >
                    <span className="font-display text-[22px] font-extrabold leading-none">{fb.d}</span>
                    <span className={cn('mt-0.5 text-[10px] font-bold uppercase tracking-wide', fb.hoy ? 'text-primary-foreground' : 'text-muted-foreground')}>
                      {fb.hoy ? 'HOY' : fb.w}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14.5px] font-semibold">{v.propiedad_titulo || 'Visita'}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-[13px] text-muted-foreground">
                      <span className="truncate">{v.nombre_cliente || 'Sin nombre'} · {v.hora} hs</span>
                      {v.estado === 'pendiente' && (
                        <Badge className="shrink-0 border-transparent bg-yellow-100 text-yellow-800">Pendiente</Badge>
                      )}
                    </div>
                  </div>
                  {wa && (
                    <Button
                      variant="outline"
                      size="icon"
                      render={<a href={wa} target="_blank" rel="noreferrer" title="Contactar por WhatsApp" />}
                      className="size-11 shrink-0 rounded-xl text-primary"
                    >
                      <span className="material-symbols-outlined">chat</span>
                    </Button>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-2xl tracking-[-0.02em]">Últimas conversaciones</CardTitle>
            <CardDescription>Los leads más recientes que atendió el asistente.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col">
            {leads.length === 0 && <div className="py-3.5 text-sm text-muted-foreground">Todavía no hay conversaciones.</div>}
            {leads.map((l, i) => {
              const st = leadStatus(l.message);
              const orange = i === leads.length - 1;
              return (
                <div key={i} className="flex items-start gap-3 border-t border-muted py-3.5 first:border-t-0">
                  <Avatar className="size-11 shrink-0">
                    <AvatarFallback className={cn('font-display text-sm font-bold', orange ? 'bg-primary text-primary-foreground' : 'bg-secondary text-white')}>
                      {iniciales(l.display)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[14.5px] font-bold">{l.display}</span>
                      <Badge className={cn('shrink-0', STATUS_CLS[st.cls])}>{st.label}</Badge>
                    </div>
                    <div className="mt-0.5 truncate text-[13px] text-muted-foreground">{l.message}</div>
                  </div>
                  <span className="shrink-0 pt-0.5 text-[12.5px] text-muted-foreground">{l.cuando}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
