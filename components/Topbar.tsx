import Link from 'next/link';
import LogoutButton from './LogoutButton';

export default function Topbar() {
  return (
    <header className="topbar">
      <div className="topbar-search">
        <span className="material-symbols-outlined">search</span>
        <input type="text" placeholder="Buscar por propiedad, cliente o código…" />
      </div>

      <div className="topbar-actions">
        <Link href="/propiedades" className="btn btn-primary">
          <span className="material-symbols-outlined">add_circle</span>
          Nueva propiedad
        </Link>
        <div className="topbar-divider" />
        <div className="topbar-user">
          <div className="avatar">H</div>
          <div className="topbar-user-info">
            <span className="topbar-user-name">Panel interno</span>
            <span className="topbar-user-role">Inmobiliaria Horizonte</span>
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
