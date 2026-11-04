'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
    <div>
      <div className="toolbar">
        <div>
          <h2 className="page-title" style={{ marginBottom: 2 }}>Equipo de asesores</h2>
          <p className="page-sub" style={{ margin: 0 }}>
            {inicial.filter((a) => a.activo).length} activos · {inicial.length} en total
          </p>
        </div>
        <button className="btn btn-primary" onClick={abrirNuevo}>+ Nuevo asesor</button>
      </div>

      <div className="asesor-grid">
        {inicial.map((a, i) => {
          const wa = waLink(a.telefono);
          return (
            <article key={a.id} className={`asesor-card${a.activo ? '' : ' off'}`}>
              <div className="asesor-head">
                <div className={`asesor-av${a.activo && i === 0 ? ' a0' : ''}`}>{iniciales(a.nombre)}</div>
                <div className="asesor-id">
                  <div className="asesor-name">{a.nombre}</div>
                  <div className="asesor-suc">Sucursal {a.sucursal}</div>
                </div>
                <span className={`badge ${a.activo ? 'activo' : 'baja'}`}>{a.activo ? 'Activo' : 'Baja'}</span>
              </div>

              <div className="asesor-zonas-k">Zonas</div>
              <div className="asesor-zonas">
                {(a.zonas || []).map((z) => <span key={z} className="zona-chip">{z}</span>)}
                {(!a.zonas || a.zonas.length === 0) && <span className="muted" style={{ fontSize: 13 }}>Sin zonas asignadas</span>}
              </div>

              <div className="asesor-contact">
                <span className="asesor-mail">{a.email || '—'}</span>
                {wa && (
                  <a className="asesor-wa" href={wa} target="_blank" rel="noreferrer">
                    <span className="material-symbols-outlined">chat</span>WhatsApp
                  </a>
                )}
              </div>

              <div className="asesor-actions">
                <button className="btn btn-ink btn-sm" onClick={() => abrirEditar(a)}>Editar</button>
                {a.activo && <button className="btn btn-sm" onClick={() => darDeBaja(a)}>Dar de baja</button>}
              </div>
            </article>
          );
        })}
      </div>

      {form && (
        <div className="modal-bg" onClick={cerrar}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editId ? 'Editar asesor' : 'Nuevo asesor'}</h3>
            {error && <div className="form-error">{error}</div>}
            <div className="form-grid">
              <label>Nombre*<input value={form.nombre as string} onChange={(e) => set('nombre', e.target.value)} /></label>
              <label>Sucursal*<input value={form.sucursal as string} onChange={(e) => set('sucursal', e.target.value)} /></label>
              <label className="col-2">Zonas (una o varias, separadas por coma)
                <input value={form.zonas as string} onChange={(e) => set('zonas', e.target.value)} placeholder="Palermo, Recoleta, Belgrano" />
              </label>
              <label>Email<input value={form.email as string} onChange={(e) => set('email', e.target.value)} /></label>
              <label>Teléfono<input value={form.telefono as string} onChange={(e) => set('telefono', e.target.value)} /></label>
              <label className="check"><input type="checkbox" checked={form.activo as boolean} onChange={(e) => set('activo', e.target.checked)} /> Activo</label>
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={cerrar}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardar} disabled={guardando}>
                {guardando ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
