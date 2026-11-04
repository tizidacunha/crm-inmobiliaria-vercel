import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, SESSION_VALUE, checkCredentials } from '@/lib/auth';

export async function POST(req: Request) {
  const { user, pass } = await req.json().catch(() => ({ user: '', pass: '' }));
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
