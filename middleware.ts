import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE, SESSION_VALUE } from '@/lib/auth';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authed = req.cookies.get(SESSION_COOKIE)?.value === SESSION_VALUE;
  const isLogin = pathname === '/login';

  // La API responde 401 en JSON (no una redirección a la página de login, que el fetch no sabe interpretar).
  if (!authed && pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Sesión expirada. Volvé a iniciar sesión.' }, { status: 401 });
  }
  if (!authed && !isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  if (authed && isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Protege todo menos los estáticos y los endpoints de login/logout.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/login|api/logout).*)'],
};
