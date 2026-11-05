'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function LoginForm() {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, pass }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || 'No se pudo iniciar sesión.');
        setLoading(false);
        return;
      }
      // Navegación dura para que el middleware tome la cookie recién creada.
      window.location.assign('/');
    } catch {
      setError('No se pudo conectar. Intentá de nuevo.');
      setLoading(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">{error}</div>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="user" className="text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground">Email</Label>
        <Input
          id="user"
          type="email"
          autoComplete="username"
          placeholder="nombre@horizonte.com"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          required
          autoFocus
          className="h-12"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pass" className="text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground">Contraseña</Label>
        <Input
          id="pass"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          required
          className="h-12"
        />
      </div>
      <Button type="submit" disabled={loading} className="mt-1.5 h-12 w-full text-[15px]">
        {loading ? 'Ingresando…' : 'Entrar'}
      </Button>
    </form>
  );
}
