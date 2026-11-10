import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, SESSION_VALUE, checkCredentials } from '@/lib/auth';
import { leerJson } from '@/lib/api';

export async function POST(req: Request) {
  const j = await leerJson(req);
  if (!j.ok) return j.res;
  const { user, pass } = j.body;
  // Formato: ambos texto y de largo razonable (antes cualquier cosa caía en "credenciales incorrectas").
  if (typeof user !== 'string' || typeof pass !== 'string' || !user.trim() || !pass || user.length > 254 || pass.length > 200) {
    return NextResponse.json({ error: 'Ingresá un email y una contraseña válidos.' }, { status: 400 });
  }
  if (!checkCredentials(user, pass)) {
    return NextResponse.json({ error: 'Email o contraseña incorrectos.' }, { status: 401 });
  }
  // `secure` según el protocolo real: HTTPS (Vercel) sí, HTTP (staging por IP) no,
  // así la cookie no se descarta cuando no hay TLS.
  const proto = req.headers.get('x-forwarded-proto') ?? new URL(req.url).protocol.replace(':', '');
  cookies().set(SESSION_COOKIE, SESSION_VALUE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: proto === 'https',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 días
  });
  return NextResponse.json({ ok: true });
}
