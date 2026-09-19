/**
 * Prerender estático. Se ejecuta al final de `npm run build`, después de
 * `vite build` (cliente → dist/) y `vite build --ssr` (servidor → dist-ssr/).
 *
 * Por cada ruta indexable renderiza la página con react-dom/server y escribe
 * dist/<ruta>/index.html con el HTML real y un <head> propio (título,
 * descripción, canonical, og/twitter y JSON-LD). Así Googlebot recibe el
 * contenido sin ejecutar JavaScript; en el navegador, main.jsx hidrata ese HTML.
 *
 * Se escriben todas las rutas, también las que llevan noindex (legales,
 * herramientas internas): sin un rewrite catch-all en vercel.json, lo que no
 * tenga archivo en dist/ cae en dist/404.html, que Vercel sirve con estado
 * 404. Ese 404.html es la NotFoundPage prerenderizada.
 *
 * Al final genera dist/sitemap.xml con las rutas indexables, para que el
 * sitemap y el prerender salgan siempre de la misma lista.
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const RAIZ = fileURLToPath(new URL("..", import.meta.url));
const DIST = path.join(RAIZ, "dist");
const DIST_SSR = path.join(RAIZ, "dist-ssr");

const plantilla = fs.readFileSync(path.join(DIST, "index.html"), "utf8");
const INICIO = "    <!-- seo:inicio -->";
const FIN = "    <!-- seo:fin -->";
if (!plantilla.includes(INICIO) || !plantilla.includes(FIN) || !plantilla.includes('<div id="root"></div>')) {
  console.error("prerender: dist/index.html no tiene los marcadores seo:inicio/seo:fin o #root");
  process.exit(1);
}

const { render, RUTAS_ESTATICAS, RUTAS_NOINDEX, ARTICULOS, ARTICULOS_OPCIONES, SITIO, fechaISOdeTexto } = await import(pathToFileURL(path.join(DIST_SSR, "entry-server.js")).href);

const indexables = [
  ...RUTAS_ESTATICAS,
  ...ARTICULOS.map((g) => `/aprende/${g.slug}`),
  ...ARTICULOS_OPCIONES.map((e) => `/opciones/${e.id}`),
];
// "/__404" no coincide con ninguna ruta: renderiza NotFoundPage y se guarda
// como dist/404.html.
const RUTA_404 = "/__404";
const rutas = [...indexables, ...RUTAS_NOINDEX, RUTA_404];

const escapar = (t) => String(t).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function cabecera(meta, jsonLd) {
  const { title, description, url, tipo, noindex } = meta;
  const lineas = [
    `<title>${escapar(title)}</title>`,
    description && `<meta name="description" content="${escapar(description)}" />`,
    noindex && `<meta name="robots" content="noindex, follow" />`,
    `<link rel="canonical" href="${escapar(url)}" />`,
    `<meta property="og:type" content="${escapar(tipo)}" />`,
    `<meta property="og:url" content="${escapar(url)}" />`,
    `<meta property="og:title" content="${escapar(title)}" />`,
    description && `<meta property="og:description" content="${escapar(description)}" />`,
    `<meta property="og:image" content="${SITIO}/og-image.png" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:locale" content="es_DO" />`,
    `<meta property="og:site_name" content="FinanzaDR" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:url" content="${escapar(url)}" />`,
    `<meta name="twitter:title" content="${escapar(title)}" />`,
    description && `<meta name="twitter:description" content="${escapar(description)}" />`,
    `<meta name="twitter:image" content="${SITIO}/og-image.png" />`,
    // `</` dentro del JSON rompería el <script>; se escapa como manda el estándar.
    ...jsonLd.map((d) => `<script type="application/ld+json" data-ssr>${JSON.stringify(d).replace(/<\//g, "<\\/")}</script>`),
  ].filter(Boolean);
  return lineas.map((l) => `    ${l}`).join("\n");
}

// Recharts avisa en cada ResponsiveContainer porque en Node no hay medidas;
// el gráfico se dibuja al hidratar. Se filtra solo ese aviso.
const avisar = console.warn;
console.warn = (...args) => { if (!String(args[0]).includes("of chart should be greater than 0")) avisar(...args); };

let escritas = 0;
for (const ruta of rutas) {
  const { html, meta, jsonLd } = render(ruta);
  if (!meta || !meta.title) {
    console.error(`prerender: ${ruta} no declaró título (useDocumentMeta)`);
    process.exit(1);
  }
  if (!html || html.length < 500) {
    console.error(`prerender: ${ruta} produjo HTML vacío o demasiado corto (${html.length} bytes)`);
    process.exit(1);
  }
  const debeNoindex = RUTAS_NOINDEX.includes(ruta) || ruta === RUTA_404;
  if (Boolean(meta.noindex) !== debeNoindex) {
    console.error(`prerender: ${ruta} ${debeNoindex ? "debería" : "no debería"} llevar noindex (useDocumentMeta)`);
    process.exit(1);
  }
  const a = plantilla.indexOf(INICIO);
  const b = plantilla.indexOf(FIN) + FIN.length;
  const pagina = plantilla.slice(0, a) + INICIO + "\n" + cabecera(meta, jsonLd) + "\n" + FIN + plantilla.slice(b)
    .replace('<div id="root"></div>', `<div id="root">${html}</div>`);

  const destino = ruta === "/" ? path.join(DIST, "index.html")
    : ruta === RUTA_404 ? path.join(DIST, "404.html")
    : path.join(DIST, ruta.slice(1), "index.html");
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, pagina);
  escritas += 1;
  console.log(`  ${ruta} → ${path.relative(RAIZ, destino)} (${(pagina.length / 1024).toFixed(0)} KB) — ${meta.title}`);
}

// Sitemap. Solo <loc> y, en las guías con fecha legible, <lastmod>:
// changefreq y priority Google los ignora, y un lastmod inventado (la fecha
// del build) es peor que ninguno.
const lastmod = (ruta) => {
  const guia = ARTICULOS.find((g) => `/aprende/${g.slug}` === ruta);
  return guia ? fechaISOdeTexto(guia.revisadoEn || guia.fecha) : null;
};
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...indexables.map((r) => `  <url><loc>${SITIO}${r}</loc>${lastmod(r) ? `<lastmod>${lastmod(r)}</lastmod>` : ""}</url>`),
  "</urlset>",
  "",
].join("\n");
fs.writeFileSync(path.join(DIST, "sitemap.xml"), sitemap);
console.log(`  sitemap.xml → ${indexables.length} URLs`);

fs.rmSync(DIST_SSR, { recursive: true, force: true });
console.log(`prerender: ${escritas} páginas escritas en dist/`);
