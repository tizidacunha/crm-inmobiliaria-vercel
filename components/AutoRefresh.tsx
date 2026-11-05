'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LiveBadge from '@/components/LiveBadge';

/**
 * Refresca el server component en intervalos (router.refresh re-ejecuta la
 * query porque la página es force-dynamic) para que los chats y las respuestas
 * del bot aparezcan en vivo, sin recargar la página.
 */
export default function AutoRefresh({
  intervalMs = 4000,
  label = true,
}: {
  intervalMs?: number;
  label?: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    const onFocus = () => router.refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [router, intervalMs]);

  if (!label) return null;
  return <LiveBadge />;
}
