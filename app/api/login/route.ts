import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, SESSION_VALUE, checkCredentials } from '@/lib/auth';

export async function POST(req: Request) {
  const { user, pass } = await req.json().catch(() => ({ user: '', pass: '' }));
  if (!checkCredentials(user, pass)) {
    return NextResponse.json({ error: 'Email o contraseña incorrectos.' }, { status: 401 });
  }
  cookies().set(SESSION_COOKIE, SESSION_VALUE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 días
  });
  return NextResponse.json({ ok: true });
}
