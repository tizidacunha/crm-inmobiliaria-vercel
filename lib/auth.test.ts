import { describe, it, expect } from 'vitest';
import { checkCredentials, CRM_USER, CRM_PASS } from './auth';

describe('auth.checkCredentials', () => {
  it('acepta las credenciales de demo por defecto', () => {
    expect(checkCredentials(CRM_USER, CRM_PASS)).toBe(true);
  });

  it('es case-insensitive en el usuario pero no en la contraseña', () => {
    expect(checkCredentials(CRM_USER.toUpperCase(), CRM_PASS)).toBe(true);
    expect(checkCredentials(CRM_USER, CRM_PASS.toUpperCase())).toBe(false);
  });

  it('rechaza credenciales incorrectas o vacías', () => {
    expect(checkCredentials('otro@mail.com', CRM_PASS)).toBe(false);
    expect(checkCredentials(CRM_USER, 'mal')).toBe(false);
    expect(checkCredentials('', '')).toBe(false);
  });
});
