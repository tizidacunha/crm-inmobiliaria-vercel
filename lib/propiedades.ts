// Validación y normalización de propiedades (alta/edición por API).
// Mismo estilo que lib/asesores.ts: devuelve { ok, data } o { ok: false, errores } por campo.

export const TIPOS = ['departamento', 'ph', 'casa', 'local', 'oficina', 'terreno', 'cochera', 'galpon', 'edificio'] as const;
export const OPERACIONES = ['venta', 'alquiler', 'alquiler_temp'] as const;
export const MONEDAS = ['USD', 'ARS'] as const;

export type PropiedadInput = {
  titulo: string;
  descripcion: string | null;
  tipo: (typeof TIPOS)[number];
  operacion: (typeof OPERACIONES)[number];
  precio: number;
  moneda: (typeof MONEDAS)[number];
  ambientes: number | null;
  dormitorios: number | null;
  banos: number | null;
  superficie_m2: number | null;
  piso: string | null;
  direccion: string;
  barrio: string;
  ciudad: string;
  caracteristicas: string[];
  expensas: number | null;
  requisitos_garantia: string | null;
  disponible: boolean;
  destacado: boolean;
  codigo_aviso: string | null;
  url_publica: string | null;
  imagen_principal: string | null;
  imagenes: string[];
};

export type ErroresPropiedad = Partial<Record<keyof PropiedadInput, string>>;

const esURLHttp = (v: string) => {
  try { const u = new URL(v); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; }
};

/** Booleano estricto: acepta true/false (y "true"/"false" de formularios). Cualquier otra cosa es inválida. */
export function booleano(v: unknown, porDefecto: boolean): boolean | undefined {
  if (v === undefined || v === null || v === '') return porDefecto;
  if (v === true || v === 'true') return true;
  if (v === false || v === 'false') return false;
  return undefined;
}

export function validarPropiedad(b: Record<string, unknown>):
  { ok: true; data: PropiedadInput } | { ok: false; errores: ErroresPropiedad } {
  const errores: ErroresPropiedad = {};

  const texto = (k: keyof PropiedadInput, max: number, requerido: string | null, min = 1) => {
    const raw = b[k];
    if (raw != null && typeof raw !== 'string') { errores[k] = 'Tiene que ser texto'; return null; }
    const v = String(raw ?? '').trim().replace(/\s+/g, ' ');
    if (!v) { if (requerido) errores[k] = requerido; return null; }
    if (v.length < min) errores[k] = `Mínimo ${min} caracteres`;
    else if (v.length > max) errores[k] = `Máximo ${max} caracteres`;
    return v;
  };
  const numero = (k: keyof PropiedadInput, opts: { min: number; max: number; entero?: boolean; requerido?: string; mayorQueCero?: boolean }) => {
    const raw = b[k];
    if (raw === undefined || raw === null || raw === '') { if (opts.requerido) errores[k] = opts.requerido; return null; }
    const n = typeof raw === 'number' ? raw : typeof raw === 'string' && /^\s*-?\d+([.,]\d+)?\s*$/.test(raw) ? Number(raw.replace(',', '.')) : NaN;
    if (!Number.isFinite(n)) { errores[k] = 'Tiene que ser un número'; return null; }
    if (opts.entero && !Number.isInteger(n)) { errores[k] = 'Tiene que ser un número entero'; return null; }
    if (opts.mayorQueCero ? n <= 0 : n < opts.min) { errores[k] = opts.mayorQueCero ? 'Tiene que ser mayor a 0' : `No puede ser menor a ${opts.min}`; return null; }
    if (n > opts.max) { errores[k] = `No puede ser mayor a ${opts.max.toLocaleString('es-AR')}`; return null; }
    return n;
  };
  const lista = (k: 'caracteristicas' | 'imagenes', sep: RegExp, maxItems: number, maxLargo: number) => {
    const raw = b[k];
    if (raw != null && !Array.isArray(raw) && typeof raw !== 'string') { errores[k] = 'Formato inválido'; return []; }
    const items = (Array.isArray(raw) ? raw : String(raw ?? '').split(sep)).map((s) => String(s).trim()).filter(Boolean);
    const unicos = Array.from(new Set(items));
    if (unicos.length > maxItems) errores[k] = `Máximo ${maxItems} elementos`;
    else if (unicos.some((s) => s.length > maxLargo)) errores[k] = `Cada elemento puede tener hasta ${maxLargo} caracteres`;
    return unicos;
  };
  const enumerado = <T extends readonly string[]>(k: keyof PropiedadInput, valores: T, requerido: string, porDefecto?: T[number]) => {
    const raw = b[k] ?? porDefecto;
    if (raw === undefined || raw === null || raw === '') { errores[k] = requerido; return null; }
    const v = String(raw).trim();
    if (!(valores as readonly string[]).includes(v)) { errores[k] = `Valor inválido (opciones: ${valores.join(', ')})`; return null; }
    return v as T[number];
  };

  const titulo = texto('titulo', 200, 'El título es obligatorio', 5);
  const descripcion = texto('descripcion', 5000, null);
  const tipo = enumerado('tipo', TIPOS, 'Elegí el tipo de propiedad');
  const operacion = enumerado('operacion', OPERACIONES, 'Elegí la operación');
  const moneda = enumerado('moneda', MONEDAS, 'Elegí la moneda', 'USD');
  const precio = numero('precio', { min: 0, max: 10_000_000_000, requerido: 'El precio es obligatorio', mayorQueCero: true });

  const ambientes = numero('ambientes', { min: 1, max: 50, entero: true });
  const dormitorios = numero('dormitorios', { min: 0, max: 50, entero: true });
  const banos = numero('banos', { min: 0, max: 50, entero: true });
  if (ambientes != null && dormitorios != null && !errores.dormitorios && dormitorios >= ambientes) {
    errores.dormitorios = 'No puede haber tantos dormitorios como ambientes';
  }
  const superficie_m2 = numero('superficie_m2', { min: 0, max: 1_000_000, mayorQueCero: true });
  const expensas = numero('expensas', { min: 0, max: 100_000_000 });

  const piso = texto('piso', 10, null);
  if (piso && !/^(PB|EP|SS|\d{1,3})$/i.test(piso)) errores.piso = 'Piso inválido (número, PB, EP o SS)';
  const direccion = texto('direccion', 200, 'La dirección es obligatoria', 3);
  const barrio = texto('barrio', 80, 'El barrio es obligatorio', 2);
  const ciudad = texto('ciudad', 80, null) ?? 'Buenos Aires';
  const requisitos_garantia = texto('requisitos_garantia', 500, null);

  const codigo_aviso = texto('codigo_aviso', 30, null);
  if (codigo_aviso && !/^[A-Za-z0-9-]+$/.test(codigo_aviso)) errores.codigo_aviso = 'Solo letras, números y guiones';

  const url_publica = texto('url_publica', 500, null);
  if (url_publica && !esURLHttp(url_publica)) errores.url_publica = 'URL inválida (tiene que empezar con http:// o https://)';

  const caracteristicas = lista('caracteristicas', /,/, 60, 60);
  const imagenes = lista('imagenes', /\s+/, 40, 500);
  if (!errores.imagenes && imagenes.some((u) => !esURLHttp(u))) errores.imagenes = 'Todas las imágenes tienen que ser URLs http(s)';

  let imagen_principal = texto('imagen_principal', 500, null);
  if (imagen_principal && !esURLHttp(imagen_principal)) errores.imagen_principal = 'URL inválida (tiene que empezar con http:// o https://)';
  imagen_principal = imagen_principal || imagenes[0] || null;

  const disponible = booleano(b.disponible, true);
  if (disponible === undefined) errores.disponible = 'Tiene que ser verdadero o falso';
  const destacado = booleano(b.destacado, false);
  if (destacado === undefined) errores.destacado = 'Tiene que ser verdadero o falso';

  if (Object.keys(errores).length) return { ok: false, errores };
  return {
    ok: true,
    data: {
      titulo: titulo!, descripcion, tipo: tipo!, operacion: operacion!, precio: precio!, moneda: moneda!,
      ambientes, dormitorios, banos, superficie_m2, piso: piso ? piso.toUpperCase() : null,
      direccion: direccion!, barrio: barrio!, ciudad, caracteristicas, expensas, requisitos_garantia,
      disponible: disponible!, destacado: destacado!, codigo_aviso: codigo_aviso ? codigo_aviso.toUpperCase() : null,
      url_publica, imagen_principal, imagenes,
    },
  };
}
