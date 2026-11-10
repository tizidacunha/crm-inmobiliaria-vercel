import { describe, it, expect } from 'vitest';
import { validarPropiedad, booleano } from './propiedades';

const base = {
  titulo: 'Departamento en Venta en Almagro - Yatay al 800', tipo: 'departamento', operacion: 'venta',
  precio: 120000, moneda: 'USD', direccion: 'Yatay al 800', barrio: 'Almagro',
};
const err = (cambios: Record<string, unknown>) => {
  const v = validarPropiedad({ ...base, ...cambios });
  return v.ok ? null : v.errores;
};

describe('validarPropiedad', () => {
  it('acepta una propiedad mínima y completa defaults', () => {
    const v = validarPropiedad(base);
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.data.ciudad).toBe('Buenos Aires');
      expect(v.data.disponible).toBe(true);
      expect(v.data.destacado).toBe(false);
      expect(v.data.caracteristicas).toEqual([]);
    }
  });

  it('exige los campos obligatorios', () => {
    const e = validarPropiedad({});
    expect(e.ok).toBe(false);
    if (!e.ok) for (const k of ['titulo', 'tipo', 'operacion', 'precio', 'direccion', 'barrio']) expect(e.errores, k).toHaveProperty(k);
  });

  it('rechaza tipo, operación y moneda fuera de catálogo', () => {
    expect(err({ tipo: 'nave espacial' })?.tipo).toMatch(/inválido/);
    expect(err({ operacion: 'trueque' })?.operacion).toMatch(/inválido/);
    expect(err({ moneda: 'EUR' })?.moneda).toMatch(/inválido/);
  });

  it('precio: número > 0, sin letras', () => {
    for (const precio of [0, -5, 'abc', '12a', NaN, Infinity, 1e11]) expect(err({ precio }), String(precio)).toHaveProperty('precio');
    expect(err({ precio: '125000' })).toBeNull();
    expect(err({ precio: '1250,50' })).toBeNull();
  });

  it('ambientes/dormitorios/baños: enteros no negativos y coherentes', () => {
    expect(err({ ambientes: -3 })).toHaveProperty('ambientes');
    expect(err({ ambientes: 2.5 })).toHaveProperty('ambientes');
    expect(err({ banos: 'dos' })).toHaveProperty('banos');
    expect(err({ ambientes: 2, dormitorios: 2 })).toHaveProperty('dormitorios');
    expect(err({ ambientes: 3, dormitorios: 2, banos: 1 })).toBeNull();
  });

  it('superficie y expensas', () => {
    expect(err({ superficie_m2: 0 })).toHaveProperty('superficie_m2');
    expect(err({ expensas: -1 })).toHaveProperty('expensas');
    expect(err({ expensas: 0 })).toBeNull();
  });

  it('URLs: solo http(s) (bloquea javascript: y similares)', () => {
    expect(err({ url_publica: 'javascript:alert(1)' })).toHaveProperty('url_publica');
    expect(err({ url_publica: 'ftp://x.com' })).toHaveProperty('url_publica');
    expect(err({ imagenes: ['https://a.com/1.jpg', 'data:image/png;base64,xx'] })).toHaveProperty('imagenes');
    expect(err({ imagen_principal: 'javascript:void(0)' })).toHaveProperty('imagen_principal');
    expect(err({ url_publica: 'https://www.goldsteinpropiedades.com/p/1' })).toBeNull();
  });

  it('piso y código de aviso con formato', () => {
    expect(err({ piso: 'séptimo' })).toHaveProperty('piso');
    expect(err({ codigo_aviso: 'GAP 12;drop' })).toHaveProperty('codigo_aviso');
    const v = validarPropiedad({ ...base, piso: 'pb', codigo_aviso: 'gap123' });
    expect(v.ok && v.data.piso).toBe('PB');
    expect(v.ok && v.data.codigo_aviso).toBe('GAP123');
  });

  it('largos máximos y tipos de texto', () => {
    expect(err({ titulo: 'x'.repeat(201) })).toHaveProperty('titulo');
    expect(err({ titulo: 'abc' })).toHaveProperty('titulo');
    expect(err({ descripcion: 'x'.repeat(5001) })).toHaveProperty('descripcion');
    expect(err({ barrio: { $ne: 1 } })).toHaveProperty('barrio');
  });

  it('listas: separa, deduplica y limita', () => {
    const v = validarPropiedad({ ...base, caracteristicas: 'balcon, balcon , luminoso,,', imagenes: 'https://a.com/1.jpg https://a.com/2.jpg' });
    expect(v.ok && v.data.caracteristicas).toEqual(['balcon', 'luminoso']);
    expect(v.ok && v.data.imagen_principal).toBe('https://a.com/1.jpg');
    expect(err({ caracteristicas: Array.from({ length: 61 }, (_, i) => `c${i}`) })).toHaveProperty('caracteristicas');
    expect(err({ caracteristicas: 42 })).toHaveProperty('caracteristicas');
  });

  it('booleanos estrictos', () => {
    expect(err({ disponible: 'no' })).toHaveProperty('disponible');
    expect(err({ destacado: 1 })).toHaveProperty('destacado');
    const v = validarPropiedad({ ...base, disponible: 'false' });
    expect(v.ok && v.data.disponible).toBe(false);
  });
});

describe('booleano', () => {
  it('interpreta solo true/false', () => {
    expect(booleano(true, false)).toBe(true);
    expect(booleano('false', true)).toBe(false);
    expect(booleano(undefined, true)).toBe(true);
    expect(booleano('no', true)).toBeUndefined();
    expect(booleano(0, true)).toBeUndefined();
  });
});
