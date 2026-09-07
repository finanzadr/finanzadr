// Noticias de República Dominicana — RSS de El Dinero y Diario Libre
// Sin dependencias externas: parsing RSS con regex nativo.

const CACHE_TTL_MS = 15 * 60_000;
let cache = { data: null, at: 0 };
let enCurso = null;

const FUENTES_RD = [
  { nombre: "El Dinero", url: "https://eldinero.com.do/feed/" },
  { nombre: "Diario Libre", url: "https://www.diariolibre.com/rss/portada.rss" },
];

function extraerCDATA(tag, bloque) {
  // Maneja <tag><![CDATA[...]]></tag> y <tag>...</tag>
  const re = new RegExp(
    `<${tag}[^>]*>\\s*(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<]*))\\s*</${tag}>`,
    "i"
  );
  const m = bloque.match(re);
  if (!m) return "";
  return (m[1] !== undefined ? m[1] : m[2] || "").trim();
}

function limpiarHTML(texto) {
  return texto
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#8230;/g, "…")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function parseRSS(xml, fuente, limite = 5) {
  const items = [];
  const reItem = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = reItem.exec(xml)) !== null && items.length < limite) {
    const bloque = match[1];
    const titulo = limpiarHTML(extraerCDATA("title", bloque));
    const desc = limpiarHTML(extraerCDATA("description", bloque)).slice(0, 280);
    const fecha = extraerCDATA("pubDate", bloque);

    // <link> en RSS 2.0 viene como texto entre tags (no CDATA)
    const linkMatch = bloque.match(/<link[^>]*>([^<]+)<\/link>/i);
    const url = linkMatch ? linkMatch[1].trim() : "";

    if (titulo) {
      items.push({ titulo, resumen: desc || "Ver artículo completo.", url, fuente, fecha });
    }
  }
  return items;
}

async function fetchNoticiasRD() {
  const resultados = await Promise.allSettled(
    FUENTES_RD.map(async ({ nombre, url }) => {
      const res = await fetch(url, {
        headers: { "User-Agent": "FinanzaDR/1.0 RSS Reader" },
        signal: AbortSignal.timeout(9000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} de ${nombre}`);
      const xml = await res.text();
      return parseRSS(xml, nombre, 5);
    })
  );

  const items = resultados
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value);

  return { generadoEn: new Date().toISOString(), items };
}

async function obtenerNoticiasRD() {
  if (cache.data && Date.now() - cache.at < CACHE_TTL_MS) return cache.data;
  if (enCurso) return enCurso;

  enCurso = fetchNoticiasRD()
    .then((data) => {
      cache = { data, at: Date.now() };
      return data;
    })
    .finally(() => { enCurso = null; });

  return enCurso;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const data = await obtenerNoticiasRD();
    res.status(200).json(data);
  } catch (err) {
    console.error("Error en /api/noticias-rd:", err);
    res.status(200).json({ items: [] });
  }
}
