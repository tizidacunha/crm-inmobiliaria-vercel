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

  return (
    <div>
      <div className="toolbar">
        <span className="muted">{inicial.filter((a) => a.activo).length} activos · {inicial.length} en total</span>
        <button className="btn btn-primary" onClick={abrirNuevo}>+ Nuevo asesor</button>
      </div>

      <div className="card table-card">
        <table className="tabla">
          <thead>
            <tr><th>Nombre</th><th>Sucursal</th><th>Zonas</th><th>Contacto</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            {inicial.map((a) => (
              <tr key={a.id} className={a.activo ? '' : 'row-off'}>
                <td>{a.nombre}</td>
                <td>{a.sucursal}</td>
                <td>{(a.zonas || []).map((z) => <span key={z} className="chip">{z}</span>)}</td>
                <td className="muted">
                  {a.email || '—'}
                  {a.telefono && (
                    <>
                      <br />
                      <a
                        href={`https://wa.me/${a.telefono.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: 'var(--primary)', fontWeight: 600 }}
                      >
                        {a.telefono} · WhatsApp ↗
                      </a>
                    </>
                  )}
                </td>
                <td><span className={`badge ${a.activo ? 'ok' : 'off'}`}>{a.activo ? 'Activo' : 'Baja'}</span></td>
                <td className="acciones">
                  <button className="btn btn-sm" onClick={() => abrirEditar(a)}>Editar</button>
                  {a.activo && <button className="btn btn-sm" onClick={() => darDeBaja(a)}>Dar de baja</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
