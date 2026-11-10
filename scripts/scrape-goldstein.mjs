// Scraper de las propiedades publicadas en goldsteinpropiedades.com (sitio Tokko Broker).
// Uso: node scripts/scrape-goldstein.mjs <crudo.json>  y luego  node scripts/goldstein-a-mock.mjs <crudo.json> lib/propiedades-goldstein.json
// Recorre /Venta y /Alquiler (scroll infinito: ?o=2,2&p=N), baja cada ficha /p/... y extrae los datos
// de la propiedad. NO guarda datos de contacto de vendedores (teléfonos/emails/nombres).
import fs from 'node:fs';

const BASE = 'https://www.goldsteinpropiedades.com';
const UA = 'Mozilla/5.0 (compatible; demo-crm-scraper)';
const OUT = process.argv[2];
if (!OUT) { console.error('falta ruta de salida'); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url, intentos = 3) {
  for (let i = 1; i <= intentos; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (res.ok) return await res.text();
      if (res.status === 404) return null;
    } catch {}
    await sleep(1500 * i);
  }
  return null;
}

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };
const decode = (s) => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&([a-z0-9#]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m);
const texto = (html) => decode(html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')).replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
const num = (s) => { if (s == null) return null; const n = Number(String(s).replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '')); return Number.isFinite(n) && String(s).match(/\d/) ? n : null; };

/* 1. Listado completo de URLs de fichas */
async function listar(ruta) {
  const urls = new Map();
  for (let p = 1; p < 60; p++) {
    const html = await get(p === 1 ? `${BASE}/${ruta}` : `${BASE}/${ruta}?o=2,2&p=${p}`);
    // La página 1 trae el texto "--NoMoreProperties--" dentro del script del scroll infinito;
    // solo las respuestas de las páginas siguientes lo usan como fin de listado.
    if (!html || (p > 1 && html.includes('--NoMoreProperties--'))) break;
    const nuevos = [...html.matchAll(/href="(\/p\/(\d+)-[^"]+)"/g)].filter((m) => !urls.has(m[2]));
    if (nuevos.length === 0 && p > 1) break;
    nuevos.forEach((m) => urls.set(m[2], m[1]));
    process.stdout.write(`\r${ruta}: página ${p}, ${urls.size} fichas`);
    await sleep(400);
  }
  process.stdout.write('\n');
  return urls;
}

/* 2. Parseo de una ficha */
const TIPOS = { departamento: 'departamento', ph: 'ph', casa: 'casa', local: 'local', oficina: 'oficina', terreno: 'terreno', cochera: 'cochera', galpon: 'galpon', 'galpón': 'galpon', 'edificio comercial': 'edificio', 'fondo de comercio': 'local', 'quinta': 'casa', 'depósito': 'galpon' };
const quitarContacto = (s) => s
  .split('\n')
  .filter((l) => !/@|whats\s*app|\b(tel|cel|celular|tel[eé]fono)\b|\(?\d{2,4}\)?[\s-]?\d{4}[\s-]?\d{4}/i.test(l))
  .join('\n');

function parsear(html, url, operacionListado) {
  const meta = (prop) => html.match(new RegExp(`<meta property="${prop}" content="([^"]*)"`))?.[1];
  const detalle = (k) => { const m = html.match(new RegExp(`<b>${k}</b><br/>([^<]*)<`)); return m ? decode(m[1]).trim() : null; };
  const info = (k) => { const m = html.match(new RegExp(`${k}\\s*:\\s*([^<]*)</li>`)); return m ? decode(m[1]).trim() : null; };

  // Operaciones y precios (puede tener venta y alquiler a la vez)
  const ops = [...html.matchAll(/operation-type-div[^>]*>([^<]+)<\/div>\s*<div class='[^']*'><div class='operation-val[^']*'\s*>\s*<span>([^<]*)</g)]
    .map((m) => ({ tipo: m[1].trim().toLowerCase(), precio: decode(m[2]).trim() }));
  const op = ops.find((o) => o.tipo.startsWith(operacionListado)) ?? ops[0];
  const operacion = op?.tipo.includes('temporario') ? 'alquiler temporario' : op?.tipo.startsWith('alquiler') ? 'alquiler' : 'venta';
  const precio = op ? num(op.precio) : null;
  const moneda = op && /USD|U\$S/i.test(op.precio) ? 'USD' : 'ARS';

  const tipoTxt = (detalle('Tipo de Propiedad') ?? '').toLowerCase();
  const tipo = TIPOS[tipoTxt] ?? (tipoTxt || 'departamento');

  // Superficie: total construido > cubierta > terreno
  const sup = (k) => { const m = html.match(new RegExp(`${k}:\\s*([\\d.,]+)\\s*m`, 'i')); return m ? Number(m[1].replace(',', '.')) : null; };
  const superficie = sup('Total Construido') ?? sup('Cubierta') ?? sup('Terreno') ?? num(detalle('Total construido'));

  // Características: datos de "Información básica" con valor + listas de servicios/amenities/adicionales.
  const carac = new Set();
  for (const k of ['Disposición', 'Condición', 'Situación', 'Orientación', 'Luminosidad']) { const v = info(k); if (v) carac.add(v.toLowerCase()); }
  const credito = info('Crédito'); if (credito) carac.add(credito.toLowerCase());
  for (const sec of html.matchAll(/<div class="titulo2">([^<]+)<\/div>\s*<ul class="ficha_ul"[^>]*>([\s\S]*?)<\/ul>/g)) {
    if (/INFORMACI|SUPERFICIES/i.test(sec[1])) continue;
    for (const li of sec[2].matchAll(/<li>([\s\S]*?)<\/li>/g)) { const t = texto(li[1]); if (t && t.length < 40) carac.add(t.toLowerCase()); }
  }
  // Fuera: medidas/datos con ":" ("dormitorio 1: 3 x 3") y valores vacíos.
  for (const c of [...carac]) if (c.includes(':') || /no especificado/.test(c)) carac.delete(c);

  const descHtml = html.match(/<div id="prop-desc">([\s\S]*?)<div id="company-footer">/)?.[1]
    ?? html.match(/<div id="prop-desc">([\s\S]*?)<\/div>/)?.[1] ?? '';
  let descripcion = quitarContacto(texto(descHtml)).split(/Se deja constancia/i)[0].trim();
  if (descripcion.length > 1200) descripcion = descripcion.slice(0, 1200).replace(/\s+\S*$/, '') + '…';

  // Tokko sirve las fotos desde w_pics, water_pics o pictures según la propiedad.
  const imagenes = [...new Set([...html.matchAll(/data-thumb="(https:\/\/static\.tokkobroker\.com\/[a-z_]*pic[a-z_]*\/[^"]+\.(?:jpe?g|png|webp))"/gi)].map((m) => m[1]))].slice(0, 10);
  const expensas = num(info('Expensas'));
  const piso = descripcion.match(/\b(\d{1,2})\s*(?:°|º)?\s*piso\b/i)?.[1] ?? (/planta baja/i.test(descripcion) ? 'PB' : null);

  return {
    tokko_id: Number(url.match(/\/p\/(\d+)/)[1]),
    titulo: decode(meta('og:title') ?? '').trim(),
    descripcion,
    tipo,
    operacion,
    precio,
    moneda,
    ambientes: num(info('Ambientes')),
    dormitorios: num(info('Dormitorios')),
    banos: num(info('Baños')),
    superficie_m2: superficie,
    piso,
    direccion: decode(html.match(/<div class="title-address">([^<]*)</)?.[1] ?? '').trim(),
    barrio: detalle('Ubicación'),
    ciudad: 'Buenos Aires',
    caracteristicas: [...carac],
    disponible: true,
    destacado: false,
    expensas,
    requisitos_garantia: /cauci[oó]n/i.test(descripcion) ? 'Acepta seguro de caucion' : null,
    codigo_aviso: html.match(/\(REF\.\s*([A-Z0-9]+)\)/)?.[1] ?? null,
    url_publica: BASE + url,
    imagen_principal: imagenes[0] ?? null,
    imagenes,
  };
}

/* 3. Main */
const venta = await listar('Venta');
const alquiler = await listar('Alquiler');
const tareas = [...[...venta].map(([id, u]) => [id, u, 'venta']), ...[...alquiler].filter(([id]) => !venta.has(id)).map(([id, u]) => [id, u, 'alquiler'])];
console.log(`Fichas únicas: ${tareas.length} (venta ${venta.size}, alquiler ${alquiler.size})`);

const out = []; const fallas = [];
let i = 0;
async function worker() {
  while (i < tareas.length) {
    const [id, url, op] = tareas[i++];
    const html = await get(BASE + url);
    if (!html) fallas.push(url);
    else { try { out.push(parsear(html, url, op)); } catch (e) { fallas.push(`${url} (${e.message})`); } }
    process.stdout.write(`\rfichas: ${out.length + fallas.length}/${tareas.length}`);
    await sleep(350);
  }
}
await Promise.all([worker(), worker()]);
process.stdout.write('\n');
fs.writeFileSync(OUT, JSON.stringify({ out, fallas }, null, 1));
console.log(`OK ${out.length}, fallas ${fallas.length}`);
