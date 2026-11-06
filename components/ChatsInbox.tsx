import Link from 'next/link';
import { pool } from '@/lib/db';
import { resolvePhone } from '@/lib/waha';
import { cn } from '@/lib/utils';
import AutoRefresh from '@/components/AutoRefresh';
import LeadList, { Lead } from '@/components/LeadList';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

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

const waLink = (tel: string | null) => {
  const d = (tel ?? '').replace(/\D/g, '');
  return d.length >= 8 ? `https://wa.me/${d}` : null;
};

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

  const candidatas = propiedades
    .filter((p) => p.disponible)
    .filter((p) => (!operacion || String(p.operacion).startsWith(operacion)))
    .filter((p) => (!barrio || String(p.barrio).toLowerCase() === barrio.toLowerCase()))
    .sort((a, b) => Number(b.destacado) - Number(a.destacado));
  const sugerida = (barrio || operacion) ? candidatas[0] ?? null : null;

  return { chips, sugerida, barrio };
}

type Asesor = { id: number; nombre: string; telefono: string | null; sucursal: string; zonas: string[] };

/* Asesor sugerido por zona: activo cuya zonas[] cubre el barrio detectado (misma lógica que el bot). */
function asesorPorZona(asesores: Asesor[], barrio: string | null): Asesor | null {
  if (!barrio) return null;
  const b = barrio.toLowerCase();
  return asesores.find((a) => (a.zonas || []).some((z) => String(z).toLowerCase() === b)) ?? null;
}

export default async function ChatsInbox({ selectedId }: { selectedId?: string }) {
  const explicit = !!selectedId;

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
    return <Card className="p-8"><p className="text-sm text-muted-foreground">Todavía no hay conversaciones.</p></Card>;
  }

  const selected = leads.find((l) => l.userId === selectedId) ?? leads[0];

  const { rows: thread } = await pool.query(
    `SELECT user_id, user_name, message, role, timestamp, message_id
     FROM public.conversaciones_inmobiliaria WHERE user_id = $1 ORDER BY timestamp ASC`,
    [selected.userId]
  );
  const phone = await resolvePhone(selected.userId);

  const [{ rows: props }, { rows: asesores }] = await Promise.all([
    pool.query(`
      SELECT id, titulo, operacion, precio, moneda, ambientes, barrio, disponible, destacado
      FROM public.propiedades
    `),
    pool.query(`
      SELECT id, nombre, telefono, sucursal, zonas
      FROM public.asesores WHERE activo
    `),
  ]);
  const mensajesCliente = thread.filter((m) => m.role !== 'IA').map((m) => String(m.message || ''));
  const { chips, sugerida, barrio } = derivarContexto(mensajesCliente, props);
  const asesor = asesorPorZona(asesores as Asesor[], barrio);

  let lastDay = '';

  return (
    <div className="grid gap-5 lg:grid-cols-[330px_1fr] xl:grid-cols-[330px_1fr_300px]">
      <LeadList leads={leads} selectedId={selected.userId} className={cn(explicit && 'hidden lg:flex')} />

      <Card className={cn('flex max-h-[calc(100vh-150px)] min-h-[480px] gap-0 p-0', !explicit && 'hidden lg:flex')}>
        <div className="flex items-center gap-3 border-b border-muted px-4 py-4 md:px-5">
          <Link href="/chats" className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-muted lg:hidden" aria-label="Volver">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <Avatar className="size-11 shrink-0">
            <AvatarFallback className="bg-secondary font-display text-sm font-bold text-white">{selected.initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-lg font-bold tracking-[-0.02em]">{selected.name}</div>
            <div className="truncate text-[12.5px] text-muted-foreground">
              {phone ? `${phone} · ` : ''}WhatsApp · atendido por el asistente
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" render={<Link href="/visitas" />} className="hidden sm:inline-flex">Agendar visita</Button>
            <AutoRefresh intervalMs={4000} />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-2.5 p-5">
            {thread.map((m, i) => {
              const d = new Date(m.timestamp as string);
              const dayKey = d.toDateString();
              const showDay = dayKey !== lastDay;
              lastDay = dayKey;
              const isIA = m.role === 'IA';
              return (
                <div key={m.message_id || i} className="contents">
                  {showDay && (
                    <div className="my-2 self-center rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">{diaLargo(d)}</div>
                  )}
                  <div className={cn('flex', isIA ? 'justify-end' : 'justify-start')}>
                    <div
                      className={cn(
                        'max-w-[74%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                        isIA ? 'rounded-br-sm bg-secondary text-secondary-foreground' : 'rounded-bl-sm border border-border bg-muted'
                      )}
                    >
                      {isIA && (
                        <span className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-primary">
                          <span className="material-symbols-outlined text-[14px]">wb_twilight</span>
                          Asistente Horizonte
                        </span>
                      )}
                      {m.message}
                      <span className="mt-1.5 block text-[10.5px] opacity-70">{hhmm(m.timestamp)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {thread.length === 0 && <p className="text-sm text-muted-foreground">No hay mensajes en esta conversación.</p>}
          </div>
        </ScrollArea>
      </Card>

      <aside className={cn('flex flex-col gap-4', 'hidden xl:flex')}>
        {chips.length > 0 && (
          <Card className="gap-3 p-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Qué busca</div>
            <div className="flex flex-wrap gap-2">
              {chips.map((c, i) => (
                <Badge key={c} className={cn('border-transparent', i === 0 ? 'bg-secondary text-white' : 'bg-muted text-neutral-700')}>{c}</Badge>
              ))}
            </div>
          </Card>
        )}

        {sugerida && (
          <Card className="gap-0 bg-secondary p-5 text-secondary-foreground ring-0">
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-secondary-foreground/60">Propiedad sugerida</div>
            <div className="mt-3 font-display text-[26px] font-extrabold tracking-[-0.03em] text-white">{fmtPrecio(sugerida)}</div>
            <div className="mb-4 mt-1.5 text-[13px] leading-relaxed text-secondary-foreground/60">
              {[sugerida.ambientes != null ? `${sugerida.ambientes} amb.` : null, sugerida.barrio].filter(Boolean).join(' · ')}
            </div>
            <Button render={<Link href={`/propiedades?id=${sugerida.id}`} />} className="w-full">Ver ficha</Button>
          </Card>
        )}

        {selected.derivado && (
          <Card className="gap-3 p-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Asesor asignado</div>
            {asesor ? (
              <>
                <div className="flex items-center gap-3">
                  <Avatar className="size-11 shrink-0">
                    <AvatarFallback className="bg-secondary font-display text-sm font-bold text-white">{iniciales(asesor.nombre)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate font-display text-base font-bold tracking-[-0.02em]">{asesor.nombre}</div>
                    <div className="text-[12.5px] text-muted-foreground">{asesor.sucursal}{barrio ? ` · ${barrio}` : ''}</div>
                  </div>
                </div>
                {waLink(asesor.telefono) && (
                  <Button variant="outline" render={<a href={waLink(asesor.telefono)!} target="_blank" rel="noreferrer" />} className="w-full">
                    <span className="material-symbols-outlined">chat</span>
                    Contactar al asesor
                  </Button>
                )}
                <p className="text-[12px] text-muted-foreground">Sugerido por la zona ({barrio}). Confirmá la asignación antes de derivar.</p>
              </>
            ) : (
              <p className="text-[13px] text-muted-foreground">
                No se detectó un asesor por zona{barrio ? ` para ${barrio}` : ''}. Asigná uno manualmente.
              </p>
            )}
          </Card>
        )}
      </aside>
    </div>
  );
}
