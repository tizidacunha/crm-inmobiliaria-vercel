import { IS_DEMO, CRM_USER, CRM_PASS } from '@/lib/auth';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

function Logo() {
  return (
    <svg className="size-13" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="44" height="44" rx="11" fill="#1A2E3D" />
      <path d="M14 27a8 8 0 0 1 16 0" fill="#F26B3A" />
      <line x1="10" y1="27" x2="34" y2="27" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="13" y1="31" x2="31" y2="31" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

function SunArt() {
  return (
    <svg className="pointer-events-none absolute bottom-0 right-0 h-[300px] w-[520px] opacity-95 max-md:h-[210px] max-md:w-[360px]" viewBox="0 0 520 300" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
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
    <div className="grid min-h-screen md:grid-cols-[46%_54%]">
      <aside className="relative flex flex-col overflow-hidden bg-secondary px-7 py-9 text-secondary-foreground md:px-13 md:py-12 max-md:min-h-60">
        <div className="flex items-center gap-3.5">
          <Logo />
          <div>
            <div className="font-display text-[26px] font-extrabold leading-none tracking-[-0.02em] text-white">horizonte</div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-secondary-foreground/60">Inmobiliaria</div>
          </div>
        </div>
        <p className="relative z-10 mt-auto max-w-[440px] font-display text-2xl font-medium leading-[1.18] tracking-[-0.02em] text-white md:text-[30px]">
          El panel de tu inmobiliaria: propiedades, visitas y el asistente de WhatsApp, en un solo lugar.
        </p>
        <SunArt />
      </aside>

      <main className="flex items-center justify-center bg-background px-6 py-10 md:px-10">
        <div className="w-full max-w-[380px]">
          <h1 className="mb-2 font-display text-[34px] font-extrabold tracking-[-0.03em]">Ingresá a tu panel</h1>
          <p className="mb-7 text-[14.5px] text-muted-foreground">Usá tu cuenta del equipo para continuar.</p>
          <LoginForm />
          {IS_DEMO && (
            <div className="mt-6 flex flex-col gap-1 rounded-xl border border-dashed border-border bg-muted px-4 py-3.5 font-mono text-[13.5px] text-neutral-700">
              <span className="mb-1 font-sans text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Credenciales de prueba</span>
              <span>{CRM_USER}</span>
              <span>{CRM_PASS}</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
