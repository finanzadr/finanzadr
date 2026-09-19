/**
 * Verificación estática del rediseño, sin navegador.
 *
 *   node scripts/verificar-estatico.mjs
 *
 * Complementa a scripts/verificar.mjs (que necesita Playwright): esto lee
 * src/App.jsx y comprueba lo que se puede comprobar leyendo el código —
 * contraste real de los tokens, motores de cálculo, integridad de los datos y
 * un puñado de heurísticas de accesibilidad.
 *
 * Devuelve código de salida 1 si algo falla, para poder encadenarlo en CI.
 */
import { readFileSync, existsSync } from "node:fs";

const RUTA = new URL("../src/App.jsx", import.meta.url);
const fuente = readFileSync(RUTA, "utf8").replace(/\r\n/g, "\n");
const lineas = fuente.split("\n");

let fallos = 0;
let avisos = 0;
const fallar = (m) => { fallos += 1; console.log("  FALLA " + m); };
const avisar = (m) => { avisos += 1; console.log("  aviso  " + m); };
const ok = (m) => console.log("  ok     " + m);

function evaluar(desde, hasta, nombre) {
  const i = fuente.indexOf(desde);
  const j = fuente.indexOf(hasta, i);
  if (i === -1 || j === -1) throw new Error("no se pudo extraer " + nombre);
  return new Function(fuente.slice(i, j) + `\nreturn ${nombre};`)();
}

// ---------------------------------------------------------------------------
console.log("\n=== 1. Contraste de los tokens (WCAG 2.2 AA) ===");
{
  const tomar = (nombre) => {
    const i = fuente.indexOf(`const ${nombre} = {`);
    const j = fuente.indexOf("};", i);
    return new Function(fuente.slice(i, j + 2) + `\nreturn ${nombre};`)();
  };
  const canal = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  const luminancia = (hex) => {
    const n = hex.replace("#", "");
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
    return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
  };
  const ratio = (a, b) => {
    const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
  };

  const FONDOS = ["bg", "card", "surfaceAlt"];
  const TEXTOS = ["text", "sub", "muted", "goldText", "green", "red"];
  for (const [nombre, tema] of [["claro", tomar("LIGHT")], ["oscuro", tomar("DARK")]]) {
    let peor = { par: null, valor: Infinity };
    for (const texto of TEXTOS) {
      for (const fondo of FONDOS) {
        const r = ratio(tema[texto], tema[fondo]);
        if (r < peor.valor) peor = { par: `${texto} sobre ${fondo}`, valor: r };
        if (r < 4.5) fallar(`tema ${nombre}: ${texto} sobre ${fondo} = ${r.toFixed(2)} (mínimo 4.5)`);
      }
    }
    const rBoton = ratio(tema.bg, tema.text);
    if (rBoton < 4.5) fallar(`tema ${nombre}: botón primario = ${rBoton.toFixed(2)}`);
    ok(`tema ${nombre}: peor par de texto, ${peor.par} = ${peor.valor.toFixed(2)}`);
  }
}

// ---------------------------------------------------------------------------
console.log("\n=== 2. Motor de la calculadora ===");
{
  const simular = evaluar("const PERIODOS_POR_ANO = {", "const FILAS_POR_PAGINA", "simularInteresCompuesto");
  const casi = (a, b, t = 0.01) => Math.abs(a - b) <= t;

  const sinInteres = simular({ capitalInicial: 1000, aporte: 100, frecuenciaAporte: "Mensual", tasaAnual: 0, capitalizacion: "Mensual", anos: 5 });
  if (!casi(sinInteres.resumen.valorFinal, 1000 + 100 * 60)) fallar("tasa 0 no devuelve exactamente lo aportado");
  else ok("tasa 0 devuelve exactamente lo aportado");

  const clasico = simular({ capitalInicial: 1000, aporte: 0, frecuenciaAporte: "Anual", tasaAnual: 10, capitalizacion: "Anual", anos: 3 });
  if (!casi(clasico.resumen.valorFinal, 1000 * 1.331)) fallar("interés compuesto simple mal calculado");
  else ok("1000 al 10% tres años = 1331");

  const mensual = simular({ capitalInicial: 1000, aporte: 0, frecuenciaAporte: "Anual", tasaAnual: 12, capitalizacion: "Mensual", anos: 1 });
  if (!casi(mensual.tasaEfectivaAnual, 12.6825, 0.001)) fallar("tasa efectiva anual mal derivada de la nominal");
  else ok("12% nominal capitalizado mensual = 12.6825% efectivo");

  let coherentes = true;
  for (const frecuenciaAporte of ["Semanal", "Mensual", "Anual"]) {
    for (const capitalizacion of ["Anual", "Trimestral", "Mensual"]) {
      const r = simular({ capitalInicial: 5000, aporte: 100, frecuenciaAporte, tasaAnual: 8, capitalizacion, anos: 4 });
      const finAnual = r.filasAnuales.at(-1).saldoFin;
      const finPeriodo = r.filasPeriodo.at(-1).saldoFin;
      const desglose = r.resumen.capitalInicial + r.resumen.aportadoTotal + r.resumen.interesTotal;
      if (!casi(finAnual, finPeriodo) || !casi(desglose, r.resumen.valorFinal)) {
        coherentes = false;
        fallar(`tabla anual y por periodo no coinciden (${frecuenciaAporte} / ${capitalizacion})`);
      }
    }
  }
  if (coherentes) ok("las 9 combinaciones de frecuencia y capitalización son coherentes");
}

// ---------------------------------------------------------------------------
console.log("\n=== 3. Diagramas del Opcionario ===");
{
  const estrategias = evaluar("const ARTICULOS_OPCIONES = [", "\nconst formatHora", "ARTICULOS_OPCIONES");
  const { puntosPayoff, resultadoEstrategia } = new Function(
    fuente.slice(fuente.indexOf("const ACCIONES_POR_CONTRATO = 100;"), fuente.indexOf("const PENDIENTE =")) +
    "\nreturn { puntosPayoff, resultadoEstrategia };"
  )();

  for (const post of estrategias) {
    if (!post.ejemploParams) { fallar(`${post.id} sin ejemploParams`); continue; }
    if (post.payoffPoints) fallar(`${post.id} conserva puntos escritos a mano`);
    const puntos = puntosPayoff(post.ejemploParams);
    if (puntos.length < 4) fallar(`${post.id}: solo ${puntos.length} puntos en el diagrama`);
    // El resultado debe ser finito en todo el rango y coincidir con el motor.
    for (const punto of puntos) {
      const recalculado = resultadoEstrategia(post.ejemploParams, punto.precio);
      if (!Number.isFinite(punto.ganancia) || Math.abs(recalculado - punto.ganancia) > 0.01) {
        fallar(`${post.id}: punto incoherente en $${punto.precio}`);
      }
    }
  }
  ok(`${estrategias.length} estrategias con diagrama calculado desde su ejemplo`);
}

// ---------------------------------------------------------------------------
console.log("\n=== 4. Integridad de las guías ===");
{
  const guias = evaluar("const ARTICULOS = [", "\nexport const ARTICULOS_OPCIONES", "ARTICULOS");
  const TEMAS = ["Primeros pasos", "Acciones y ETFs", "Cuentas y brokers", "Largo plazo y retiro", "Herramientas"];
  const NIVELES = ["Principiante", "Intermedio"];
  const slugs = new Set();
  for (const [i, post] of guias.entries()) {
    if (!post.slug || !/^[a-z0-9-]+$/.test(post.slug)) fallar(`guía ${i} sin slug válido`);
    if (slugs.has(post.slug)) fallar(`slug duplicado: ${post.slug}`);
    slugs.add(post.slug);
    if (!NIVELES.includes(post.nivel)) fallar(`guía ${i}: nivel inesperado (${post.nivel})`);
    if (!TEMAS.includes(post.tema)) fallar(`guía ${i}: tema fuera de la biblioteca (${post.tema})`);
  }
  ok(`${guias.length} guías con slug único, nivel y tema válidos`);

  // vercel.json es JSON estático (Vercel lo lee antes del build), así que los
  // redirects 301 de los enlaces antiguos ?articulo=<n> se escriben a mano.
  // Aquí se comprueba que siguen apuntando al slug que ocupa esa posición.
  const vercel = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
  if (vercel.rewrites?.length) fallar("vercel.json conserva rewrites: el 404 real depende de que no haya catch-all");
  const porIndice = new Map();
  for (const r of vercel.redirects || []) {
    const q = (r.has || []).find((h) => h.type === "query" && h.key === "articulo");
    if (q && r.source === "/aprende") porIndice.set(q.value, r.destination);
  }
  let desfasados = 0;
  guias.forEach((post, i) => {
    const destino = porIndice.get(String(i));
    if (destino !== `/aprende/${post.slug}`) { desfasados += 1; fallar(`vercel.json: ?articulo=${i} → ${destino || "(sin redirect)"}, debería ser /aprende/${post.slug}`); }
  });
  if (porIndice.size !== guias.length) fallar(`vercel.json: ${porIndice.size} redirects ?articulo= para ${guias.length} guías`);
  else if (!desfasados) ok(`vercel.json: los ${guias.length} redirects ?articulo= apuntan al slug correcto`);
}

// ---------------------------------------------------------------------------
console.log("\n=== 5. Heurísticas de accesibilidad ===");
{
  // Tamaños de texto por debajo de la escala del sistema.
  const pequenos = [];
  lineas.forEach((linea, i) => {
    for (const m of linea.matchAll(/fontSize:\s*(\d+(?:\.\d+)?)/g)) {
      if (parseFloat(m[1]) < 12) pequenos.push(`línea ${i + 1}: ${m[1]}px`);
    }
  });
  if (pequenos.length) fallar(`texto por debajo de 12px: ${pequenos.slice(0, 5).join(", ")}`);
  else ok("ningún texto por debajo de 12px");

  // Controles por debajo del objetivo táctil del proyecto.
  const bajos = [];
  lineas.forEach((linea, i) => {
    if (!/<(button|a |Link |input|select)/.test(linea)) return;
    for (const m of linea.matchAll(/minHeight:\s*(\d+)/g)) {
      if (+m[1] < 44) bajos.push(`línea ${i + 1}: ${m[1]}px`);
    }
  });
  if (bajos.length) fallar(`controles por debajo de 44px: ${bajos.join(", ")}`);
  else ok("ningún control declara menos de 44px de alto");

  // Emojis usados como icono dentro del marcado (no en textos de datos).
  const emojisEnMarcado = [];
  lineas.forEach((linea, i) => {
    if (!/\p{Extended_Pictographic}/u.test(linea)) return;
    if (/aria-hidden|icono:|\bconsejo:|titulo:|texto:|resumen:|nota:|extracto:/i.test(linea)) return;
    if (/^\s*(\/\/|\*)/.test(linea)) return;
    if (/[<>]/.test(linea)) emojisEnMarcado.push(`línea ${i + 1}`);
  });
  if (emojisEnMarcado.length) avisar(`emoji en marcado sin aria-hidden: ${emojisEnMarcado.slice(0, 6).join(", ")}`);
  else ok("sin emojis haciendo de icono en el marcado");

  // Tablas anchas siempre dentro de un contenedor con desplazamiento.
  let tablasSueltas = 0;
  lineas.forEach((linea, i) => {
    if (!/<table/.test(linea) || !/minWidth/.test(linea)) return;
    const contexto = lineas.slice(Math.max(0, i - 4), i).join(" ");
    if (!/overflowX:\s*"auto"/.test(contexto)) { tablasSueltas += 1; fallar(`línea ${i + 1}: tabla ancha sin contenedor con scroll`); }
  });
  if (!tablasSueltas) ok("todas las tablas anchas viven en un contenedor con scroll");
}

// --- SEO: salida del build (solo si hay dist/) --------------------------------
// El prerender escribe dist/404.html con noindex y dist/sitemap.xml a partir de
// RUTAS_ESTATICAS + guías + estrategias; las rutas de RUTAS_NOINDEX se sirven
// pero no entran en el sitemap. Aquí se comprueba que lo generado cumple eso.
{
  const DIST = new URL("../dist/", import.meta.url);
  const leerLista = (nombre) => {
    const m = fuente.match(new RegExp(`export const ${nombre} = \\[([^\\]]*)\\]`));
    return m ? [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]) : null;
  };
  const estaticas = leerLista("RUTAS_ESTATICAS");
  const noindex = leerLista("RUTAS_NOINDEX");
  if (!estaticas || !noindex) fallar("no se pudieron leer RUTAS_ESTATICAS / RUTAS_NOINDEX de App.jsx");
  else if (!existsSync(new URL("index.html", DIST))) avisar("dist/ no existe: ejecuta npm run build para comprobar 404.html y sitemap.xml");
  else {
    console.log("\nSEO (dist/):");
    const pag404 = new URL("404.html", DIST);
    if (!existsSync(pag404)) fallar("falta dist/404.html");
    else if (!/<meta name="robots" content="noindex/.test(readFileSync(pag404, "utf8"))) fallar("dist/404.html no lleva noindex");
    else ok("dist/404.html existe y lleva noindex");

    const rutaMapa = new URL("sitemap.xml", DIST);
    if (!existsSync(rutaMapa)) fallar("falta dist/sitemap.xml");
    else {
      const mapa = readFileSync(rutaMapa, "utf8");
      const locs = [...mapa.matchAll(/<loc>https:\/\/finanzadr\.com([^<]*)<\/loc>/g)].map((m) => m[1]);
      const faltan = estaticas.filter((r) => !locs.includes(r));
      const sobran = noindex.filter((r) => locs.includes(r));
      if (faltan.length) fallar(`sitemap sin: ${faltan.join(", ")}`);
      if (sobran.length) fallar(`sitemap con rutas noindex: ${sobran.join(", ")}`);
      if (!faltan.length && !sobran.length) ok(`sitemap.xml: ${locs.length} URLs, todas las estáticas y ninguna noindex`);
    }

    let robotsMal = 0;
    for (const r of [...estaticas.filter((x) => x !== "/"), ...noindex]) {
      const archivo = new URL(`.${r}/index.html`, DIST);
      if (!existsSync(archivo)) { robotsMal += 1; fallar(`falta dist${r}/index.html`); continue; }
      const conNoindex = /<meta name="robots" content="noindex/.test(readFileSync(archivo, "utf8"));
      if (conNoindex !== noindex.includes(r)) { robotsMal += 1; fallar(`dist${r}/index.html ${conNoindex ? "lleva" : "no lleva"} noindex y no debería`); }
    }
    if (!robotsMal) ok("todas las rutas estáticas y noindex tienen su index.html con el robots correcto");
  }
}

console.log(`\n${fallos === 0 ? "Sin fallos" : fallos + " fallos"}${avisos ? `, ${avisos} avisos` : ""}.`);
process.exit(fallos === 0 ? 0 : 1);
