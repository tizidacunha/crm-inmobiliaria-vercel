'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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

export default function LeadList({ leads, selectedId }: { leads: Lead[]; selectedId: string }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');

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
    <aside className="lead-pane">
      <div className="lead-search">
        <span className="material-symbols-outlined">search</span>
        <input
          type="search"
          placeholder="Buscar lead…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="lead-filters">
        <button className={`lead-filter${filtro === 'todos' ? ' on' : ''}`} onClick={() => setFiltro('todos')}>Todos {leads.length}</button>
        <button className={`lead-filter${filtro === 'derivados' ? ' on' : ''}`} onClick={() => setFiltro('derivados')}>Derivados {nDeriv}</button>
        <button className={`lead-filter${filtro === 'visita' ? ' on' : ''}`} onClick={() => setFiltro('visita')}>Con visita {nVisita}</button>
      </div>
      <div className="lead-list">
        {visibles.length === 0 && (
          <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>Sin resultados.</div>
        )}
        {visibles.map((l) => (
          <div
            key={l.userId}
            className={`lead-item${l.userId === selectedId ? ' on' : ''}`}
            onClick={() => router.push(`/chats/${encodeURIComponent(l.userId)}`)}
          >
            <div className="lead-av">{l.initials}</div>
            <div className="lead-body">
              <div className="lead-top">
                <span className="lead-name">{l.name}</span>
                <span className="lead-time">{l.time}</span>
              </div>
              <div className="lead-prev">{l.preview}</div>
              <span className={`cstatus ${l.statusCls}`}>{l.statusLabel}</span>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
