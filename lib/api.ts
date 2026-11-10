// Helpers comunes de las rutas /api: lectura segura del body y validación de ids.
import { NextResponse } from 'next/server';

type Body = Record<string, unknown>;

/** Lee el body como objeto JSON. Si no es JSON válido (o no es un objeto) devuelve una respuesta 400 lista. */
export async function leerJson(req: Request): Promise<{ ok: true; body: Body } | { ok: false; res: NextResponse }> {
  try {
    const body = await req.json();
    if (body && typeof body === 'object' && !Array.isArray(body)) return { ok: true, body };
  } catch {}
  return { ok: false, res: NextResponse.json({ error: 'El cuerpo de la solicitud no es un JSON válido' }, { status: 400 }) };
}

/** Id de ruta: entero positivo. Devuelve null si no lo es. */
export function idValido(v: string): number | null {
  if (!/^\d{1,9}$/.test(v)) return null;
  const n = Number(v);
  return n > 0 ? n : null;
}

export const idInvalido = () => NextResponse.json({ error: 'Id inválido' }, { status: 400 });

/** Decodifica un segmento de URL sin explotar con secuencias % mal formadas. */
export function decodificar(v: string): string | null {
  try { return decodeURIComponent(v); } catch { return null; }
}

/** user_id de WhatsApp: dígitos + @c.us / @lid / @s.whatsapp.net. */
export const USER_ID_RE = /^\d{6,20}@(c\.us|lid|s\.whatsapp\.net)$/;
