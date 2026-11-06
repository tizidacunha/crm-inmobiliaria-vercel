'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { ResponsiveDialog } from '@/components/responsive-dialog';

export type Propiedad = {
  id: number;
  titulo: string;
  descripcion: string | null;
  tipo: string;
  operacion: string;
  precio: number;
  moneda: string;
  ambientes: number | null;
  dormitorios: number | null;
  banos: number | null;
  superficie_m2: number | null;
  piso: string | null;
  direccion: string;
  barrio: string;
  ciudad: string | null;
  caracteristicas: string[] | null;
  expensas: number | null;
  requisitos_garantia: string | null;
  disponible: boolean;
  destacado: boolean;
  codigo_aviso: string | null;
  url_publica: string | null;
  imagen_principal: string | null;
  imagenes: string[] | null;
};

export type Visita = {
  id: number;
  propiedad_id: number | null;
  nombre_cliente: string | null;
  telefono: string | null;
  fecha_visita: string;
  hora_visita: string;
  estado: string;
};

const OPERACIONES = ['venta', 'alquiler', 'alquiler_temp'];
const OPERACION_LABEL: Record<string, string> = {
  venta: 'Venta', alquiler: 'Alquiler', alquiler_temp: 'Alquiler temp.',
};
const TIPO_LABEL: Record<string, string> = {
  departamento: 'Departamento', casa: 'Casa', ph: 'PH', local: 'Local',
};
const ESTADO_BADGE: Record<string, string> = {
  confirmada: 'bg-secondary text-white',
  reprogramada: 'bg-accent text-accent-foreground',
  pendiente: 'bg-accent text-accent-foreground',
  cancelada: 'bg-muted text-muted-foreground',
};

const fmt = (n: number | string) => Number(n).toLocaleString('es-AR', { maximumFractionDigits: 2 });
const precioTexto = (p: Propiedad) => `${p.moneda === 'USD' ? 'USD' : '$'} ${fmt(p.precio)}`;
const inicialNombre = (n: string | null) => (n?.trim()?.[0] ?? '?').toUpperCase();
const waLink = (tel: string | null) => {
  const d = (tel ?? '').replace(/\D/g, '');
  return d.length >= 8 ? `https://wa.me/${d}` : null;
};

// La principal primero, sin duplicados
function fotosDe(p: Propiedad): string[] {
  const lista = [p.imagen_principal, ...(p.imagenes ?? [])].filter((u): u is string => !!u);
  return Array.from(new Set(lista));
}

/* Ilustración de respaldo (casa + atardecer) cuando la propiedad no tiene fotos. */
function HouseIllus({ tone }: { tone: 'ink' | 'rent' }) {
  const linea = tone === 'ink' ? '#E6EBEF' : '#0F1E2A';
  const sol = tone === 'ink' ? '#F26B3A' : '#FFFFFF';
  return (
    <svg className="absolute inset-0 size-full" viewBox="0 0 360 210" fill="none" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M204 150 A46 46 0 0 1 296 150 Z" fill={sol} />
      <line x1="24" y1="150" x2="336" y2="150" stroke={linea} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <line x1="60" y1="172" x2="300" y2="172" stroke={linea} strokeWidth="2" strokeLinecap="round" opacity="0.35" />
      <path d="M84 150 L84 92 L112 66 L140 92 L140 150" stroke={linea} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M104 150 L104 116 L122 116 L122 150" stroke={linea} strokeWidth="2.2" strokeLinejoin="round" />
    </svg>
  );
}

function PropGallery({ fotos, alt, tone }: { fotos: string[]; alt: string; tone: 'ink' | 'rent' }) {
  const [rotas, setRotas] = useState<Set<string>>(new Set());
  const [api, setApi] = useState<CarouselApi>();
  const [cur, setCur] = useState(0);
  const visibles = fotos.filter((f) => !rotas.has(f));

  useEffect(() => {
    if (!api) return;
    setCur(api.selectedScrollSnap());
    const on = () => setCur(api.selectedScrollSnap());
    api.on('select', on);
    return () => { api.off('select', on); };
  }, [api]);

  if (visibles.length === 0) return <HouseIllus tone={tone} />;

  return (
    <Carousel setApi={setApi} className="absolute inset-0 size-full" opts={{ loop: true }}>
      <CarouselContent className="ml-0 h-52">
        {visibles.map((f) => (
          <CarouselItem key={f} className="h-52 basis-full pl-0">
            {/* eslint-disable-next-line @next/next/no-img-element -- URLs externas de cualquier dominio */}
            <img
              src={f}
              alt={alt}
              loading="lazy"
              onError={() => setRotas((r) => new Set(r).add(f))}
              className="size-full object-cover"
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <span className="absolute right-3.5 top-3.5 z-10 rounded-full bg-secondary/70 px-2.5 py-1 text-[11px] font-bold text-white">
        {cur + 1}/{visibles.length}
      </span>
      {visibles.length > 1 && (
        <>
          <CarouselPrevious className="left-3 opacity-0 transition-opacity group-hover/card:opacity-100" />
          <CarouselNext className="right-3 opacity-0 transition-opacity group-hover/card:opacity-100" />
          <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5">
            {visibles.map((f, k) => (
              <button
                key={f}
                onClick={() => api?.scrollTo(k)}
                aria-label={`Foto ${k + 1}`}
                className={cn('size-[7px] rounded-full transition', k === cur ? 'scale-125 bg-white' : 'bg-white/55')}
              />
            ))}
          </div>
        </>
      )}
    </Carousel>
  );
}

function PropiedadCard({ p, destacar, onToggle, onVerVisitas, nVisitas }: {
  p: Propiedad; destacar: boolean; onToggle: () => void; onVerVisitas: () => void; nVisitas: number;
}) {
  const esVenta = p.operacion === 'venta';
  const fotos = fotosDe(p);
  const feats = [
    p.superficie_m2 != null && `${fmt(p.superficie_m2)} m²`,
    p.ambientes != null && `${p.ambientes} amb.`,
    p.dormitorios != null && `${p.dormitorios} dorm.`,
    p.banos != null && `${p.banos} ${p.banos === 1 ? 'baño' : 'baños'}`,
    p.piso && (p.piso === 'PB' ? 'Planta baja' : `Piso ${p.piso}`),
  ].filter(Boolean) as string[];

  return (
    <Card id={`propiedad-${p.id}`} className={cn('group/card gap-0 p-0 scroll-mt-28', p.destacado && 'ring-primary', !p.disponible && 'opacity-80', destacar && 'ring-2 ring-cobalt ring-offset-2')}>
      <div className={cn('relative h-52 overflow-hidden', esVenta ? 'bg-secondary' : 'bg-muted')}>
        <PropGallery fotos={fotos} alt={p.titulo} tone={esVenta ? 'ink' : 'rent'} />
        <span
          className={cn(
            'absolute left-3.5 top-3.5 z-10 rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.06em]',
            esVenta ? 'bg-primary text-primary-foreground' : 'bg-secondary text-white'
          )}
        >
          {OPERACION_LABEL[p.operacion] ?? p.operacion}
        </span>
        {p.destacado && (
          <span className="absolute left-[92px] top-3.5 z-10 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[11px] font-extrabold text-foreground">
            <span className="material-symbols-outlined text-[15px] text-primary">star</span>Destacado
          </span>
        )}
        {!p.disponible && (
          <span className="absolute inset-x-0 bottom-0 z-10 bg-secondary/90 py-1.5 text-center text-xs font-bold uppercase tracking-wide text-white">
            No disponible
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2.5">
          <div>
            <div className="font-display text-[26px] font-extrabold leading-none tracking-[-0.03em]">{precioTexto(p)}</div>
            {p.expensas != null && <div className="mt-1.5 text-[13px] text-muted-foreground">+ $ {fmt(p.expensas)} expensas</div>}
          </div>
          <Badge
            className={cn('shrink-0 border-transparent', p.disponible ? 'bg-success/15 text-success-foreground' : 'bg-muted text-muted-foreground')}
          >
            {p.disponible ? 'Disponible' : 'No disp.'}
          </Badge>
        </div>

        <h3 className="mt-4 font-display text-[19px] font-bold tracking-[-0.02em]">{p.direccion}</h3>
        <div className="text-[13.5px] text-muted-foreground">
          {[p.barrio, p.ciudad].filter(Boolean).join(', ')} · {TIPO_LABEL[p.tipo] ?? p.tipo}
        </div>

        {feats.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {feats.map((f) => (
              <Badge key={f} variant="secondary" className="bg-muted font-semibold text-neutral-700">{f}</Badge>
            ))}
          </div>
        )}

        {p.descripcion && <p className="mt-3.5 line-clamp-2 text-[13px] leading-relaxed text-neutral-700">{p.descripcion}</p>}

        <div className="mt-auto flex items-center justify-between gap-2.5 border-t border-muted pt-4">
          <div className="text-[11px] text-muted-foreground">
            <b className="block font-sans text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Cód.</b>
            <span className="font-mono">{p.codigo_aviso || '—'}</span>
          </div>
          <div className="flex items-center gap-3.5">
            {p.url_publica && (
              <a href={p.url_publica} target="_blank" rel="noopener noreferrer" className="text-[13.5px] font-bold text-primary">
                Ver publicación ↗
              </a>
            )}
            <Button variant="secondary" size="sm" onClick={onVerVisitas}>
              Ver visitas{nVisitas > 0 ? ` (${nVisitas})` : ''}
            </Button>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={onToggle} className="mt-3.5 w-full">
          {p.disponible ? 'Marcar no disponible' : 'Marcar disponible'}
        </Button>
      </div>
    </Card>
  );
}

export default function PropiedadesClient({ inicial, visitas }: { inicial: Propiedad[]; visitas: Visita[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [filtroOp, setFiltroOp] = useState<string>('todas');
  const [filtroBarrio, setFiltroBarrio] = useState<string>('todos');
  const [orden, setOrden] = useState<string>('recientes');
  const [busqueda, setBusqueda] = useState('');
  const [visitasDe, setVisitasDe] = useState<Propiedad | null>(null);

  // Resaltar la propiedad que llega desde la ficha de un chat (/propiedades?id=…)
  const idParam = params.get('id');
  const [destacado, setDestacado] = useState<number | null>(idParam ? Number(idParam) : null);
  useEffect(() => {
    if (destacado == null) return;
    document.getElementById(`propiedad-${destacado}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const t = setTimeout(() => setDestacado(null), 4000);
    return () => clearTimeout(t);
  }, [destacado]);

  const barrios = Array.from(new Set(inicial.map((p) => p.barrio).filter(Boolean))).sort();
  const disponibles = inicial.filter((p) => p.disponible).length;
  const enAlquiler = inicial.filter((p) => p.operacion.startsWith('alquiler')).length;
  const enVenta = inicial.filter((p) => p.operacion === 'venta').length;

  const visitasPorProp = (id: number) =>
    visitas.filter((v) => v.propiedad_id === id).sort((a, b) =>
      `${a.fecha_visita} ${a.hora_visita}`.localeCompare(`${b.fecha_visita} ${b.hora_visita}`)
    );

  const q = busqueda.trim().toLowerCase();
  const filtradas = inicial
    .filter((p) =>
      (filtroOp === 'todas' || p.operacion === filtroOp) &&
      (filtroBarrio === 'todos' || p.barrio === filtroBarrio) &&
      (!q || [p.titulo, p.direccion, p.barrio, p.codigo_aviso].some((v) => v?.toLowerCase().includes(q)))
    )
    .sort((a, b) =>
      orden === 'precio_asc' ? a.precio - b.precio : orden === 'precio_desc' ? b.precio - a.precio : 0
    );

  async function toggleDisponible(p: Propiedad) {
    await fetch(`/api/propiedades/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disponible: !p.disponible }),
    });
    router.refresh();
  }

  const visitasModal = visitasDe ? visitasPorProp(visitasDe.id) : [];

  return (
    <div className="flex flex-col gap-6">
      {/* ===== Encabezado ink con stats ===== */}
      <section className="flex flex-wrap items-center justify-between gap-6 rounded-[22px] bg-secondary px-6 py-7 text-secondary-foreground md:px-8">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary-foreground/60">Cartera publicada</div>
          <h2 className="mt-2 font-display text-[40px] font-extrabold leading-none tracking-[-0.03em] text-white">Propiedades</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <Stat n={inicial.length} k="Total" />
          <Stat n={disponibles} k="Disponibles" />
          <Stat n={enAlquiler} k="En alquiler" tone="light" />
          <Stat n={enVenta} k="En venta" tone="accent" />
        </div>
      </section>

      {/* ===== Filtros (búsqueda solo en esta sección) ===== */}
      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup
          value={[filtroOp]}
          onValueChange={(v) => setFiltroOp(v[0] ?? 'todas')}
          variant="outline"
          className="bg-muted"
        >
          {['todas', ...OPERACIONES].map((op) => (
            <ToggleGroupItem key={op} value={op} className="px-4 aria-pressed:bg-secondary aria-pressed:text-white">
              {op === 'todas' ? 'Todas' : OPERACION_LABEL[op]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <Input
          type="search"
          placeholder="Dirección, barrio o código…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="h-11 max-w-xs flex-1"
        />

        <Select value={filtroBarrio} onValueChange={(v) => setFiltroBarrio(v ?? 'todos')}>
          <SelectTrigger className="h-11 w-44">
            <SelectValue>{(v) => (v === 'todos' ? 'Todos los barrios' : String(v))}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los barrios</SelectItem>
            {barrios.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={orden} onValueChange={(v) => setOrden(v ?? 'recientes')}>
          <SelectTrigger className="h-11 w-40">
            <SelectValue>{(v) => ORDEN_LABEL[String(v)] ?? String(v)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recientes">Más recientes</SelectItem>
            <SelectItem value="precio_asc">Precio ↑</SelectItem>
            <SelectItem value="precio_desc">Precio ↓</SelectItem>
          </SelectContent>
        </Select>

        <span className="text-sm text-muted-foreground">{filtradas.length} de {inicial.length}</span>
      </div>

      {/* ===== Grilla ===== */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {filtradas.map((p) => (
          <PropiedadCard
            key={p.id}
            p={p}
            destacar={destacado === p.id}
            nVisitas={visitasPorProp(p.id).length}
            onToggle={() => toggleDisponible(p)}
            onVerVisitas={() => setVisitasDe(p)}
          />
        ))}
        {filtradas.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            No hay propiedades que coincidan con el filtro.
          </div>
        )}
      </div>

      {/* ===== Modal: visitas asociadas ===== */}
      <ResponsiveDialog
        open={visitasDe !== null}
        onOpenChange={(o) => { if (!o) setVisitasDe(null); }}
        title="Visitas asociadas"
        description={visitasDe?.direccion}
      >
        {visitasDe && (
          <div className="flex flex-col gap-2">
            {visitasModal.length === 0 && (
              <p className="py-4 text-sm text-muted-foreground">Esta propiedad no tiene visitas programadas.</p>
            )}
            {visitasModal.map((v) => {
              const wa = waLink(v.telefono);
              return (
                <div key={v.id} className="flex items-center gap-3 rounded-xl border border-muted p-3">
                  <Avatar className="size-10 shrink-0">
                    <AvatarFallback className="bg-secondary font-display text-sm font-bold text-white">{inicialNombre(v.nombre_cliente)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-semibold">{v.nombre_cliente || 'Sin nombre'}</div>
                    <div className="text-[12.5px] text-muted-foreground">{v.fecha_visita} · {v.hora_visita?.slice(0, 5)} hs</div>
                  </div>
                  <Badge className={cn('shrink-0 border-transparent capitalize', ESTADO_BADGE[v.estado] ?? 'bg-muted text-muted-foreground')}>{v.estado}</Badge>
                  {wa && (
                    <Button
                      variant="outline"
                      size="icon"
                      render={<a href={wa} target="_blank" rel="noreferrer" title="Contactar por WhatsApp" />}
                      className="size-9 shrink-0 text-primary"
                    >
                      <span className="material-symbols-outlined">chat</span>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ResponsiveDialog>
    </div>
  );
}

function Stat({ n, k, tone }: { n: number; k: string; tone?: 'light' | 'accent' }) {
  return (
    <div
      className={cn(
        'min-w-[92px] rounded-xl px-4 py-3.5',
        tone === 'light' ? 'bg-white' : tone === 'accent' ? 'bg-primary' : 'bg-sidebar-accent'
      )}
    >
      <div className={cn('font-display text-[28px] font-extrabold leading-none tracking-[-0.03em]', tone === 'light' ? 'text-foreground' : tone === 'accent' ? 'text-primary-foreground' : 'text-white')}>
        {n}
      </div>
      <div className={cn('mt-1.5 text-xs', tone === 'light' ? 'text-muted-foreground' : tone === 'accent' ? 'text-primary-foreground' : 'text-secondary-foreground/60')}>
        {k}
      </div>
    </div>
  );
}

const ORDEN_LABEL: Record<string, string> = {
  recientes: 'Más recientes', precio_asc: 'Precio ↑', precio_desc: 'Precio ↓',
};
