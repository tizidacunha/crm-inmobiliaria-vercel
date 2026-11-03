# CRM Inmobiliaria Horizonte — Demo (Vercel)

Demo **pública y autónoma** del CRM de CasaYa, con diseño *editorial boutique*.

> ⚠️ **Es una demo con datos de prueba.** No se conecta a ninguna base de datos ni
> a WhatsApp: toda la información (propiedades, visitas, chats, asesores) está
> mockeada en `lib/mock.ts`. Las acciones de crear/editar no persisten.

## Qué muestra
- **Resumen** — dashboard con KPIs, cartera, próximas visitas y últimas conversaciones.
- **Propiedades** — listado en tarjetas con galería, filtros por barrio y orden por precio.
- **Calendario de visitas** — agenda con panel de detalle.
- **Chats del bot** — bandeja y conversaciones, en vivo.
- **Equipo de asesores**.

## Stack
Next.js 14 (App Router) · CSS plano · Fraunces + Hanken Grotesk.

## Correr local
```bash
npm install
npm run dev
```

## Deploy
Pensado para **Vercel**: importás este repo y deploya sin variables de entorno.
