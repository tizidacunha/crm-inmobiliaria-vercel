import { describe, it, expect } from 'vitest';
import { homeKpis, navCounts, proximasVisitas, chatsList, thread, propiedades } from './mock';

describe('mock accessors', () => {
  it('homeKpis suma alquiler + venta = propiedades activas', () => {
    const k = homeKpis();
    expect(Number(k.prop_activas)).toBe(Number(k.prop_alquiler) + Number(k.prop_venta));
    expect(Number(k.prop_activas)).toBeGreaterThan(0);
  });

  it('navCounts expone propiedades/chats/derivaciones', () => {
    const n = navCounts();
    expect(Number(n.propiedades)).toBe(propiedades.filter((p) => p.disponible).length);
    expect(Number(n.chats)).toBeGreaterThan(0);
  });

  it('proximasVisitas respeta el límite y trae campos esperados', () => {
    const v = proximasVisitas(6);
    expect(v.length).toBeLessThanOrEqual(6);
    if (v.length) expect(v[0]).toHaveProperty('propiedad_titulo');
  });

  it('thread devuelve mensajes ordenados por timestamp para un usuario', () => {
    const lista = chatsList();
    expect(lista.length).toBeGreaterThan(0);
    const uid = String(lista[0].user_id);
    const t = thread(uid);
    expect(t.length).toBeGreaterThan(0);
    const times = t.map((m) => String(m.timestamp));
    expect([...times].sort()).toEqual(times);
  });
});
