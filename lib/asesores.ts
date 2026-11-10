// Catálogo de sucursales/zonas de la inmobiliaria y validación de asesores.
// Se usa tanto en el formulario (cliente) como en la API (servidor).
//
// Los nombres de zona van sin tildes a propósito: coinciden con propiedades.barrio
// y con lo que ya hay cargado en asesores.zonas.

export const ZONAS_POR_SUCURSAL: Record<string, string[]> = {
  Centro: [
    'Almagro', 'Balvanera', 'Caballito', 'Constitucion', 'Monserrat',
    'Puerto Madero', 'Retiro', 'San Cristobal', 'San Nicolas', 'San Telmo',
  ],
  Norte: [
    'Belgrano', 'Chacarita', 'Coghlan', 'Colegiales', 'Nunez', 'Palermo',
    'Recoleta', 'Saavedra', 'Villa Crespo', 'Villa Ortuzar', 'Villa Urquiza',
  ],
  Oeste: [
    'Agronomia', 'Flores', 'Floresta', 'Liniers', 'Mataderos', 'Monte Castro',
    'Paternal', 'Velez Sarsfield', 'Versalles', 'Villa del Parque', 'Villa Devoto',
    'Villa General Mitre', 'Villa Luro', 'Villa Pueyrredon', 'Villa Real', 'Villa Santa Rita',
  ],
  Sur: [
    'Barracas', 'Boedo', 'La Boca', 'Nueva Pompeya', 'Parque Avellaneda',
    'Parque Chacabuco', 'Parque Patricios', 'Villa Lugano', 'Villa Riachuelo', 'Villa Soldati',
  ],
};

export const SUCURSALES = Object.keys(ZONAS_POR_SUCURSAL);

// Nombre y apellido: letras (con tildes/ñ), espacios, apóstrofo, guion o punto.
const NOMBRE_RE = /^[A-Za-z\u00C1\u00C9\u00CD\u00D3\u00DA\u00DC\u00D1\u00E1\u00E9\u00ED\u00F3\u00FA\u00FC\u00F1][A-Za-z\u00C1\u00C9\u00CD\u00D3\u00DA\u00DC\u00D1\u00E1\u00E9\u00ED\u00F3\u00FA\u00FC\u00F1' .-]*$/;
const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/;

/** Saca del nombre todo lo que no sea letra, espacio, apóstrofo, guion o punto (para el input). */
export function limpiarNombre(v: string) {
  return v.replace(/[^A-Za-z\u00C1\u00C9\u00CD\u00D3\u00DA\u00DC\u00D1\u00E1\u00E9\u00ED\u00F3\u00FA\u00FC\u00F1' .-]/g, '').replace(/\s{2,}/g, ' ');
}

/** Devuelve los 10 dígitos locales (código de área sin 0 + número sin 15) de un teléfono argentino. */
export function telefonoLocal(v: string | null | undefined) {
  let d = String(v ?? '').replace(/\D/g, '');
  if (d.startsWith('549') && d.length === 13) d = d.slice(3);
  else if (d.startsWith('54') && d.length === 12) d = d.slice(2);
  else if (d.startsWith('0') && d.length === 11) d = d.slice(1);
  return d.slice(0, 10);
}

/** Formatea los dígitos locales para mostrarlos mientras se escribe: "11 2345-6789". */
export function formatearTelefono(digitos: string) {
  const d = digitos.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `${d.slice(0, 2)} ${d.slice(2)}`;
  return `${d.slice(0, 2)} ${d.slice(2, 6)}-${d.slice(6)}`;
}

export type AsesorInput = {
  nombre: string;
  email: string;
  telefono: string; // normalizado a +549XXXXXXXXXX
  sucursal: string;
  zonas: string[];
  activo: boolean;
};

export type ErroresAsesor = Partial<Record<'nombre' | 'email' | 'telefono' | 'sucursal' | 'zonas' | 'activo', string>>;

/**
 * Valida y normaliza los datos de un asesor.
 * `zonasPrevias`: zonas que el asesor ya tenía guardadas; se aceptan aunque no estén en el catálogo
 * para no romper la edición de registros viejos.
 */
export function validarAsesor(b: Record<string, unknown>, zonasPrevias: string[] = []):
  { ok: true; data: AsesorInput } | { ok: false; errores: ErroresAsesor } {
  const errores: ErroresAsesor = {};

  const nombre = String(b.nombre ?? '').trim().replace(/\s+/g, ' ');
  if (!nombre) errores.nombre = 'El nombre es obligatorio';
  else if (!NOMBRE_RE.test(nombre)) errores.nombre = 'Solo letras, espacios, apóstrofo o guion';
  else if (nombre.length > 60) errores.nombre = 'Máximo 60 caracteres';
  else if (nombre.split(' ').filter((p) => p.replace(/[^A-Za-z\u00C1\u00C9\u00CD\u00D3\u00DA\u00DC\u00D1\u00E1\u00E9\u00ED\u00F3\u00FA\u00FC\u00F1]/g, '').length >= 2).length < 2) {
    errores.nombre = 'Ingresá nombre y apellido';
  }

  const emailRaw = String(b.email ?? '').trim().toLowerCase();
  if (!emailRaw) errores.email = 'El email es obligatorio';
  else if (!EMAIL_RE.test(emailRaw) || emailRaw.length > 100) errores.email = 'Email inválido (ej: nombre@horizonte.com)';

  const telRaw = String(b.telefono ?? '').trim();
  let telefono = '';
  if (!telRaw) errores.telefono = 'El teléfono es obligatorio';
  else {
    if (/[^\d\s+()-]/.test(telRaw)) errores.telefono = 'Solo números';
    else {
      const digitos = telRaw.replace(/\D/g, '');
      const local = telefonoLocal(telRaw);
      const sinPrefijo = /^(549\d{10}|54\d{10}|0\d{10}|\d{10})$/.test(digitos);
      if (!sinPrefijo || local.length !== 10 || local.startsWith('0')) {
        errores.telefono = 'Tiene que tener 10 dígitos: código de área sin 0 y número sin 15 (ej: 11 2345-6789)';
      } else telefono = `+549${local}`;
    }
  }

  const sucursal = String(b.sucursal ?? '');
  if (!sucursal) errores.sucursal = 'Elegí una sucursal';
  else if (!SUCURSALES.includes(sucursal)) errores.sucursal = 'Sucursal inexistente';

  const zonasIn = Array.isArray(b.zonas) ? b.zonas.map(String) : [];
  const zonas = Array.from(new Set(zonasIn));
  const validas = new Set([...(ZONAS_POR_SUCURSAL[sucursal] ?? []), ...zonasPrevias]);
  const invalidas = zonas.filter((z) => !validas.has(z));
  if (sucursal && !errores.sucursal) {
    if (zonas.length === 0) errores.zonas = 'Elegí al menos una zona';
    else if (invalidas.length) errores.zonas = `Zonas fuera de la sucursal ${sucursal}: ${invalidas.join(', ')}`;
  }

  // Activo: booleano estricto ("false" de un formulario cuenta como false; cualquier otra cosa es inválida).
  const activo = b.activo === undefined || b.activo === null || b.activo === true || b.activo === 'true'
    ? true
    : b.activo === false || b.activo === 'false' ? false : null;
  if (activo === null) errores.activo = 'Tiene que ser verdadero o falso';

  if (Object.keys(errores).length) return { ok: false, errores };
  return {
    ok: true,
    data: { nombre, email: emailRaw, telefono, sucursal, zonas, activo: activo as boolean },
  };
}

/**
 * Email y teléfono son únicos entre asesores (el bot deriva por teléfono; el email identifica a la persona).
 * `existentes`: filas { id, email, telefono }. `excluirId`: el propio asesor al editar.
 * Devuelve los errores por campo, o null si no hay duplicados.
 */
export function duplicadosAsesor(
  a: Pick<AsesorInput, 'email' | 'telefono'>,
  existentes: { id: unknown; email: unknown; telefono: unknown }[],
  excluirId?: number,
): ErroresAsesor | null {
  const otros = existentes.filter((e) => Number(e.id) !== excluirId);
  const errores: ErroresAsesor = {};
  if (otros.some((e) => String(e.email ?? '').toLowerCase() === a.email)) errores.email = 'Ya hay otro asesor con este email';
  if (otros.some((e) => telefonoLocal(String(e.telefono ?? '')) === telefonoLocal(a.telefono))) errores.telefono = 'Ya hay otro asesor con este teléfono';
  return Object.keys(errores).length ? errores : null;
}
