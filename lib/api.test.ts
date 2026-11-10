// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { idValido, decodificar, leerJson, USER_ID_RE } from './api';

describe('helpers de API', () => {
  it('idValido acepta solo enteros positivos', () => {
    expect(idValido('12')).toBe(12);
    for (const v of ['0', '-1', 'abc', '1.5', '1e3', '', ' 1', '9999999999']) expect(idValido(v), v).toBeNull();
  });

  it('decodificar no explota con % mal formados', () => {
    expect(decodificar('5491%40c.us')).toBe('5491@c.us');
    expect(decodificar('%E0%A4%A')).toBeNull();
  });

  it('USER_ID_RE valida ids de WhatsApp', () => {
    expect(USER_ID_RE.test('5491144556677@c.us')).toBe(true);
    expect(USER_ID_RE.test('123456789012345@lid')).toBe(true);
    for (const v of ['nadie', '5491144556677', "1' OR '1'='1@c.us", '12@c.us']) expect(USER_ID_RE.test(v), v).toBe(false);
  });

  it('leerJson rechaza JSON roto, arrays y valores sueltos', async () => {
    const req = (body: string) => new Request('http://x', { method: 'POST', body });
    for (const b of ['{roto', '[1,2]', '"texto"', '42', 'null', '']) {
      const r = await leerJson(req(b));
      expect(r.ok, b).toBe(false);
      if (!r.ok) expect(r.res.status).toBe(400);
    }
    const ok = await leerJson(req('{"a":1}'));
    expect(ok.ok && ok.body).toEqual({ a: 1 });
  });
});
