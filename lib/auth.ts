// ============================================================
//  Autenticación — puerta de sesión simple (cookie + middleware)
//  Credenciales y secreto por variable de entorno, con valores
//  de DEMO por defecto (para el demo público de Vercel).
//  En staging/prod definir: CRM_USER, CRM_PASS, AUTH_SECRET.
// ============================================================
export const SESSION_COOKIE = 'crm_session';

// Valor de la cookie de sesión = secreto. Si no hay AUTH_SECRET,
// se usa un valor de demo (el demo es público y no guarda datos reales).
export const SESSION_VALUE = process.env.AUTH_SECRET || 'horizonte-crm-session-v1';

// Credenciales válidas (una por defecto para la demo).
export const CRM_USER = process.env.CRM_USER || 'demo@horizonte.com';
export const CRM_PASS = process.env.CRM_PASS || 'horizonte2026';

// Mostrar las credenciales de prueba en pantalla solo cuando se usan las de demo.
export const IS_DEMO = !process.env.CRM_USER;

export function checkCredentials(user: string, pass: string): boolean {
  return (
    String(user || '').trim().toLowerCase() === CRM_USER.toLowerCase() &&
    String(pass || '') === CRM_PASS
  );
}
