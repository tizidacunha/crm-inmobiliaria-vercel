// ============================================================
//  Datos de PRUEBA (demo) — snapshot congelado.
//  Esta versión NO usa base de datos ni WhatsApp: todo es mock.
// ============================================================
import goldstein from './propiedades-goldstein.json';

export type Row = Record<string, unknown>;

/* Propiedades reales publicadas por Goldstein Propiedades (goldsteinpropiedades.com).
   Cada una conserva su url_publica a la ficha original. Se regeneran con scripts/scrape-goldstein.mjs. */
export const propiedades: Row[] = goldstein as Row[];

// Asesores alineados al catálogo de lib/asesores.ts (sucursal → zonas, nombres de zona sin tildes; teléfono +549…).
export const asesores: Row[] = [
  { id: 1, nombre: 'Martina Rossi', email: 'mrossi@horizonte.com.ar', telefono: '+5491144556611', sucursal: 'Norte', zonas: ['Palermo', 'Recoleta', 'Belgrano', 'Villa Crespo'], activo: true },
  { id: 2, nombre: 'Julián Gómez', email: 'jgomez@horizonte.com.ar', telefono: '+5491144556622', sucursal: 'Centro', zonas: ['Caballito', 'Almagro', 'Balvanera', 'San Telmo'], activo: true },
  { id: 3, nombre: 'Sofía Herrera', email: 'sherrera@horizonte.com.ar', telefono: '+5491144556633', sucursal: 'Norte', zonas: ['Nunez', 'Colegiales', 'Villa Urquiza', 'Saavedra', 'Belgrano'], activo: true },
  { id: 4, nombre: 'Valeria Ibarra', email: 'vibarra@horizonte.com.ar', telefono: '+5491144556655', sucursal: 'Oeste', zonas: ['Flores', 'Floresta', 'Villa Devoto'], activo: true },
  { id: 5, nombre: 'Diego Paz', email: 'dpaz@horizonte.com.ar', telefono: '+5491144556644', sucursal: 'Sur', zonas: ['Boedo', 'Parque Chacabuco', 'Barracas'], activo: false },
];

/* ---------- fechas relativas (siempre "frescas") ---------- */
const dayISO = (off: number) => { const x = new Date(); x.setDate(x.getDate() + off); return x.toISOString().slice(0, 10); };
const stamp = (minsAgo: number) => { const x = new Date(); x.setMinutes(x.getMinutes() - minsAgo); return x.toISOString(); };
const ddmm = (iso: string) => { const [, m, d] = iso.split('-'); return `${d}/${m}`; };
const hhmm = (t: string) => t.slice(0, 5);

/* ---------- propiedades de referencia para los chats/visitas escritos a mano ----------
   Busca una propiedad real que cumpla los filtros; si no hay, va relajando (ambientes → tipo → barrio). */
type Filtro = { operacion?: string; barrio?: string; tipo?: string; ambientes?: number };
function buscarProp(f: Filtro): Row {
  const vivienda = propiedades.filter((p) => p.disponible && ['departamento', 'ph', 'casa'].includes(String(p.tipo)));
  const cumple = (g: Filtro) => (p: Row) =>
    (!g.operacion || p.operacion === g.operacion) && (!g.barrio || p.barrio === g.barrio) &&
    (!g.tipo || p.tipo === g.tipo) && (!g.ambientes || Number(p.ambientes) === g.ambientes);
  for (const g of [f, { ...f, ambientes: undefined }, { ...f, ambientes: undefined, tipo: undefined }, { operacion: f.operacion }]) {
    const p = vivienda.find(cumple(g));
    if (p) return p;
  }
  return vivienda[0];
}
const ref = {
  facundo: buscarProp({ operacion: 'alquiler', barrio: 'Caballito', ambientes: 2 }),
  lucia: buscarProp({ operacion: 'alquiler', barrio: 'Palermo', ambientes: 1 }),
  bruno: buscarProp({ operacion: 'alquiler', barrio: 'Almagro', tipo: 'ph' }),
  valentina: buscarProp({ operacion: 'alquiler', barrio: 'Villa Crespo' }),
  mateo: buscarProp({ operacion: 'venta', barrio: 'Almagro', tipo: 'ph' }),
  camila: buscarProp({ operacion: 'venta', barrio: 'Caballito', ambientes: 3 }),
  tomas: buscarProp({ operacion: 'venta', barrio: 'Balvanera', ambientes: 2 }),
};
const precioDe = (p: Row) => `${p.moneda === 'USD' ? 'USD' : '$'} ${Number(p.precio).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
const ambDe = (p: Row) => (Number(p.ambientes) === 1 ? 'un monoambiente' : `un ${p.ambientes} ambientes`);
const visitaRef = (id: number, nombre: string, tel: string, p: Row, dia: number, hora: string, estado: string, notas: string | null = null): Row => ({
  id, chat_id: `${tel}@c.us`, nombre_cliente: nombre, telefono: tel, propiedad_id: p.id, propiedad_titulo: p.titulo,
  fecha_visita: dayISO(dia), hora_visita: `${hora}:00`, notas, estado,
});

/* ---------- visitas (agenda de prueba) ---------- */
export const visitas: Row[] = [
  visitaRef(1, 'Facundo Ibáñez', '5491144556677', ref.facundo, 0, '11:00', 'confirmada'),
  visitaRef(2, 'Lucía Fernández', '5491155667788', ref.lucia, 0, '16:00', 'confirmada'),
  visitaRef(3, 'Bruno Castro', '5491166778899', ref.bruno, 1, '09:30', 'confirmada', 'Consultó por requisitos de garantía.'),
  visitaRef(4, 'Valentina Sosa', '5491177889900', ref.valentina, 2, '14:00', 'confirmada'),
  visitaRef(5, 'Mateo Duarte', '5491188990011', ref.mateo, 3, '10:00', 'confirmada'),
  visitaRef(6, 'Camila Ruiz', '5491199001122', ref.camila, 4, '17:30', 'confirmada'),
  visitaRef(7, 'Tomás Vega', '5491100112233', ref.tomas, -2, '12:00', 'cancelada'),
];

/* ---------- conversaciones del asistente (leads de prueba) ---------- */
export const conversaciones: Row[] = [
  { user_id: '5491144556677@c.us', user_name: 'Facundo Ibáñez', role: 'Cliente', message: `Hola, busco ${ambDe(ref.facundo)} en alquiler por ${ref.facundo.barrio}`, timestamp: stamp(42), message_id: 'f1' },
  { user_id: '5491144556677@c.us', user_name: 'Facundo Ibáñez', role: 'IA', message: `En ${ref.facundo.barrio} tengo ${ambDe(ref.facundo)} en ${ref.facundo.direccion} a ${precioDe(ref.facundo)}${Number(ref.facundo.expensas) ? ` + $${Number(ref.facundo.expensas).toLocaleString('es-AR')} de expensas` : ''}. ¿Querés que te agende una visita?`, timestamp: stamp(41), message_id: 'f2' },
  { user_id: '5491144556677@c.us', user_name: 'Facundo Ibáñez', role: 'Cliente', message: `Por la zona de ${ref.facundo.barrio}, sí me interesa`, timestamp: stamp(40), message_id: 'f3' },

  { user_id: '5491177889900@c.us', user_name: 'Valentina Sosa', role: 'Cliente', message: 'Buenas! estoy buscando para alquilar', timestamp: stamp(95), message_id: 'v1' },
  { user_id: '5491177889900@c.us', user_name: 'Valentina Sosa', role: 'IA', message: '¡Hola! ¿Qué tipo de propiedad estás buscando? Puedes decirme el barrio, precio, cantidad de ambientes o si prefieres alquiler o venta. 🏡', timestamp: stamp(94), message_id: 'v2' },

  { user_id: '5491188990011@c.us', user_name: 'Mateo Duarte', role: 'Cliente', message: `qué requisitos piden para comprar el ph de ${ref.mateo.barrio}?`, timestamp: stamp(140), message_id: 'm1' },
  { user_id: '5491188990011@c.us', user_name: 'Mateo Duarte', role: 'IA', message: 'Los requisitos de esa propiedad son a confirmar con un asesor. Te recomiendo que te contactes con nosotros y un asesor se pondrá en contacto para brindarte esa información.', timestamp: stamp(139), message_id: 'm2' },

  { user_id: '5491166778899@c.us', user_name: 'Bruno Castro', role: 'Cliente', message: 'Quiero hablar con un asesor', timestamp: stamp(220), message_id: 'b1' },
  { user_id: '5491166778899@c.us', user_name: 'Bruno Castro', role: 'IA', message: '¡Perfecto! Te derivo con un asesor de nuestro equipo. En breve se va a contactar con vos. 🙌', timestamp: stamp(219), message_id: 'b2' },

  { user_id: '5491155667788@c.us', user_name: 'Lucía Fernández', role: 'Cliente', message: `me gustaría ver ${ambDe(ref.lucia)} en alquiler de ${ref.lucia.barrio}`, timestamp: stamp(310), message_id: 'l1' },
  { user_id: '5491155667788@c.us', user_name: 'Lucía Fernández', role: 'IA', message: `Tu visita a ${ref.lucia.direccion} (${ref.lucia.barrio}) quedó confirmada para hoy a las 16:00. ¡Te esperamos! 🏠`, timestamp: stamp(309), message_id: 'l2' },
];

/* Minutos en un día (lo usa el generador de chats). */
const D = 24 * 60;

/* ============================================================
   Generador con semilla fija para poblar la demo a escala:
   ~90 propiedades, ~40 chats y un calendario de visitas casi lleno.
   Siempre produce los mismos datos (solo cambian las fechas, que son relativas a hoy).
   ============================================================ */
function prng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = prng(20261110);
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)];
const entre = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1));
const muestra = <T>(arr: readonly T[], n: number): T[] => {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [copia[i], copia[j]] = [copia[j], copia[i]]; }
  return copia.slice(0, n);
};
const miles = (n: number) => n.toLocaleString('es-AR', { maximumFractionDigits: 0 });

/* ---------- nombres para chats y visitas generados ---------- */
const NOMBRES = ['Lautaro', 'Milagros', 'Federico', 'Antonella', 'Tomás', 'Sol', 'Franco', 'Belén', 'Matías', 'Victoria',
  'Leandro', 'Josefina', 'Ramiro', 'Delfina', 'Emiliano', 'Abril', 'Marcos', 'Catalina', 'Iván', 'Luciana',
  'Bautista', 'Pilar', 'Alan', 'Morena', 'Damián', 'Brenda', 'Cristian', 'Jazmín', 'Esteban', 'Candela'];
const APELLIDOS = ['González', 'Rodríguez', 'López', 'Martínez', 'Pérez', 'García', 'Sánchez', 'Romero', 'Díaz', 'Álvarez',
  'Ruiz', 'Ramírez', 'Medina', 'Herrera', 'Suárez', 'Pereyra', 'Rojas', 'Gutiérrez', 'Molina', 'Castro', 'Ortiz', 'Luna'];
const nombreAzar = () => `${pick(NOMBRES)} ${pick(APELLIDOS)}`;

let proximaVisitaId = Math.max(...visitas.map((v) => Number(v.id))) + 1;
const precioTxt = (p: Row) => (p.moneda === 'USD' ? `USD ${miles(Number(p.precio))}` : `$${miles(Number(p.precio))}`);

/* ---------- chats generados (36) ---------- */
const paraChats = propiedades.filter((p) => p.disponible && ['departamento', 'ph', 'casa'].includes(String(p.tipo)) && Number(p.ambientes) > 0);
for (let k = 0; k < 36; k++) {
  const p = pick(paraChats);
  const nombre = `${NOMBRES[k % NOMBRES.length]} ${pick(APELLIDOS)}`;
  const tel = `5491160${String(100000 + k * 37).padStart(6, '0')}`;
  const verbo = p.operacion === 'venta' ? 'comprar' : 'alquilar';
  const ambTxt = p.ambientes === 1 ? 'un monoambiente' : `un ${p.ambientes} ambientes`;
  const tipoTxt = p.tipo === 'ph' ? 'un PH' : p.tipo === 'casa' ? 'una casa' : 'un departamento';

  const mensajes: [string, string][] = [
    ['Cliente', pick([
      `Hola! Quiero ${verbo} ${ambTxt} en ${p.barrio}`,
      `Buenas, busco ${ambTxt} para ${verbo} por ${p.barrio}`,
      `Hola, estoy buscando ${ambTxt} en ${p.barrio} para ${verbo}`,
    ])],
    ['IA', `En ${p.barrio} tengo ${tipoTxt} de ${p.ambientes} amb. en ${p.direccion} a ${precioTxt(p)}${Number(p.expensas) ? ` + $${miles(Number(p.expensas))} de expensas` : ''}. ¿Querés que te pase fotos?`],
  ];

  const r = rnd();
  if (r < 0.3) {
    // Visita agendada: también aparece en el calendario.
    const fecha = dayISO(entre(1, 12));
    const hora = pick(['10:00', '11:30', '13:00', '15:00', '16:30', '18:00']);
    mensajes.push(['Cliente', `Dale, ¿puede ser el ${ddmm(fecha)} a las ${hora}?`]);
    mensajes.push(['IA', `Listo ${nombre.split(' ')[0]}, tu visita quedó agendada para el ${ddmm(fecha)} a las ${hora}. ✅`]);
    visitas.push({
      id: proximaVisitaId++, chat_id: `${tel}@c.us`, nombre_cliente: nombre, telefono: tel, propiedad_id: p.id,
      propiedad_titulo: p.titulo, fecha_visita: fecha, hora_visita: `${hora}:00`, notas: null, estado: 'confirmada',
    });
  } else if (r < 0.5) {
    mensajes.push(['Cliente', pick(['¿Se puede negociar el precio?', '¿Qué garantías aceptan?', 'Prefiero hablar con una persona'])]);
    mensajes.push(['IA', `Te derivo con un asesor de la zona de ${p.barrio}, que te va a contactar en breve. 🙌`]);
  } else if (r < 0.75) {
    mensajes.push(['Cliente', pick(['Sí, me interesa. ¿Cuándo se puede visitar?', 'Me interesa, pasame fotos porfa', 'Sí me interesa!'])]);
  } else {
    mensajes.push(['Cliente', pick(['¿Las expensas incluyen agua?', '¿Tiene cochera?', '¿Cuántos años tiene el edificio?', '¿Está disponible ya?'])]);
    mensajes.push(['IA', 'Te confirmo ese dato apenas lo chequee con la administración.']);
  }

  const minsAgo = entre(30, 10 * D);
  mensajes.forEach(([role, message], i) => conversaciones.push({
    user_id: `${tel}@c.us`, user_name: nombre, role, message,
    timestamp: stamp(minsAgo + (mensajes.length - 1 - i) * 2), message_id: `g${k}-${i}`,
  }));
}

/* ---------- calendario de visitas casi lleno (de -21 a +30 días) ---------- */
const SLOTS = Array.from({ length: 21 }, (_, i) => `${String(9 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`);
const NOTAS = ['Viene con su pareja.', 'Pidió ver también la cochera.', 'Consulta por crédito hipotecario.',
  'Llega 10 minutos tarde.', 'Interesado en mudarse el mes que viene.', 'Primera visita, viene de recomendación.'];
const paraVisitas = propiedades.filter((p) => p.disponible);
for (let off = -21; off <= 30; off++) {
  const dia = new Date(); dia.setDate(dia.getDate() + off);
  const dow = dia.getDay();
  const n = dow === 0 ? entre(0, 1) : dow === 6 ? entre(3, 5) : entre(6, 9);
  for (const hora of muestra(SLOTS, n).sort()) {
    const p = pick(paraVisitas);
    const r = rnd();
    const estado = off < 0 ? (r < 0.85 ? 'confirmada' : 'cancelada') : r < 0.7 ? 'confirmada' : r < 0.9 ? 'pendiente' : 'cancelada';
    const tel = `5491170${String(100000 + proximaVisitaId).padStart(6, '0')}`;
    visitas.push({
      id: proximaVisitaId++, chat_id: `${tel}@c.us`, nombre_cliente: nombreAzar(), telefono: tel, propiedad_id: p.id,
      propiedad_titulo: p.titulo, fecha_visita: dayISO(off), hora_visita: `${hora}:00`,
      notas: rnd() < 0.15 ? pick(NOTAS) : null, estado,
    });
  }
}

const disp = () => propiedades.filter((p) => p.disponible);

/* Derivaciones pendientes: chats cuyo último mensaje deriva a un asesor (misma regla que la bandeja). */
const derivacionesPendientes = () =>
  ultimosPorUsuario().filter((c) => /\bderiv|asesor\b/i.test(String(c.message))).length;

/* Mensajes de los clientes (no de la IA), para detectar qué busca cada chat. */
export function mensajesClientes(): Row[] {
  return conversaciones.filter((c) => c.role !== 'IA').map((c) => ({ user_id: c.user_id, message: c.message }));
}

export function navCounts(): Row {
  return {
    propiedades: disp().length,
    visitas_hoy: visitas.filter((v) => v.estado === 'confirmada' && v.fecha_visita === dayISO(0)).length,
    chats: new Set(conversaciones.map((c) => c.user_id)).size,
    derivaciones: derivacionesPendientes(),
  };
}

export function homeKpis(): Row {
  const d = disp();
  return {
    prop_activas: d.length,
    prop_alquiler: d.filter((p) => String(p.operacion).startsWith('alquiler')).length,
    prop_venta: d.filter((p) => p.operacion === 'venta').length,
    prop_destacadas: d.filter((p) => p.destacado).length,
    visitas_hoy: visitas.filter((v) => v.estado === 'confirmada' && v.fecha_visita === dayISO(0)).length,
    visitas_prox: visitas.filter((v) => v.estado === 'confirmada' && (v.fecha_visita as string) >= dayISO(0)).length,
    conversaciones: new Set(conversaciones.map((c) => c.user_id)).size,
    derivaciones: derivacionesPendientes(),
  };
}

export function proximasVisitas(n: number): Row[] {
  return visitas
    .filter((v) => v.estado === 'confirmada' && (v.fecha_visita as string) >= dayISO(0))
    .sort((a, b) => String(a.fecha_visita + String(a.hora_visita)).localeCompare(String(b.fecha_visita) + String(b.hora_visita)))
    .slice(0, n)
    .map((v) => ({ nombre_cliente: v.nombre_cliente, telefono: v.telefono, propiedad_titulo: v.propiedad_titulo, fecha: ddmm(v.fecha_visita as string), hora: hhmm(v.hora_visita as string) }));
}

function ultimosPorUsuario(): Row[] {
  const byUser = new Map<string, Row>();
  for (const c of conversaciones) {
    const prev = byUser.get(c.user_id as string);
    if (!prev || (c.timestamp as string) > (prev.timestamp as string)) byUser.set(c.user_id as string, c);
  }
  return [...byUser.values()].sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
}

export function ultimasConversaciones(n: number): Row[] {
  return ultimosPorUsuario().slice(0, n).map((c) => {
    const t = new Date(c.timestamp as string);
    const cuando = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
    return { user_id: c.user_id, user_name: c.user_name, message: c.message, cuando };
  });
}

export function chatsList(): Row[] {
  return ultimosPorUsuario().map((c) => ({ user_id: c.user_id, user_name: c.user_name, last_message: c.message, last_role: c.role, last_timestamp: c.timestamp }));
}

export function thread(userId: string): Row[] {
  return conversaciones
    .filter((c) => c.user_id === userId)
    .sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)))
    .map((c) => ({ user_id: c.user_id, user_name: c.user_name, message: c.message, role: c.role, timestamp: c.timestamp, message_id: c.message_id }));
}

export function resolvePhoneMock(userId: string): string | null {
  if (!userId) return null;
  if (userId.endsWith('@c.us')) return '+' + userId.split('@')[0];
  if (userId.endsWith('@lid')) return null;
  return null;
}
