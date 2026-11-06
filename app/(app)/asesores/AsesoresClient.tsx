'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import { asesorSchema, type AsesorForm } from '@/lib/validaciones';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { MultiSelect } from '@/components/ui/multi-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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

const OTRA = '__otra__';
const vacio: AsesorForm = { nombre: '', email: '', telefono: '', sucursal: '', zonas: [], activo: true };

function iniciales(nombre: string) {
  const partes = String(nombre || '').trim().split(/\s+/).filter(Boolean);
  if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
  return (partes[0]?.slice(0, 2) || '?').toUpperCase();
}

export default function AsesoresClient({ inicial }: { inicial: Asesor[] }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nuevaSucursal, setNuevaSucursal] = useState(false);

  // Opciones para los dropdowns, derivadas de los asesores existentes.
  const sucursales = useMemo(
    () => Array.from(new Set(inicial.map((a) => a.sucursal).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es')),
    [inicial]
  );
  const zonasOpts = useMemo(
    () => Array.from(new Set(inicial.flatMap((a) => a.zonas || []).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es')),
    [inicial]
  );

  const form = useForm<AsesorForm>({ resolver: zodResolver(asesorSchema), defaultValues: vacio });

  function abrirNuevo() {
    setEditId(null); setError(null); setNuevaSucursal(false);
    form.reset(vacio);
    setAbierto(true);
  }
  function abrirEditar(a: Asesor) {
    setEditId(a.id); setError(null);
    setNuevaSucursal(!!a.sucursal && !sucursales.includes(a.sucursal));
    form.reset({
      nombre: a.nombre, email: a.email ?? '', telefono: a.telefono ?? '',
      sucursal: a.sucursal, zonas: a.zonas ?? [], activo: a.activo,
    });
    setAbierto(true);
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    const url = editId ? `/api/asesores/${editId}` : '/api/asesores';
    const res = await fetch(url, {
      method: editId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || 'Error al guardar'); return; }
    setAbierto(false); router.refresh();
  });

  async function darDeBaja(a: Asesor) {
    await fetch(`/api/asesores/${a.id}`, { method: 'DELETE' });
    router.refresh();
  }

  const waLink = (tel: string | null) => {
    const d = (tel ?? '').replace(/\D/g, '');
    return d.length >= 8 ? `https://wa.me/${d}` : null;
  };

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
        open={abierto}
        onOpenChange={setAbierto}
        title={editId ? 'Editar asesor' : 'Nuevo asesor'}
      >
        <Form {...form}>
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">{error}</div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre*</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sucursal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sucursal*</FormLabel>
                    <Select
                      value={nuevaSucursal ? OTRA : field.value || ''}
                      onValueChange={(v) => {
                        if (v === OTRA) { setNuevaSucursal(true); field.onChange(''); }
                        else { setNuevaSucursal(false); field.onChange(v ?? ''); }
                      }}
                    >
                      <SelectTrigger aria-invalid={!!form.formState.errors.sucursal}>
                        <SelectValue>{(v) => (v === OTRA ? 'Otra…' : String(v || 'Elegí una sucursal'))}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {sucursales.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        <SelectItem value={OTRA}>Otra…</SelectItem>
                      </SelectContent>
                    </Select>
                    {nuevaSucursal && (
                      <FormControl><Input placeholder="Nueva sucursal" {...field} /></FormControl>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="zonas"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Zonas* (podés elegir varias)</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={zonasOpts}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Elegí una o más zonas"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" placeholder="nombre@dominio.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl><Input inputMode="tel" placeholder="5491144556611" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="activo"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <label className="flex items-center gap-2.5 text-sm font-medium">
                      <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
                      Activo
                    </label>
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <Button type="button" variant="outline" onClick={() => setAbierto(false)}>Cancelar</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Guardando…' : 'Guardar'}
              </Button>
            </div>
          </form>
        </Form>
      </ResponsiveDialog>
    </div>
  );
}
