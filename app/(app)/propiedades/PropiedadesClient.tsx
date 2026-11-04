'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
    <svg className="prop-illus" viewBox="0 0 360 210" fill="none" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M204 150 A46 46 0 0 1 296 150 Z" fill={sol} />
      <line x1="24" y1="150" x2="336" y2="150" stroke={linea} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <line x1="60" y1="172" x2="300" y2="172" stroke={linea} strokeWidth="2" strokeLinecap="round" opacity="0.35" />
      <path d="M84 150 L84 92 L112 66 L140 92 L140 150" stroke={linea} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M104 150 L104 116 L122 116 L122 150" stroke={linea} strokeWidth="2.2" strokeLinejoin="round" />
    </svg>
  );
}

function Galeria({ fotos, alt }: { fotos: string[]; alt: string }) {
  const [i, setI] = useState(0);
  const [rotas, setRotas] = useState<Set<string>>(new Set());
  const visibles = fotos.filter((f) => !rotas.has(f));

  if (visibles.length === 0) return null;
  const actual = Math.min(i, visibles.length - 1);
  const mover = (d: number) => setI((actual + d + visibles.length) % visibles.length);

  return (
    <div className="galeria">
      {/* eslint-disable-next-line @next/next/no-img-element -- URLs externas de cualquier dominio */}
      <img
        src={visibles[actual]}
        alt={alt}
        loading="lazy"
        onError={() => setRotas((r) => new Set(r).add(visibles[actual]))}
      />
      <span className="prop-count">{actual + 1}/{visibles.length}</span>
      {visibles.length > 1 && (
        <>
          <button className="galeria-nav prev" onClick={() => mover(-1)} aria-label="Foto anterior">‹</button>
          <button className="galeria-nav next" onClick={() => mover(1)} aria-label="Foto siguiente">›</button>
          <div className="galeria-dots">
            {visibles.map((f, k) => (
              <button
                key={f}
                className={k === actual ? 'on' : ''}
                onClick={() => setI(k)}
                aria-label={`Foto ${k + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
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
    <article className={`prop-card${p.disponible ? '' : ' off'}${p.destacado ? ' destacada' : ''}`}>
      <div className={`prop-media${esVenta ? '' : ' rent'}`}>
        {fotos.length > 0 ? <Galeria fotos={fotos} alt={p.titulo} /> : <HouseIllus tone={esVenta ? 'ink' : 'rent'} />}
        <span className={`prop-op op-${p.operacion}`}>{OPERACION_LABEL[p.operacion] ?? p.operacion}</span>
        {p.destacado && (
          <span className="prop-dest"><span className="material-symbols-outlined">star</span>Destacado</span>
        )}
        {!p.disponible && <span className="prop-nodisp">No disponible</span>}
      </div>

      <div className="prop-body">
        <div className="prop-top">
          <div>
            <div className="prop-precio">{precioTexto(p)}</div>
            {p.expensas != null && <div className="prop-expensas">+ $ {fmt(p.expensas)} expensas</div>}
          </div>
          <span className={`badge ${p.disponible ? 'ok' : 'off'}`}>
            {p.disponible ? 'Disponible' : 'No disp.'}
          </span>
        </div>

        <h3 className="prop-dir">{p.direccion}</h3>
        <div className="prop-barrio">
          {[p.barrio, p.ciudad].filter(Boolean).join(', ')} · {TIPO_LABEL[p.tipo] ?? p.tipo}
        </div>

        {feats.length > 0 && (
          <ul className="prop-feats">{feats.map((f) => <li key={f}>{f}</li>)}</ul>
        )}

        {p.descripcion && <p className="prop-desc">{p.descripcion}</p>}

        <div className="prop-foot">
          <div className="prop-cod"><b>Cód.</b>{p.codigo_aviso || '—'}</div>
          <div className="prop-foot-actions">
            {p.url_publica && (
              <a className="prop-pub" href={p.url_publica} target="_blank" rel="noopener noreferrer">
                Ver publicación ↗
              </a>
            )}
            <button className="btn btn-ink btn-sm" onClick={onEditar}>Editar</button>
          </div>
        </div>

        <div className="prop-manage">
          <button className="btn btn-sm" onClick={onToggle}>
            {p.disponible ? 'Marcar no disponible' : 'Marcar disponible'}
          </button>
        </div>
      </div>
    </article>
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

  return (
    <div>
      <div className="phero">
        <div>
          <div className="phero-kick">Cartera publicada</div>
          <h2 className="phero-title">Propiedades</h2>
        </div>
        <div className="phero-stats">
          <div className="pstat"><div className="n">{inicial.length}</div><div className="k">Total</div></div>
          <div className="pstat"><div className="n">{disponibles}</div><div className="k">Disponibles</div></div>
          <div className="pstat light"><div className="n">{enAlquiler}</div><div className="k">En alquiler</div></div>
          <div className="pstat accent"><div className="n">{enVenta}</div><div className="k">En venta</div></div>
        </div>
      </div>

      <div className="toolbar prop-toolbar">
        <div className="segmented">
          {['todas', ...OPERACIONES].map((op) => (
            <button key={op} className={filtroOp === op ? 'on' : ''} onClick={() => setFiltroOp(op)}>
              {op === 'todas' ? 'Todas' : OPERACION_LABEL[op]}
            </button>
          ))}
        </div>
        <input
          className="prop-search"
          type="search"
          placeholder="Dirección, barrio o código…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <select className="prop-select" value={filtroBarrio} onChange={(e) => setFiltroBarrio(e.target.value)}>
          <option value="todos">Todos los barrios</option>
          {barrios.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select className="prop-select" value={orden} onChange={(e) => setOrden(e.target.value)}>
          <option value="recientes">Más recientes</option>
          <option value="precio_asc">Precio ↑</option>
          <option value="precio_desc">Precio ↓</option>
        </select>
        <span className="muted">{filtradas.length} de {inicial.length}</span>
      </div>

      <div className="prop-new-row">
        <button className="btn btn-primary" onClick={abrirNueva}>+ Nueva propiedad</button>
      </div>

      <div className="prop-grid">
        {filtradas.map((p) => (
          <PropiedadCard
            key={p.id}
            p={p}
            onToggle={() => toggleDisponible(p)}
            onEditar={() => abrirEditar(p)}
          />
        ))}
        {filtradas.length === 0 && (
          <div className="prop-empty">No hay propiedades que coincidan con el filtro.</div>
        )}
      </div>

      {form && (
        <div className="modal-bg" onClick={cerrar}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editId ? 'Editar propiedad' : 'Nueva propiedad'}</h3>
            {error && <div className="form-error">{error}</div>}
            <div className="form-grid">
              <label>Título*<input value={form.titulo as string} onChange={(e) => set('titulo', e.target.value)} /></label>
              <label>Barrio*<input value={form.barrio as string} onChange={(e) => set('barrio', e.target.value)} /></label>
              <label>Tipo
                <select value={form.tipo as string} onChange={(e) => set('tipo', e.target.value)}>
                  {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label>Operación
                <select value={form.operacion as string} onChange={(e) => set('operacion', e.target.value)}>
                  {OPERACIONES.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>
              <label>Precio*<input type="number" value={form.precio as string} onChange={(e) => set('precio', e.target.value)} /></label>
              <label>Moneda
                <select value={form.moneda as string} onChange={(e) => set('moneda', e.target.value)}>
                  <option value="ARS">ARS</option><option value="USD">USD</option>
                </select>
              </label>
              <label>Expensas<input type="number" value={form.expensas as string} onChange={(e) => set('expensas', e.target.value)} placeholder="dejar vacío si no hay dato" /></label>
              <label>Ambientes<input type="number" value={form.ambientes as string} onChange={(e) => set('ambientes', e.target.value)} /></label>
              <label>Dormitorios<input type="number" value={form.dormitorios as string} onChange={(e) => set('dormitorios', e.target.value)} /></label>
              <label>Baños<input type="number" value={form.banos as string} onChange={(e) => set('banos', e.target.value)} /></label>
              <label>Superficie m²<input type="number" value={form.superficie_m2 as string} onChange={(e) => set('superficie_m2', e.target.value)} /></label>
              <label>Piso<input value={form.piso as string} onChange={(e) => set('piso', e.target.value)} /></label>
              <label>Dirección*<input value={form.direccion as string} onChange={(e) => set('direccion', e.target.value)} /></label>
              <label>Requisitos garantía<input value={form.requisitos_garantia as string} onChange={(e) => set('requisitos_garantia', e.target.value)} /></label>
              <label className="col-2">Características (separadas por coma)<input value={form.caracteristicas as string} onChange={(e) => set('caracteristicas', e.target.value)} /></label>
              <label className="col-2">Descripción<textarea value={form.descripcion as string} onChange={(e) => set('descripcion', e.target.value)} /></label>
              <label>Código de aviso<input value={form.codigo_aviso as string} onChange={(e) => set('codigo_aviso', e.target.value)} /></label>
              <label>URL de la publicación<input type="url" value={form.url_publica as string} onChange={(e) => set('url_publica', e.target.value)} placeholder="https://…" /></label>
              <label className="col-2">Imágenes (una URL por línea, la primera es la principal)
                <textarea value={form.imagenes as string} onChange={(e) => set('imagenes', e.target.value)} />
              </label>
              {String(form.imagenes || '').trim() && (
                <div className="col-2 form-thumbs">
                  {String(form.imagenes).split(/\s+/).filter(Boolean).map((u, k) => (
                    // eslint-disable-next-line @next/next/no-img-element -- vista previa de URLs externas
                    <img key={`${u}-${k}`} src={u} alt={`Imagen ${k + 1}`} className={k === 0 ? 'principal' : ''} />
                  ))}
                </div>
              )}
              <label className="check"><input type="checkbox" checked={form.disponible as boolean} onChange={(e) => set('disponible', e.target.checked)} /> Disponible</label>
              <label className="check"><input type="checkbox" checked={form.destacado as boolean} onChange={(e) => set('destacado', e.target.checked)} /> Destacado</label>
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
