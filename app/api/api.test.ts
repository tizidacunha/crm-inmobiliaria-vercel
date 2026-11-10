// @vitest-environment node
// Tests de las rutas /api contra la base MOCK: validación de entrada, ids y códigos de estado.
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import * as propiedades from './propiedades/route';
import * as propiedad from './propiedades/[id]/route';
import * as asesores from './asesores/route';
import * as asesor from './asesores/[id]/route';
import * as chat from './chats/[userId]/route';
import * as login from './login/route';

const req = (method: string, body?: unknown, raw?: string) =>
  new NextRequest('http://localhost/api/x', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: raw ?? (body === undefined ? undefined : JSON.stringify(body)),
  });
const id = (v: string | number) => ({ params: { id: String(v) } });
const json = async (r: Response) => ({ status: r.status, body: await r.json() });

const propOk = {
  titulo: 'Departamento en Venta en Almagro - Yatay al 800', tipo: 'departamento', operacion: 'venta',
  precio: 120000, direccion: 'Yatay al 800', barrio: 'Almagro',
};
const asesorOk = {
  nombre: 'Lucía Martínez', email: 'lucia.nueva@horizonte.com', telefono: '11 5555-1234',
  sucursal: 'Norte', zonas: ['Palermo'], activo: true,
};

describe('/api/propiedades', () => {
  it('POST válido → 201', async () => {
    expect((await propiedades.POST(req('POST', propOk))).status).toBe(201);
  });
  it('POST con datos inválidos → 400 con errores por campo', async () => {
    const r = await json(await propiedades.POST(req('POST', { ...propOk, precio: -5, tipo: 'nave', url_publica: 'javascript:alert(1)' })));
    expect(r.status).toBe(400);
    expect(Object.keys(r.body.errores)).toEqual(expect.arrayContaining(['precio', 'tipo', 'url_publica']));
  });
  it('POST con JSON roto → 400 (no 500)', async () => {
    expect((await propiedades.POST(req('POST', undefined, '{roto'))).status).toBe(400);
  });
  it('PUT: id inválido 400, body vacío 400, inexistente 404, válido 200', async () => {
    expect((await propiedad.PUT(req('PUT', propOk), id('abc'))).status).toBe(400);
    expect((await propiedad.PUT(req('PUT', {}), id(1))).status).toBe(400);
    expect((await propiedad.PUT(req('PUT', propOk), id(99999))).status).toBe(404);
    expect((await propiedad.PUT(req('PUT', propOk), id(1))).status).toBe(200);
  });
  it('PATCH disponible: solo booleano', async () => {
    expect((await propiedad.PATCH(req('PATCH', { disponible: 'no' }), id(1))).status).toBe(400);
    expect((await propiedad.PATCH(req('PATCH', {}), id(1))).status).toBe(400);
    expect((await propiedad.PATCH(req('PATCH', { disponible: false }), id('-1'))).status).toBe(400);
    expect((await propiedad.PATCH(req('PATCH', { disponible: false }), id(99999))).status).toBe(404);
    const r = await json(await propiedad.PATCH(req('PATCH', { disponible: false }), id(1)));
    expect(r).toEqual({ status: 200, body: { ok: true, disponible: false } });
  });
});

describe('/api/asesores', () => {
  it('POST válido → 201', async () => {
    expect((await asesores.POST(req('POST', asesorOk))).status).toBe(201);
  });
  it('POST con email o teléfono de otro asesor → 409', async () => {
    const r = await json(await asesores.POST(req('POST', { ...asesorOk, email: 'MROSSI@horizonte.com.ar' })));
    expect(r.status).toBe(409);
    expect(r.body.errores.email).toBeTruthy();
    const t = await json(await asesores.POST(req('POST', { ...asesorOk, telefono: '+54 9 11 4455-6611' })));
    expect(t.status).toBe(409);
    expect(t.body.errores.telefono).toBeTruthy();
  });
  it('POST inválido / JSON roto → 400', async () => {
    expect((await asesores.POST(req('POST', { ...asesorOk, telefono: '11abc' }))).status).toBe(400);
    expect((await asesores.POST(req('POST', undefined, '{roto'))).status).toBe(400);
  });
  it('PUT: puede conservar su propio email; id inválido 400; inexistente 404', async () => {
    const propio = { nombre: 'Martina Rossi', email: 'mrossi@horizonte.com.ar', telefono: '+5491144556611', sucursal: 'Norte', zonas: ['Palermo'], activo: true };
    expect((await asesor.PUT(req('PUT', propio), id(1))).status).toBe(200);
    expect((await asesor.PUT(req('PUT', propio), id(2))).status).toBe(409);
    expect((await asesor.PUT(req('PUT', propio), id('x'))).status).toBe(400);
    expect((await asesor.PUT(req('PUT', propio), id(99999))).status).toBe(404);
  });
  it('DELETE: id inválido 400, inexistente 404, válido 200', async () => {
    expect((await asesor.DELETE(req('DELETE'), id('abc'))).status).toBe(400);
    expect((await asesor.DELETE(req('DELETE'), id(99999))).status).toBe(404);
    expect((await asesor.DELETE(req('DELETE'), id(1))).status).toBe(200);
  });
});

describe('/api/chats/[userId]', () => {
  const p = (userId: string) => ({ params: { userId } });
  it('id con formato inválido o % roto → 400; inexistente → 404; existente → 200', async () => {
    expect((await chat.GET(new Request('http://x'), p('nadie'))).status).toBe(400);
    expect((await chat.GET(new Request('http://x'), p('%E0%A4%A'))).status).toBe(400);
    expect((await chat.GET(new Request('http://x'), p('5490000000000@c.us'))).status).toBe(404);
    expect((await chat.GET(new Request('http://x'), p(encodeURIComponent('5491144556677@c.us')))).status).toBe(200);
  });
});

describe('/api/login', () => {
  it('body no JSON o campos que no son texto → 400; credenciales malas → 401', async () => {
    expect((await login.POST(req('POST', undefined, 'x'))).status).toBe(400);
    expect((await login.POST(req('POST', { user: 123, pass: ['a'] }))).status).toBe(400);
    expect((await login.POST(req('POST', { user: 'a'.repeat(300) + '@x.com', pass: 'x' }))).status).toBe(400);
    expect((await login.POST(req('POST', { user: 'demo@horizonte.com', pass: 'mala' }))).status).toBe(401);
  });
});
