/**
 * Verificación automática del rediseño.
 *
 *   npm run build && npm run preview      (en otra terminal)
 *   node scripts/verificar.mjs
 *
 * Comprueba lo que una captura no demuestra: desbordamiento horizontal,
 * unicidad del pie, elementos fijos que puedan tapar contenido, jerarquía de
 * encabezados, áreas táctiles y orden de tabulación.
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:4173';
const ANCHOS = [360, 390, 768, 1024, 1440];
const RUTAS = ['/', '/mercados', '/noticias', '/aprende', '/calculadora', '/brokers', '/opciones', '/terminos'];

const navegador = await chromium.launch();
const pagina = await (await navegador.newContext()).newPage();
let fallos = 0;

console.log('--- Desbordamiento horizontal ---');
for (const ancho of ANCHOS) {
  await pagina.setViewportSize({ width: ancho, height: 900 });
  for (const ruta of RUTAS) {
    await pagina.goto(BASE + ruta, { waitUntil: 'networkidle' });
    const exceso = await pagina.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (exceso > 0) { console.log(`  FALLA ${ancho}px ${ruta}: +${exceso}px`); fallos++; }
  }
}
if (!fallos) console.log('  ninguna página desborda');

console.log('\n--- Estructura del shell (1440px) ---');
await pagina.setViewportSize({ width: 1440, height: 900 });
await pagina.goto(BASE + '/', { waitUntil: 'networkidle' });
const alto = await pagina.evaluate(() => Math.round(document.querySelector('header > div').getBoundingClientRect().height));
const fijos = await pagina.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => getComputedStyle(e).position === 'fixed').length);
console.log(`  alto de cabecera: ${alto}px  ${alto === 72 ? 'OK' : 'revisar'}`);
console.log(`  elementos <footer>: ${await pagina.locator('footer').count()}`);
console.log(`  elementos position:fixed: ${fijos}  ${fijos === 0 ? 'OK' : 'pueden tapar contenido'}`);
console.log(`  ancho de <main>: ${await pagina.evaluate(() => Math.round(document.querySelector('main').getBoundingClientRect().width))}px`);

console.log('\n--- Un <h1> por página ---');
for (const ruta of RUTAS) {
  await pagina.goto(BASE + ruta, { waitUntil: 'networkidle' });
  const n = await pagina.locator('h1').count();
  console.log(`  ${ruta.padEnd(14)} h1: ${n}${n === 1 ? '' : '  <-- revisar'}`);
}

console.log('\n--- Áreas táctiles del shell por debajo de 44px (390px) ---');
await pagina.setViewportSize({ width: 390, height: 900 });
await pagina.goto(BASE + '/', { waitUntil: 'networkidle' });
const chicos = await pagina.evaluate(() =>
  [...document.querySelectorAll('header a, header button, nav a, nav button, footer a')]
    .map((e) => ({ t: (e.textContent || e.getAttribute('aria-label') || 'icono').trim().slice(0, 28), h: Math.round(e.getBoundingClientRect().height) }))
    .filter((x) => x.h > 0 && x.h < 44)
);
console.log(chicos.length ? chicos.map((c) => `  ${c.h}px  ${c.t}`).join('\n') : '  ninguno');

console.log('\n--- Primeras paradas de tabulación ---');
for (let i = 0; i < 6; i++) {
  await pagina.keyboard.press('Tab');
  console.log('  ' + (await pagina.evaluate(() => {
    const a = document.activeElement;
    return a.tagName + ' · ' + (a.textContent || a.getAttribute('aria-label') || '').trim().slice(0, 36);
  })));
}

await navegador.close();
process.exit(fallos ? 1 : 0);
