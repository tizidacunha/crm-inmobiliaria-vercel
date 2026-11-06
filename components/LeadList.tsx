'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ScrollArea } from '@/components/ui/scroll-area';

export type Lead = {
  userId: string;
  name: string;
  preview: string;
  time: string;
  initials: string;
  statusCls: string;
  statusLabel: string;
  derivado: boolean;
  conVisita: boolean;
};

type Filtro = 'todos' | 'derivados' | 'visita';

const STATUS_CLS: Record<string, string> = {
  interesado: 'bg-success/15 text-success-foreground',
  consultando: 'bg-muted text-muted-foreground',
  derivado: 'bg-accent text-accent-foreground',
  confirmada: 'bg-secondary text-white',
};

export default function LeadList({ leads, selectedId, className }: { leads: Lead[]; selectedId: string; className?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const filtroInicial: Filtro =
    params.get('filtro') === 'derivados' ? 'derivados' : params.get('filtro') === 'visita' ? 'visita' : 'todos';
  const [q, setQ] = useState('');
  const [filtro, setFiltro] = useState<Filtro>(filtroInicial);

  const query = q.trim().toLowerCase();
  const visibles = leads.filter((l) => {
    if (filtro === 'derivados' && !l.derivado) return false;
    if (filtro === 'visita' && !l.conVisita) return false;
    if (query && !(`${l.name} ${l.preview}`.toLowerCase().includes(query))) return false;
    return true;
  });

  const nDeriv = leads.filter((l) => l.derivado).length;
  const nVisita = leads.filter((l) => l.conVisita).length;

  return (
    <Card className={cn('flex max-h-[calc(100vh-150px)] gap-0 p-0', className)}>
      <div className="relative px-4 pb-2.5 pt-4">
        <span className="material-symbols-outlined pointer-events-none absolute left-7 top-[26px] text-[19px] text-muted-foreground">search</span>
        <Input placeholder="Filtrar…" value={q} onChange={(e) => setQ(e.target.value)} className="h-10 bg-muted pl-10" />
      </div>
      <div className="border-b border-muted px-4 pb-3.5">
        <ToggleGroup value={[filtro]} onValueChange={(v) => setFiltro((v[0] as Filtro) ?? 'todos')} variant="outline" className="flex-wrap">
          <ToggleGroupItem value="todos" className="aria-pressed:bg-secondary aria-pressed:text-white">Todos {leads.length}</ToggleGroupItem>
          <ToggleGroupItem value="derivados" className="aria-pressed:bg-secondary aria-pressed:text-white">Derivados {nDeriv}</ToggleGroupItem>
          <ToggleGroupItem value="visita" className="aria-pressed:bg-secondary aria-pressed:text-white">Con visita {nVisita}</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <ScrollArea className="flex-1">
        {visibles.length === 0 && <div className="p-5 text-[13px] text-muted-foreground">Sin resultados.</div>}
        {visibles.map((l) => {
          const on = l.userId === selectedId;
          return (
            <button
              key={l.userId}
              onClick={() => router.push(`/chats/${encodeURIComponent(l.userId)}`)}
              className={cn('flex w-full gap-3 border-b border-muted px-4 py-3.5 text-left transition-colors hover:bg-muted', on && 'bg-accent hover:bg-accent')}
            >
              <Avatar className="size-10 shrink-0">
                <AvatarFallback className={cn('font-display text-[13px] font-bold', on ? 'bg-primary text-primary-foreground' : 'bg-secondary text-white')}>
                  {l.initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <span className="truncate text-sm font-bold">{l.name}</span>
                  <span className="shrink-0 text-[11.5px] text-muted-foreground">{l.time}</span>
                </div>
                <div className="mt-0.5 truncate text-[12.5px] text-muted-foreground">{l.preview}</div>
                <Badge className={cn('mt-1.5 border-transparent', STATUS_CLS[l.statusCls])}>{l.statusLabel}</Badge>
              </div>
            </button>
          );
        })}
      </ScrollArea>
    </Card>
  );
}
