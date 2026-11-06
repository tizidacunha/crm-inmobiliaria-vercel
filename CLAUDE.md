# CRM Inmobiliaria Horizonte — demo público (Vercel)

**Vitrina pública** del CRM, 100% **mockeada** (sin base de datos ni WhatsApp), para publicar en
**Vercel** y mostrar. Mismo código de UI que el CRM real; lo único que cambia es la capa de datos.

- **Repo:** `tizidacunha/crm-inmobiliaria-vercel` (cuenta personal). **URL:** `crm-inmobiliaria-vercel.vercel.app`.
- **Espejo del real** `inmobiliaria-casaya/crm-frontend` → cuando se rediseña la UI, se migra acá
  primero (sandbox), se verifica, y se espeja al real. (Sistema completo: `../inmobiliaria-casaya/CLAUDE.md`.)

## Diferencia clave con el real
- `lib/db.ts` → **pool MOCK**: rutea cada query conocida a datos de prueba en `lib/mock.ts`
  (propiedades, asesores, visitas, conversaciones). No hay red ni Postgres.
- `lib/waha.ts` → **mock**: `resolvePhone` formatea el número; sin fotos de perfil.
- `lib/mock.ts` → dataset + accesores (`homeKpis`, `navCounts`, `proximasVisitas`, `chatsList`, `thread`, …).
- Sin `pg`. Las `app/api/**` devuelven `{ ok: true }` (no persisten).
- **Login demo:** se muestran las credenciales en pantalla (`IS_DEMO`): `demo@horizonte.com` / `horizonte2026`.

## Stack y convenciones
Igual que el real: **Next.js 14 App Router + TS + shadcn/ui + Tailwind v4**, tema "Horizonte",
componentes shadcn por CLI (`components/ui/`), `className` solo para layout, Material Symbols a nivel app,
FullCalendar para visitas. **Ver `inmobiliaria-casaya/crm-frontend/CLAUDE.md` para el detalle de
convenciones** (son las mismas).

## Comandos
```bash
npm run dev | build | start
npm run lint        # next lint --max-warnings 0
npm run typecheck   # tsc --noEmit
npm run test        # vitest run  (tests de lib/auth y lib/mock)
```

## Deploy
- **Vercel auto-deploya la rama `main`** en cada push. No hay Docker ni env obligatorias (todo mockeado).
- Para que un rediseño salga en Vercel: mergear la rama de trabajo a `main` y pushear.

## Estado del proyecto (actualizar acá)
- **Migración a shadcn/ui + Tailwind: hecha y mergeada a `main`** (`682d073`) → live en Vercel.
- Config shadcn: `components.json` (base-maia, base-ui, icon `hugeicons`), `postcss.config.mjs`,
  `lib/utils.ts` (`cn`). `.agents/`, `.claude/`, `skills-lock.json` están gitignoreados (tooling de agentes).
- Al cambiar la UI acá, **espejar al real** (`crm-frontend`) y deployar staging.
