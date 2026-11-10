import { describe, it, expect } from 'vitest';
import { validarAsesor, telefonoLocal, formatearTelefono, limpiarNombre, duplicadosAsesor } from './asesores';

const base = { nombre: 'Lucía Martínez', email: 'lucia@horizonte.com', telefono: '1123456789', sucursal: 'Norte', zonas: ['Palermo'], activo: true };

describe('validarAsesor', () => {
  it('acepta un asesor válido y normaliza', () => {
    const v = validarAsesor({ ...base, nombre: '  Lucía   Martínez ', email: 'Lucia@Horizonte.com', telefono: '11 2345-6789' });
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.data.nombre).toBe('Lucía Martínez');
      expect(v.data.email).toBe('lucia@horizonte.com');
      expect(v.data.telefono).toBe('+5491123456789');
    }
  });

  it('rechaza nombres con números, sin apellido o vacíos', () => {
    for (const nombre of ['Pepe', 'Pepe 123', '', 'J P', '@@@ ###']) {
      const v = validarAsesor({ ...base, nombre });
      expect(v.ok, nombre).toBe(false);
      if (!v.ok) expect(v.errores.nombre).toBeTruthy();
    }
  });

  it('valida el email', () => {
    for (const email of ['', 'pepe', 'pepe@', 'pepe@mail', 'pe pe@mail.com', '@mail.com']) {
      const v = validarAsesor({ ...base, email });
      expect(v.ok, email).toBe(false);
    }
  });

  it('valida el teléfono', () => {
    for (const telefono of ['', '11abc45678', '12345', '011234567890123', '0123456789']) {
      const v = validarAsesor({ ...base, telefono });
      expect(v.ok, telefono).toBe(false);
    }
    for (const telefono of ['1123456789', '+54 9 11 2345-6789', '+54 11 2345 6789', '011 2345-6789']) {
      const v = validarAsesor({ ...base, telefono });
      expect(v.ok, telefono).toBe(true);
      if (v.ok) expect(v.data.telefono).toBe('+5491123456789');
    }
  });

  it('exige sucursal del catálogo y zonas de esa sucursal', () => {
    expect(validarAsesor({ ...base, sucursal: 'Marte' }).ok).toBe(false);
    expect(validarAsesor({ ...base, zonas: [] }).ok).toBe(false);
    expect(validarAsesor({ ...base, zonas: ['Boedo'] }).ok).toBe(false); // Boedo es de Sur
    expect(validarAsesor({ ...base, zonas: ['Inventada'] }, ['Inventada']).ok).toBe(true); // zona vieja ya guardada
  });
});

describe('helpers de input', () => {
  it('telefonoLocal saca prefijos', () => {
    expect(telefonoLocal('+5491160012345')).toBe('1160012345');
    expect(telefonoLocal(null)).toBe('');
  });
  it('formatearTelefono', () => {
    expect(formatearTelefono('1123456789')).toBe('11 2345-6789');
    expect(formatearTelefono('112')).toBe('11 2');
  });
  it('limpiarNombre saca números y símbolos', () => {
    expect(limpiarNombre('Pepe123 Gómez!')).toBe('Pepe Gómez');
  });
});

describe('reglas extra de asesores', () => {
  it('activo es booleano estricto ("false" de formulario cuenta como false)', () => {
    const f = validarAsesor({ ...base, activo: 'false' });
    expect(f.ok && f.data.activo).toBe(false);
    const sinDato = validarAsesor({ ...base, activo: undefined });
    expect(sinDato.ok && sinDato.data.activo).toBe(true);
    for (const activo of ['no', 0, 1, 'si']) {
      const v = validarAsesor({ ...base, activo });
      expect(v.ok, String(activo)).toBe(false);
      if (!v.ok) expect(v.errores.activo).toBeTruthy();
    }
  });

  it('acepta nombres con tildes y ñ', () => {
    for (const nombre of ['Lucía Martínez', 'Iñaki Núñez', "María O'Connor", 'José Pérez-Gómez']) {
      expect(validarAsesor({ ...base, nombre }).ok, nombre).toBe(true);
    }
  });

  it('duplicadosAsesor detecta email (sin importar mayúsculas) y teléfono en cualquier formato', () => {
    const existentes = [{ id: 1, email: 'Lucia@Horizonte.com', telefono: '+5491123456789' }];
    expect(duplicadosAsesor({ email: 'lucia@horizonte.com', telefono: '+5491100000000' }, existentes)).toEqual({ email: 'Ya hay otro asesor con este email' });
    expect(duplicadosAsesor({ email: 'otro@horizonte.com', telefono: '+5491123456789' }, existentes)).toEqual({ telefono: 'Ya hay otro asesor con este teléfono' });
    expect(duplicadosAsesor({ email: 'lucia@horizonte.com', telefono: '+5491123456789' }, existentes, 1)).toBeNull();
    expect(duplicadosAsesor({ email: 'nuevo@horizonte.com', telefono: '+5491199999999' }, existentes)).toBeNull();
  });
});
