import { z } from "zod"

/* ── Piezas reutilizables ───────────────────────────────────────────── */

// Nombre: letras, espacios y signos de nombre; sin números.
export const nombre = z
  .string()
  .trim()
  .min(2, "Ingresá un nombre")
  .regex(/^[\p{L}\s'’.-]+$/u, "El nombre no puede tener números")

// Email: exige @ y dominio con punto (ej. nombre@dominio.com).
export const email = z
  .string()
  .trim()
  .email("Email inválido (ej. nombre@dominio.com)")

export const emailOpcional = z.union([email, z.literal("")])

// Teléfono: solo dígitos y separadores comunes.
export const telefono = z
  .string()
  .trim()
  .regex(/^[\d\s()+-]{6,}$/, "Teléfono inválido (solo números)")

export const telefonoOpcional = z.union([telefono, z.literal("")])

// URL opcional (acepta vacío).
export const urlOpcional = z.union([
  z.string().trim().url("URL inválida (ej. https://…)"),
  z.literal(""),
])

const vacioAUndefined = (v: unknown) =>
  v === "" || v === null || v === undefined ? undefined : v

// Número requerido y positivo (precio).
export const numeroPositivo = z.coerce.number().positive("Debe ser mayor a 0")

// Número opcional, no negativo (expensas, ambientes, m², etc.).
export const numeroOpcional = z.preprocess(
  vacioAUndefined,
  z.coerce.number().nonnegative("No puede ser negativo").optional()
)

/* ── Schemas de formularios ─────────────────────────────────────────── */

export const asesorSchema = z.object({
  nombre,
  sucursal: z.string().trim().min(1, "Elegí o ingresá una sucursal"),
  zonas: z.array(z.string()).min(1, "Elegí al menos una zona"),
  email: emailOpcional,
  telefono: telefonoOpcional,
  activo: z.boolean(),
})
export type AsesorForm = z.infer<typeof asesorSchema>

export const propiedadSchema = z.object({
  titulo: z.string().trim().min(1, "Ingresá un título"),
  barrio: z.string().trim().min(1, "Elegí o ingresá un barrio"),
  tipo: z.string().min(1),
  operacion: z.string().min(1),
  precio: numeroPositivo,
  moneda: z.string().min(1),
  expensas: numeroOpcional,
  ambientes: numeroOpcional,
  dormitorios: numeroOpcional,
  banos: numeroOpcional,
  superficie_m2: numeroOpcional,
  piso: z.string().trim().optional().or(z.literal("")),
  direccion: z.string().trim().min(1, "Ingresá una dirección"),
  requisitos_garantia: z.string().trim().optional().or(z.literal("")),
  caracteristicas: z.string().optional().or(z.literal("")),
  descripcion: z.string().optional().or(z.literal("")),
  codigo_aviso: z.string().trim().optional().or(z.literal("")),
  url_publica: urlOpcional,
  imagenes: z.string().optional().or(z.literal("")),
  disponible: z.boolean(),
  destacado: z.boolean(),
})
export type PropiedadForm = z.infer<typeof propiedadSchema>

export const loginSchema = z.object({
  user: email,
  pass: z.string().min(1, "Ingresá tu contraseña"),
})
export type LoginForm = z.infer<typeof loginSchema>
