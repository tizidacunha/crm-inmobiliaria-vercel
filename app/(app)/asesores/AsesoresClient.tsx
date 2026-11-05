'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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

const vacio = { nombre: '', email: '', telefono: '', sucursal: '', zonas: '', activo: true };

function iniciales(nombre: string) {
  const partes = String(nombre || '').trim().split(/\s+/).filter(Boolean);
  if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
  return (partes[0]?.slice(0, 2) || '?').toUpperCase();
}

export default function AsesoresClient({ inicial }: { inicial: Asesor[] }) {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, unknown> | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function abrirNuevo() { setEditId(null); setForm({ ...vacio }); setError(null); }
  function abrirEditar(a: Asesor) {
    setEditId(a.id);
    setForm({
      nombre: a.nombre, email: a.email ?? '', telefono: a.telefono ?? '',
      sucursal: a.sucursal, zonas: (a.zonas || []).join(', '), activo: a.activo,
    });
    setError(null);
  }
  function cerrar() { setForm(null); setEditId(null); }
  function set(k: string, v: unknown) { setForm((f) => ({ ...(f as object), [k]: v })); }

  async function guardar() {
    if (!form) return;
    setGuardando(true); setError(null);
    const url = editId ? `/api/asesores/${editId}` : '/api/asesores';
    const res = await fetch(url, {
      method: editId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setGuardando(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || 'Error al guardar'); return; }
    cerrar(); router.refresh();
  }

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
        open={form !== null}
        onOpenChange={(o) => { if (!o) cerrar(); }}
        title={editId ? 'Editar asesor' : 'Nuevo asesor'}
      >
        {form && (
          <div className="flex flex-col gap-4">
            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">{error}</div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre*"><Input value={form.nombre as string} onChange={(e) => set('nombre', e.target.value)} /></Field>
              <Field label="Sucursal*"><Input value={form.sucursal as string} onChange={(e) => set('sucursal', e.target.value)} /></Field>
              <Field label="Zonas (separadas por coma)" className="sm:col-span-2">
                <Input value={form.zonas as string} onChange={(e) => set('zonas', e.target.value)} placeholder="Palermo, Recoleta, Belgrano" />
              </Field>
              <Field label="Email"><Input value={form.email as string} onChange={(e) => set('email', e.target.value)} /></Field>
              <Field label="Teléfono"><Input value={form.telefono as string} onChange={(e) => set('telefono', e.target.value)} /></Field>
              <label className="flex items-center gap-2.5 text-sm font-medium sm:col-span-2">
                <Checkbox checked={form.activo as boolean} onCheckedChange={(v) => set('activo', v === true)} />
                Activo
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

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label className="text-[11px] font-bold uppercase tracking-[0.04em] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
