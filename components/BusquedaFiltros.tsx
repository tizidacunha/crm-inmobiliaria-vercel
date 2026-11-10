'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ResponsiveDialog } from '@/components/responsive-dialog';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Lead } from '@/components/LeadList';

/* Parámetros de URL que comparten este panel y LeadList. */
export const FILTROS_BUSQUEDA = [
  { key: 'op', label: 'Operación', campo: 'operacion' },
  { key: 'amb', label: 'Ambientes', campo: 'ambientes' },
  { key: 'barrio', label: 'Barrio', campo: 'barrio' },
] as const;

/* Un lead pasa si cumple todos los filtros de búsqueda activos en la URL. */
export function cumpleBusqueda(l: Lead, params: URLSearchParams) {
  return FILTROS_BUSQUEDA.every(({ key, campo }) => {
    const v = params.get(key);
    return !v || l[campo] === v;
  });
}

const ORDEN_AMB = (a: string) => (a === 'Monoambiente' ? 1 : parseInt(a, 10) || 99);

const TODOS = '__todos__';

export default function BusquedaFiltros({
  leads, barrios, seleccionado, modo = 'tarjeta',
}: { leads: Lead[]; barrios: string[]; seleccionado?: Lead; modo?: 'tarjeta' | 'boton' }) {
  const [abierto, setAbierto] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function aplicar(next: URLSearchParams) {
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function toggle(key: string, valor: string) {
    const next = new URLSearchParams(params.toString());
    if (next.get(key) === valor) next.delete(key);
    else next.set(key, valor);
    aplicar(next);
  }

  function setBarrio(valor: string) {
    const next = new URLSearchParams(params.toString());
    if (valor === TODOS) next.delete('barrio');
    else next.set('barrio', valor);
    aplicar(next);
  }

  function limpiar() {
    const next = new URLSearchParams(params.toString());
    FILTROS_BUSQUEDA.forEach(({ key }) => next.delete(key));
    aplicar(next);
  }

  const activos = FILTROS_BUSQUEDA.filter(({ key }) => params.get(key)).length;
  const busca = seleccionado
    ? [seleccionado.operacion, seleccionado.ambientes, seleccionado.barrio].filter(Boolean).join(' · ')
    : '';

  const contenido = (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Filtrar por búsqueda</div>
        {activos > 0 && (
          <Button variant="ghost" size="xs" onClick={limpiar}>Limpiar</Button>
        )}
      </div>

      {FILTROS_BUSQUEDA.map(({ key, label, campo }) => {
        const conteo = new Map<string, number>();
        leads.forEach((l) => { const v = l[campo]; if (v) conteo.set(v, (conteo.get(v) ?? 0) + 1); });
        const opciones = [...conteo.keys()].sort((a, b) =>
          campo === 'ambientes' ? ORDEN_AMB(a) - ORDEN_AMB(b) : a.localeCompare(b, 'es')
        );
        if (opciones.length === 0 && campo !== 'barrio') return null;
        const actual = params.get(key);

        // Barrio: desplegable con TODOS los barrios conocidos (no solo los que aparecen en chats).
        if (campo === 'barrio') {
          return (
            <div key={key} className="flex flex-col gap-2">
              <div className="text-[12px] font-semibold text-muted-foreground">{label}</div>
              <Select value={actual ?? TODOS} onValueChange={(v) => setBarrio(String(v ?? TODOS))}>
                <SelectTrigger className="w-full">
                  <SelectValue>{(v) => (v === TODOS || !v ? 'Todos los barrios' : String(v))}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>Todos los barrios</SelectItem>
                  {barrios.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                      <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">{conteo.get(b) ?? 0}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }

        return (
          <div key={key} className="flex flex-col gap-2">
            <div className="text-[12px] font-semibold text-muted-foreground">{label}</div>
            <div className="flex flex-wrap gap-2">
              {opciones.map((op) => {
                const on = actual === op;
                return (
                  <Button
                    key={op}
                    size="sm"
                    variant={on ? 'secondary' : 'outline'}
                    aria-pressed={on}
                    onClick={() => toggle(key, op)}
                  >
                    {op}
                    <span className={cn('text-[11px] tabular-nums', on ? 'opacity-70' : 'text-muted-foreground')}>{conteo.get(op)}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        );
      })}

      {busca && (
        <p className="border-t border-muted pt-3 text-[12.5px] text-muted-foreground">
          Este chat busca: <span className="font-semibold text-foreground">{busca}</span>
        </p>
      )}
    </>
  );

  if (modo === 'tarjeta') return <Card className="gap-4 p-5">{contenido}</Card>;

  // Pantallas chicas: botón que abre los mismos filtros en un panel (drawer en celular).
  return (
    <>
      <Button variant={activos ? 'secondary' : 'outline'} onClick={() => setAbierto(true)} className="w-full sm:w-auto">
        <span className="material-symbols-outlined text-[18px]">tune</span>
        Filtrar por búsqueda{activos ? ` (${activos})` : ''}
      </Button>
      <ResponsiveDialog open={abierto} onOpenChange={setAbierto} title="Filtrar chats">
        <div className="flex flex-col gap-4">
          {contenido}
          <Button onClick={() => setAbierto(false)}>Ver resultados</Button>
        </div>
      </ResponsiveDialog>
    </>
  );
}
