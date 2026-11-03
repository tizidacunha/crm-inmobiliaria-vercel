// ============================================================
//  WAHA MOCK (demo) — no hace llamadas de red.
//  resolvePhone formatea el número; no hay fotos de perfil.
// ============================================================
import { resolvePhoneMock } from './mock';

export async function resolvePhone(userId: string): Promise<string | null> {
  return resolvePhoneMock(userId);
}

export async function getChatPicture(_userId: string): Promise<string | null> {
  return null;
}
