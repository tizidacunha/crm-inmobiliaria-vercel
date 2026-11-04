import { IS_DEMO, CRM_USER, CRM_PASS } from '@/lib/auth';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

function Logo() {
  return (
    <svg className="login-logo" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="44" height="44" rx="11" fill="#1A2E3D" />
      <path d="M14 27a8 8 0 0 1 16 0" fill="#F26B3A" />
      <line x1="10" y1="27" x2="34" y2="27" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="13" y1="31" x2="31" y2="31" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

function SunArt() {
  return (
    <svg className="login-art-sun" viewBox="0 0 520 300" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <line x1="40" y1="210" x2="505" y2="210" stroke="#E6EBEF" strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />
      <line x1="95" y1="236" x2="470" y2="236" stroke="#E6EBEF" strokeWidth="1.6" strokeLinecap="round" opacity="0.28" />
      <line x1="150" y1="262" x2="430" y2="262" stroke="#E6EBEF" strokeWidth="1.6" strokeLinecap="round" opacity="0.14" />
      <path d="M185 210 A175 175 0 0 1 535 210" stroke="#3A4F60" strokeWidth="1.3" opacity="0.3" />
      <path d="M225 210 A135 135 0 0 1 495 210" stroke="#3A4F60" strokeWidth="1.3" opacity="0.48" />
      <path d="M265 210 A95 95 0 0 1 455 210 Z" fill="#F26B3A" />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <div className="login-wrap">
      <aside className="login-art">
        <div className="login-brand">
          <Logo />
          <div>
            <div className="login-name">horizonte</div>
            <div className="login-kick">Inmobiliaria</div>
          </div>
        </div>
        <p className="login-tag">
          El panel de tu inmobiliaria: propiedades, visitas y el asistente de
          WhatsApp, en un solo lugar.
        </p>
        <SunArt />
      </aside>

      <main className="login-panel">
        <div className="login-box">
          <h1 className="login-title">Ingresá a tu panel</h1>
          <p className="login-desc">Usá tu cuenta del equipo para continuar.</p>
          <LoginForm />
          {IS_DEMO && (
            <div className="login-demo">
              <span className="login-demo-k">Credenciales de prueba</span>
              <span>{CRM_USER}</span>
              <span>{CRM_PASS}</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
