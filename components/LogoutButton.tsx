'use client';

export default function LogoutButton() {
  async function salir() {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } finally {
      window.location.assign('/login');
    }
  }
  return (
    <button className="topbar-logout" onClick={salir} title="Cerrar sesión" aria-label="Cerrar sesión">
      <span className="material-symbols-outlined">logout</span>
    </button>
  );
}
