'use client';

import { useState } from 'react';

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
    <form className="login-form" onSubmit={onSubmit}>
      {error && <div className="login-error">{error}</div>}
      <label className="login-field">
        <span>Email</span>
        <input
          type="email"
          autoComplete="username"
          placeholder="nombre@horizonte.com"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          required
          autoFocus
        />
      </label>
      <label className="login-field">
        <span>Contraseña</span>
        <input
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          required
        />
      </label>
      <button className="btn btn-primary login-submit" type="submit" disabled={loading}>
        {loading ? 'Ingresando…' : 'Entrar'}
      </button>
    </form>
  );
}
