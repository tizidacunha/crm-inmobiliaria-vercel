import { z } from "zod"

// Validaciones de formularios del lado del cliente (react-hook-form + zod).
// Asesores → lib/asesores.ts (validarAsesor). Propiedades → lib/propiedades.ts (validarPropiedad).
// Ambas se usan también en las rutas /api, así que cliente y servidor aplican las mismas reglas.

export const loginSchema = z.object({
  user: z
    .string()
    .trim()
    .min(1, "Ingresá tu email")
    .max(254, "Email demasiado largo")
    .email("Email inválido (ej. nombre@horizonte.com)"),
  pass: z.string().min(1, "Ingresá tu contraseña").max(200, "Contraseña demasiado larga"),
})
export type LoginForm = z.infer<typeof loginSchema>
