'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

const TIPOS = ['departamento', 'casa', 'ph', 'local'];
const OPERACIONES = ['venta', 'alquiler', 'alquiler_temp'];
const OPERACION_LABEL: Record<string, string> = {
  venta: 'Venta', alquiler: 'Alquiler', alquiler_temp: 'Alquiler temp.',
};
const TIPO_LABEL: Record<string, string> = {
  departamento: 'Departamento', casa: 'Casa', ph: 'PH', local: 'Local',
};

const vacia = {
  titulo: '', descripcion: '', tipo: 'departamento', operacion: 'alquiler',
  precio: '', moneda: 'ARS', ambientes: '', dormitorios: '', banos: '',
  superficie_m2: '', piso: '', direccion: '', barrio: '', ciudad: 'Buenos Aires',
  caracteristicas: '', expensas: '', requisitos_garantia: '', disponible: true, destacado: false,
  codigo_aviso: '', url_publica: '', imagenes: '',
};

const fmt = (n: number | string) => Number(n).toLocaleString('es-AR', { maximumFractionDigits: 2 });
const precioTexto = (p: Propiedad) => `${p.moneda === 'USD' ? 'USD' : '$'} ${fmt(p.precio)}`;

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

function PropiedadCard({ p, onToggle, onEditar }: {
  p: Propiedad; onToggle: () => void; onEditar: () => void;
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
    <Card className={cn('group/card gap-0 p-0', p.destacado && 'ring-primary', !p.disponible && 'opacity-80')}>
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
            <Button variant="secondary" size="sm" onClick={onEditar}>Editar</Button>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={onToggle} className="mt-3.5 w-full">
          {p.disponible ? 'Marcar no disponible' : 'Marcar disponible'}
        </Button>
      </div>
    </Card>
  );
}

export default function PropiedadesClient({ inicial }: { inicial: Propiedad[] }) {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, unknown> | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtroOp, setFiltroOp] = useState<string>('todas');
  const [filtroBarrio, setFiltroBarrio] = useState<string>('todos');
  const [orden, setOrden] = useState<string>('recientes');
  const [busqueda, setBusqueda] = useState('');

  const barrios = Array.from(new Set(inicial.map((p) => p.barrio).filter(Boolean))).sort();
  const disponibles = inicial.filter((p) => p.disponible).length;
  const enAlquiler = inicial.filter((p) => p.operacion.startsWith('alquiler')).length;
  const enVenta = inicial.filter((p) => p.operacion === 'venta').length;

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

  function abrirNueva() { setEditId(null); setForm({ ...vacia }); setError(null); }
  function abrirEditar(p: Propiedad) {
    setEditId(p.id);
    setForm({
      ...vacia, ...p,
      precio: p.precio ?? '', ambientes: p.ambientes ?? '', dormitorios: p.dormitorios ?? '',
      banos: p.banos ?? '', superficie_m2: p.superficie_m2 ?? '', expensas: p.expensas ?? '',
      piso: p.piso ?? '', descripcion: p.descripcion ?? '', ciudad: p.ciudad ?? 'Buenos Aires',
      requisitos_garantia: p.requisitos_garantia ?? '',
      caracteristicas: Array.isArray(p.caracteristicas) ? p.caracteristicas.join(', ') : '',
      codigo_aviso: p.codigo_aviso ?? '', url_publica: p.url_publica ?? '',
      imagenes: fotosDe(p).join('\n'),
    });
    setError(null);
  }
  function cerrar() { setForm(null); setEditId(null); }

  function set(k: string, v: unknown) { setForm((f) => ({ ...(f as object), [k]: v })); }
  const num = (v: unknown) => (v === '' || v === null || v === undefined ? null : Number(v));

  async function guardar() {
    if (!form) return;
    setGuardando(true); setError(null);
    const payload = {
      ...form,
      precio: num(form.precio), ambientes: num(form.ambientes), dormitorios: num(form.dormitorios),
      banos: num(form.banos), superficie_m2: num(form.superficie_m2), expensas: num(form.expensas),
      imagen_principal: null,
    };
    const url = editId ? `/api/propiedades/${editId}` : '/api/propiedades';
    const res = await fetch(url, {
      method: editId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setGuardando(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || 'Error al guardar'); return; }
    cerrar(); router.refresh();
  }

  async function toggleDisponible(p: Propiedad) {
    await fetch(`/api/propiedades/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disponible: !p.disponible }),
    });
    router.refresh();
  }

  const thumbs = String(form?.imagenes || '').split(/\s+/).filter(Boolean);

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

      {/* ===== Filtros ===== */}
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

      <div>
        <Button onClick={abrirNueva}>
          <span className="material-symbols-outlined">add</span>
          Nueva propiedad
        </Button>
      </div>

      {/* ===== Grilla ===== */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {filtradas.map((p) => (
          <PropiedadCard key={p.id} p={p} onToggle={() => toggleDisponible(p)} onEditar={() => abrirEditar(p)} />
        ))}
        {filtradas.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            No hay propiedades que coincidan con el filtro.
          </div>
        )}
      </div>

      {/* ===== Modal alta/edición ===== */}
      <ResponsiveDialog
        open={form !== null}
        onOpenChange={(o) => { if (!o) cerrar(); }}
        title={editId ? 'Editar propiedad' : 'Nueva propiedad'}
      >
        {form && (
          <div className="flex flex-col gap-4">
            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">{error}</div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Título*"><Input value={form.titulo as string} onChange={(e) => set('titulo', e.target.value)} /></Field>
              <Field label="Barrio*"><Input value={form.barrio as string} onChange={(e) => set('barrio', e.target.value)} /></Field>
              <Field label="Tipo">
                <Sel value={form.tipo as string} onChange={(v) => set('tipo', v)} options={TIPOS.map((t) => ({ value: t, label: t }))} />
              </Field>
              <Field label="Operación">
                <Sel value={form.operacion as string} onChange={(v) => set('operacion', v)} options={OPERACIONES.map((o) => ({ value: o, label: o }))} />
              </Field>
              <Field label="Precio*"><Input type="number" value={form.precio as string} onChange={(e) => set('precio', e.target.value)} /></Field>
              <Field label="Moneda">
                <Sel value={form.moneda as string} onChange={(v) => set('moneda', v)} options={[{ value: 'ARS', label: 'ARS' }, { value: 'USD', label: 'USD' }]} />
              </Field>
              <Field label="Expensas"><Input type="number" value={form.expensas as string} onChange={(e) => set('expensas', e.target.value)} placeholder="vacío si no hay dato" /></Field>
              <Field label="Ambientes"><Input type="number" value={form.ambientes as string} onChange={(e) => set('ambientes', e.target.value)} /></Field>
              <Field label="Dormitorios"><Input type="number" value={form.dormitorios as string} onChange={(e) => set('dormitorios', e.target.value)} /></Field>
              <Field label="Baños"><Input type="number" value={form.banos as string} onChange={(e) => set('banos', e.target.value)} /></Field>
              <Field label="Superficie m²"><Input type="number" value={form.superficie_m2 as string} onChange={(e) => set('superficie_m2', e.target.value)} /></Field>
              <Field label="Piso"><Input value={form.piso as string} onChange={(e) => set('piso', e.target.value)} /></Field>
              <Field label="Dirección*" className="sm:col-span-2"><Input value={form.direccion as string} onChange={(e) => set('direccion', e.target.value)} /></Field>
              <Field label="Requisitos garantía" className="sm:col-span-2"><Input value={form.requisitos_garantia as string} onChange={(e) => set('requisitos_garantia', e.target.value)} /></Field>
              <Field label="Características (separadas por coma)" className="sm:col-span-2"><Input value={form.caracteristicas as string} onChange={(e) => set('caracteristicas', e.target.value)} /></Field>
              <Field label="Descripción" className="sm:col-span-2"><Textarea value={form.descripcion as string} onChange={(e) => set('descripcion', e.target.value)} /></Field>
              <Field label="Código de aviso"><Input value={form.codigo_aviso as string} onChange={(e) => set('codigo_aviso', e.target.value)} /></Field>
              <Field label="URL de la publicación"><Input type="url" value={form.url_publica as string} onChange={(e) => set('url_publica', e.target.value)} placeholder="https://…" /></Field>
              <Field label="Imágenes (una URL por línea, la primera es la principal)" className="sm:col-span-2">
                <Textarea value={form.imagenes as string} onChange={(e) => set('imagenes', e.target.value)} />
              </Field>
              {thumbs.length > 0 && (
                <div className="flex flex-wrap gap-2 sm:col-span-2">
                  {thumbs.map((u, k) => (
                    // eslint-disable-next-line @next/next/no-img-element -- vista previa de URLs externas
                    <img key={`${u}-${k}`} src={u} alt={`Imagen ${k + 1}`} className={cn('h-16 w-[86px] rounded-lg border-2 border-transparent bg-muted object-cover', k === 0 && 'border-primary')} />
                  ))}
                </div>
              )}
              <label className="flex items-center gap-2.5 text-sm font-medium">
                <Checkbox checked={form.disponible as boolean} onCheckedChange={(v) => set('disponible', v === true)} /> Disponible
              </label>
              <label className="flex items-center gap-2.5 text-sm font-medium">
                <Checkbox checked={form.destacado as boolean} onCheckedChange={(v) => set('destacado', v === true)} /> Destacado
              </label>
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <Button variant="outline" onClick={cerrar}>Cancelar</Button>
              <Button onClick={guardar} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</Button>
            </div>
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

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label className="text-[11px] font-bold uppercase tracking-[0.04em] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Sel({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? '')}>
      <SelectTrigger>
        <SelectValue>{(v) => options.find((o) => o.value === v)?.label ?? String(v ?? '')}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

const ORDEN_LABEL: Record<string, string> = {
  recientes: 'Más recientes', precio_asc: 'Precio ↑', precio_desc: 'Precio ↓',
};
