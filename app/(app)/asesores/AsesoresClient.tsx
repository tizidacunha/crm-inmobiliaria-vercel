'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  SUCURSALES, ZONAS_POR_SUCURSAL, validarAsesor, limpiarNombre, telefonoLocal, formatearTelefono,
  type ErroresAsesor,
} from '@/lib/asesores';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveDialog } from '@/components/responsive-dialog';

export type Asesor = {
  id: number;
  nombre: string;
  email: string | null;
  telefono: string | null;
  sucursal: string;
  zonas: string[];
  activo: boolean;
};

type FormAsesor = {
  nombre: string;
  email: string;
  telefono: string; // solo los 10 dígitos locales
  sucursal: string;
  zonas: string[];
  activo: boolean;
};

const vacio: FormAsesor = { nombre: '', email: '', telefono: '', sucursal: '', zonas: [], activo: true };

function iniciales(nombre: string) {
  const partes = String(nombre || '').trim().split(/\s+/).filter(Boolean);
  if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
  return (partes[0]?.slice(0, 2) || '?').toUpperCase();
}

function ErrorCampo({ msg, hint }: { msg?: string; hint?: string }) {
  if (msg) return <p className="text-[12.5px] font-medium text-destructive">{msg}</p>;
  if (hint) return <p className="text-[12.5px] text-muted-foreground">{hint}</p>;
  return null;
}

export default function AsesoresClient({ inicial }: { inicial: Asesor[] }) {
  const router = useRouter();
  const [form, setForm] = useState<FormAsesor | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [zonasPrevias, setZonasPrevias] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errores, setErrores] = useState<ErroresAsesor>({});
  const [intentado, setIntentado] = useState(false);

  function reset() { setError(null); setErrores({}); setIntentado(false); }
  function abrirNuevo() { setEditId(null); setZonasPrevias([]); setForm({ ...vacio }); reset(); }
  function abrirEditar(a: Asesor) {
    setEditId(a.id);
    setZonasPrevias(a.zonas || []);
    setForm({
      nombre: a.nombre, email: a.email ?? '', telefono: telefonoLocal(a.telefono),
      sucursal: a.sucursal, zonas: a.zonas || [], activo: a.activo,
    });
    reset();
  }
  function cerrar() { setForm(null); setEditId(null); }

  function actualizar(cambios: Partial<FormAsesor>) {
    if (!form) return;
    const nuevo = { ...form, ...cambios };
    setForm(nuevo);
    // Después del primer intento de guardar, los errores se recalculan mientras corrige.
    if (intentado) {
      const v = validarAsesor(nuevo, zonasPrevias);
      setErrores(v.ok ? {} : v.errores);
    }
  }

  function cambiarSucursal(sucursal: string) {
    if (!form) return;
    const permitidas = new Set([...(ZONAS_POR_SUCURSAL[sucursal] ?? []), ...zonasPrevias]);
    actualizar({ sucursal, zonas: form.zonas.filter((z) => permitidas.has(z)) });
  }

  function toggleZona(z: string) {
    if (!form) return;
    actualizar({ zonas: form.zonas.includes(z) ? form.zonas.filter((x) => x !== z) : [...form.zonas, z] });
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setIntentado(true);
    const v = validarAsesor(form, zonasPrevias);
    if (!v.ok) { setErrores(v.errores); setError(null); return; }
    setErrores({});
    setGuardando(true); setError(null);
    const url = editId ? `/api/asesores/${editId}` : '/api/asesores';
    let res: Response;
    try {
      res = await fetch(url, {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(v.data),
      });
    } catch {
      setError('No se pudo conectar. Intentá de nuevo.');
      return;
    } finally {
      setGuardando(false);
    }
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      if (d.errores) setErrores(d.errores);
      setError(d.error || 'Error al guardar');
      return;
    }
    cerrar(); router.refresh();
  }

  async function darDeBaja(a: Asesor) {
    if (!window.confirm(`¿Dar de baja a ${a.nombre}? Deja de recibir derivaciones.`)) return;
    try {
      const res = await fetch(`/api/asesores/${a.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || 'No se pudo dar de baja al asesor');
        return;
      }
      toast.success(`${a.nombre} quedó dado de baja`);
      router.refresh();
    } catch {
      toast.error('No se pudo conectar. Intentá de nuevo.');
    }
  }

  const waLink = (tel: string | null) => {
    const d = (tel ?? '').replace(/\D/g, '');
    return d.length >= 8 ? `https://wa.me/${d}` : null;
  };

  // Zonas a mostrar: las de la sucursal elegida + las que ya tenga marcadas (registros viejos).
  const zonasVisibles = form?.sucursal
    ? Array.from(new Set([...(ZONAS_POR_SUCURSAL[form.sucursal] ?? []), ...form.zonas]))
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-[28px] font-bold tracking-[-0.02em]">Equipo de asesores</h2>
          <p className="text-sm text-muted-foreground">
            {inicial.filter((a) => a.activo).length} activos · {inicial.length} en total
          </p>
        </div>
        <Button onClick={abrirNuevo}>
          <span className="material-symbols-outlined">add</span>
          Nuevo asesor
        </Button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {inicial.map((a, i) => {
          const wa = waLink(a.telefono);
          return (
            <Card key={a.id} className={cn('gap-5', !a.activo && 'opacity-80')}>
              <CardContent className="flex flex-col gap-5">
                <div className="flex items-start gap-4">
                  <Avatar className="size-14 rounded-xl">
                    <AvatarFallback
                      className={cn(
                        'rounded-xl font-display text-lg font-extrabold',
                        !a.activo ? 'bg-muted text-muted-foreground' : i === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-white'
                      )}
                    >
                      {iniciales(a.nombre)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-xl font-extrabold leading-tight tracking-[-0.02em]">{a.nombre}</div>
                    <div className="mt-1 text-sm text-muted-foreground">Sucursal {a.sucursal}</div>
                  </div>
                  <Badge
                    className={cn(
                      'shrink-0 border-transparent',
                      a.activo ? 'bg-success/15 text-success-foreground' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {a.activo ? 'Activo' : 'Baja'}
                  </Badge>
                </div>

                <div>
                  <div className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Zonas</div>
                  <div className="flex flex-wrap gap-2">
                    {(a.zonas || []).map((z) => (
                      <Badge key={z} variant="secondary" className={cn('font-medium', !a.activo && 'bg-accent text-accent-foreground')}>
                        {z}
                      </Badge>
                    ))}
                    {(!a.zonas || a.zonas.length === 0) && <span className="text-sm text-muted-foreground">Sin zonas asignadas</span>}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-muted pt-4">
                  <span className="truncate text-sm text-muted-foreground">{a.email || '—'}</span>
                  {wa && (
                    <a href={wa} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-primary">
                      <span className="material-symbols-outlined text-[17px]">chat</span>WhatsApp
                    </a>
                  )}
                </div>

                <div className="flex gap-2.5">
                  <Button variant="secondary" size="sm" onClick={() => abrirEditar(a)}>Editar</Button>
                  {a.activo && <Button variant="outline" size="sm" onClick={() => darDeBaja(a)}>Dar de baja</Button>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ResponsiveDialog
        open={!!form}
        onOpenChange={(o) => { if (!o) cerrar(); }}
        title={editId ? 'Editar asesor' : 'Nuevo asesor'}
      >
        {form && (
          <form onSubmit={guardar} noValidate className="flex flex-col gap-4">
            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">{error}</div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="as-nombre">Nombre y apellido*</Label>
                <Input
                  id="as-nombre"
                  value={form.nombre}
                  onChange={(e) => actualizar({ nombre: limpiarNombre(e.target.value) })}
                  maxLength={60}
                  autoComplete="name"
                  placeholder="Ej: Lucía Martínez"
                  aria-invalid={!!errores.nombre}
                />
                <ErrorCampo msg={errores.nombre} />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Sucursal*</Label>
                <Select value={form.sucursal} onValueChange={(v) => cambiarSucursal(String(v ?? ''))}>
                  <SelectTrigger className="w-full" aria-invalid={!!errores.sucursal}>
                    <SelectValue>{(v) => String(v || 'Elegí una sucursal')}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {SUCURSALES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <ErrorCampo msg={errores.sucursal} />
              </div>

              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label>
                  Zonas*
                  {form.sucursal && (
                    <span className="font-normal text-muted-foreground">
                      · {form.zonas.length} elegida{form.zonas.length === 1 ? '' : 's'}
                    </span>
                  )}
                </Label>
                {!form.sucursal ? (
                  <div className="rounded-xl border border-dashed border-border px-3.5 py-3 text-sm text-muted-foreground">
                    Elegí primero una sucursal para ver sus zonas.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {zonasVisibles.map((z) => {
                      const on = form.zonas.includes(z);
                      return (
                        <Button
                          key={z}
                          type="button"
                          size="sm"
                          variant={on ? 'secondary' : 'outline'}
                          aria-pressed={on}
                          onClick={() => toggleZona(z)}
                        >
                          {on && <span className="material-symbols-outlined text-[16px]">check</span>}
                          {z}
                        </Button>
                      );
                    })}
                  </div>
                )}
                <ErrorCampo msg={errores.zonas} />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="as-email">Email*</Label>
                <Input
                  id="as-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => actualizar({ email: e.target.value.replace(/\s/g, '').toLowerCase() })}
                  maxLength={100}
                  autoComplete="email"
                  placeholder="nombre@horizonte.com"
                  aria-invalid={!!errores.email}
                />
                <ErrorCampo msg={errores.email} />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="as-tel">Teléfono (WhatsApp)*</Label>
                <div className="flex items-center gap-2">
                  <span className="shrink-0 text-sm font-semibold text-muted-foreground">+54 9</span>
                  <Input
                    id="as-tel"
                    type="tel"
                    inputMode="numeric"
                    value={formatearTelefono(form.telefono)}
                    onChange={(e) => actualizar({ telefono: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    autoComplete="tel-national"
                    placeholder="11 2345-6789"
                    aria-invalid={!!errores.telefono}
                  />
                </div>
                <ErrorCampo msg={errores.telefono} hint="Código de área sin 0 y número sin 15" />
              </div>

              <label className="flex items-center gap-2.5 text-sm font-medium sm:col-span-2">
                <Checkbox checked={form.activo} onCheckedChange={(v) => actualizar({ activo: v === true })} />
                Activo
              </label>
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <Button type="button" variant="outline" onClick={cerrar}>Cancelar</Button>
              <Button type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</Button>
            </div>
          </form>
        )}
      </ResponsiveDialog>
    </div>
  );
}
