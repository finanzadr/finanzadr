/**
 * Capturas de validación visual.
 *
 *   npm run build && npm run preview      (en otra terminal)
 *   node scripts/capturas.mjs [etiqueta]
 *
 * Genera capturas/<etiqueta>/<ruta>__<ancho>__<tema>.png para los 5 anchos
 * objetivo del rediseño y los dos temas. La etiqueta permite comparar fases
 * (p.ej. `node scripts/capturas.mjs f0-base`).
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE_URL || 'http://localhost:4173';
const ETIQUETA = process.argv[2] || 'actual';

const ANCHOS = [360, 390, 768, 1024, 1440];
const TEMAS = ['light', 'dark'];
const RUTAS = ['/', '/mercados', '/noticias', '/aprende', '/calculadora', '/brokers', '/opciones', '/terminos'];

const salida = path.join('capturas', ETIQUETA);
fs.mkdirSync(salida, { recursive: true });

const slug = (r) => (r === '/' ? 'inicio' : r.replace(/^\//, '').replace(/\//g, '-'));

const navegador = await chromium.launch();
let n = 0;

for (const tema of TEMAS) {
  const contexto = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
  // El tema se resuelve leyendo localStorage antes del primer render (temaInicial).
  await contexto.addInitScript((t) => {
    try { localStorage.setItem('finanzadr-tema', t); } catch { /* almacenamiento no disponible */ }
  }, tema);
  const pagina = await contexto.newPage();

  for (const ruta of RUTAS) {
    for (const ancho of ANCHOS) {
      await pagina.setViewportSize({ width: ancho, height: 900 });
      await pagina.goto(BASE + ruta, { waitUntil: 'networkidle' });
      // Las fuentes web se inyectan en un useEffect; sin esperarlas la primera
      // captura sale con la fuente de sistema.
      await pagina.evaluate(() => document.fonts.ready);
      await pagina.screenshot({
        path: path.join(salida, `${slug(ruta)}__${ancho}__${tema}.png`),
        fullPage: true,
      });
      n++;
    }
  }
  await contexto.close();
}

await navegador.close();
console.log(`${n} capturas en ${salida}/`);
