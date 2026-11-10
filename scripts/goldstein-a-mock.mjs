// Convierte la salida cruda de scrape-goldstein.mjs al formato de lib/propiedades-goldstein.json.
// Uso: node scripts/goldstein-a-mock.mjs <crudo.json> lib/propiedades-goldstein.json
import fs from 'node:fs';

const [, , entrada, salida] = process.argv;
const { out } = JSON.parse(fs.readFileSync(entrada, 'utf8'));

// Orden estable: venta primero, luego alquiler; dentro, por id de Tokko (más nuevo primero).
const orden = (p) => (p.operacion === 'venta' ? 0 : 1);
const lista = [...out].sort((a, b) => orden(a) - orden(b) || b.tokko_id - a.tokko_id);

// Destacadas: las 8 más nuevas de venta y las 4 más nuevas de alquiler que tengan fotos.
const destacadas = new Set([
  ...lista.filter((p) => p.operacion === 'venta' && p.imagenes.length).slice(0, 8),
  ...lista.filter((p) => p.operacion !== 'venta' && p.imagenes.length).slice(0, 4),
].map((p) => p.tokko_id));

const propiedades = lista.map((p, i) => {
  const { tokko_id, ...resto } = p;
  return { id: i + 1, ...resto, destacado: destacadas.has(tokko_id) };
});

fs.writeFileSync(salida, JSON.stringify(propiedades));
console.log(`${propiedades.length} propiedades → ${salida} (${(fs.statSync(salida).size / 1024).toFixed(0)} KB)`);
