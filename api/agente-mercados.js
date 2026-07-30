import Anthropic from "@anthropic-ai/sdk";
import { put } from "@vercel/blob";
import { autorizadoParaCron } from "./_auth.js";
import {
  especificacionEditorial,
  ESTRUCTURA_CIERRE,
  getContextoTemporal,
  buildContextoTiempoTexto,
} from "./_editorial-spec.js";

const FINNHUB_KEY = process.env.FINNHUB_KEY;

// Pathname fijo (sin sufijo aleatorio) para poder ubicar el mismo blob en
// cada lectura desde /api/briefing sin tener que guardar la URL en otro lado.
export const BLOB_PATHNAME = "briefing/latest.json";

const WS_STOCKS = [
  { s: "SPY", n: "S&P 500", tipo: "Índices" },
  { s: "QQQ", n: "NASDAQ", tipo: "Índices" },
  { s: "DIA", n: "Dow Jones", tipo: "Índices" },
  { s: "IWM", n: "Russell 2000", tipo: "Índices" },
  { s: "GLD", n: "Oro", tipo: "Materias Primas" },
  { s: "TLT", n: "Bonos T. 20Y", tipo: "Bonos" },
  { s: "XLU", n: "Utilities", tipo: "Sectores" },
  { s: "BTC-USD", n: "Bitcoin", tipo: "Cripto" },
];

const BLOCKED_HEADLINE_WORDS = ["war", "strike", "missile", "election", "died", "dies"];
const isSafeHeadline = (headline) => {
  const text = (headline || "").toLowerCase();
  return !BLOCKED_HEADLINE_WORDS.some((w) => text.includes(w));
};

export async function fetchPrecios() {
  return Promise.all(
    WS_STOCKS.map(async (st) => {
      const symbol = st.s === "BTC-USD" ? "BINANCE:BTCUSDT" : st.s;
      try {
        const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`);
        const data = await res.json();
        if (data.c && data.c > 0) {
          const cambioPct = data.dp ?? ((data.c - data.pc) / data.pc) * 100;
          return { simbolo: st.s, nombre: st.n, tipo: st.tipo, precio: data.c, cambioPct: +cambioPct.toFixed(2) };
        }
        return { simbolo: st.s, nombre: st.n, tipo: st.tipo, precio: null, cambioPct: null };
      } catch {
        return { simbolo: st.s, nombre: st.n, tipo: st.tipo, precio: null, cambioPct: null };
      }
    })
  );
}

// Artículos ya filtrados por isSafeHeadline pero sin transformar campos —
// preserva el shape crudo de Finnhub (headline, summary, source, datetime,
// category, url) para que cada consumidor recorte lo que necesite.
export async function fetchNoticiasCrudas(limite = 10) {
  try {
    const res = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_KEY}`);
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.filter((n) => isSafeHeadline(n.headline)).slice(0, limite);
  } catch {
    return [];
  }
}

// Shape reducido {titulo, resumen, fuente} para el prompt de Agente 1 (menos
// tokens, sin campos que no usa la redacción del briefing).
export async function fetchNoticias() {
  const crudas = await fetchNoticiasCrudas(10);
  return crudas.map((n) => ({ titulo: n.headline, resumen: n.summary, fuente: n.source }));
}

async function fetchFearGreed() {
  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=1");
    const data = await res.json();
    const item = data?.data?.[0];
    if (!item) return null;
    return { valor: +item.value, clasificacion: item.value_classification };
  } catch {
    return null;
  }
}

function calcularVolatilidad(precios) {
  const indices = precios.filter((p) => p.tipo === "Índices" && p.cambioPct != null);
  if (!indices.length) return { nivel: "Medio", promedioAbs: null };
  const promedioAbs = indices.reduce((sum, p) => sum + Math.abs(p.cambioPct), 0) / indices.length;
  let nivel;
  if (promedioAbs < 0.5) nivel = "Bajo";
  else if (promedioAbs < 1.5) nivel = "Medio";
  else nivel = "Alto";
  return { nivel, promedioAbs: +promedioAbs.toFixed(2) };
}

function agruparPreciosPorTipo(precios) {
  const grupos = {};
  precios.forEach((p) => {
    if (!grupos[p.tipo]) grupos[p.tipo] = [];
    grupos[p.tipo].push(p);
  });
  return Object.entries(grupos)
    .map(([tipo, items]) => {
      const lineas = items
        .map((p) =>
          p.precio != null
            ? `  - ${p.nombre} (${p.simbolo}): $${p.precio.toFixed(2)} (${p.cambioPct >= 0 ? "+" : ""}${p.cambioPct}%)`
            : `  - ${p.nombre} (${p.simbolo}): dato no disponible`
        )
        .join("\n");
      return `${tipo}:\n${lineas}`;
    })
    .join("\n\n");
}

function buildPrompt(precios, noticias, fearGreed) {
  const preciosTexto = agruparPreciosPorTipo(precios);

  const noticiasTexto = noticias.length
    ? noticias.map((n) => `- ${n.titulo}${n.resumen ? `: ${n.resumen}` : ""}`).join("\n")
    : "No hay noticias disponibles en este momento.";

  const ctx = getContextoTemporal();
  const contextoTiempoTexto = buildContextoTiempoTexto(ctx);
  const { nivel: nivelVolatilidad, promedioAbs: volatilidadPromedio } = calcularVolatilidad(precios);

  const fearGreedTexto = fearGreed
    ? `${fearGreed.valor}/100 (${fearGreed.clasificacion})`
    : "dato no disponible";

  const etiquetaPrecios =
    ctx.estadoMercado === "abierto"
      ? `PRECIOS EN VIVO (INTRADÍA) DE HOY, ${ctx.fechaActualTexto.toUpperCase()}`
      : ctx.estadoMercado === "cerrado-hoy"
      ? `PRECIOS DEL CIERRE DE HOY, ${ctx.fechaActualTexto.toUpperCase()}`
      : `PRECIOS DEL CIERRE DE ${ctx.fechaReferenciaTexto.toUpperCase()}`;

  return `${especificacionEditorial(ESTRUCTURA_CIERRE)}

TAREA DE HOY: Resumen de Cierre

CONTEXTO DE TIEMPO IMPORTANTE:
${contextoTiempoTexto}

${etiquetaPrecios} (agrupados por tipo de activo):
${preciosTexto}

NOTICIAS RECIENTES:
${noticiasTexto}

SENTIMIENTO CRIPTO (Fear & Greed Index de Alternative.me): ${fearGreedTexto}

NIVEL DE VOLATILIDAD YA CALCULADO (basado en el cambio promedio de los índices SPY/QQQ/DIA/IWM): ${nivelVolatilidad}${
    volatilidadPromedio != null ? ` (variación promedio de ${volatilidadPromedio}%)` : ""
  }. Usa este nivel tal cual, no lo recalcules ni lo contradigas.

Con base ÚNICAMENTE en los datos de arriba, redacta el "Resumen de Cierre" de hoy siguiendo EXACTAMENTE la estructura "ESTRUCTURA — RESUMEN DE CIERRE" de la especificación editorial de arriba (a, b, c, d) y todas las reglas de escritura no negociables.

Instrucciones finales:
- Escribe en español.
- No inventes datos que no estén en la información proporcionada arriba.
- Respeta el contexto de tiempo indicado arriba en todo el texto, no solo al principio.
- Usa el nivel de volatilidad ya calculado (${nivelVolatilidad}) tal cual — no lo recalcules ni lo contradigas.
- Escribe el resultado como un solo bloque de texto continuo y natural, siguiendo la longitud indicada en la especificación (3-4 párrafos, 2-4 oraciones cada uno).
- Empieza tu respuesta directamente con el título del resumen (formato **Día, fecha — Resumen de Cierre FinanzaDR**). No incluyas ninguna introducción, preámbulo, ni comentario sobre tu propio proceso antes del título — la primera línea de tu respuesta debe ser el título mismo.
- Responde ÚNICAMENTE con el resumen final ya redactado. No agregues encabezados de sección adicionales ni texto fuera del resumen.`;
}

export async function generarBriefing() {
  const [precios, noticias, fearGreed] = await Promise.all([
    fetchPrecios(),
    fetchNoticias(),
    fetchFearGreed(),
  ]);

  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1536,
    thinking: { type: "disabled" },
    output_config: { effort: "low" },
    messages: [{ role: "user", content: buildPrompt(precios, noticias, fearGreed) }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  const resumen = textBlock ? textBlock.text : "";

  return {
    generadoEn: new Date().toISOString(),
    resumen,
    precios,
    noticiasUsadas: noticias.length,
  };
}

// Este endpoint lo dispara el cron diario (vercel.json) a las 7am ET. Genera
// el briefing y lo guarda en Blob para que /api/briefing lo sirva sin
// regenerar en cada visita. Sigue siendo invocable manualmente para forzar
// una regeneración (por ejemplo, para probar cambios en el prompt).
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (!autorizadoParaCron(req)) {
    res.status(401).json({ error: "No autorizado." });
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: "Falta configurar ANTHROPIC_API_KEY en las variables de entorno." });
    return;
  }

  try {
    const body = await generarBriefing();

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        await put(BLOB_PATHNAME, JSON.stringify(body), {
          access: "private",
          contentType: "application/json",
          addRandomSuffix: false,
          allowOverwrite: true,
        });
      } catch (err) {
        console.error("No se pudo guardar el briefing en Blob:", err);
      }
    }

    res.status(200).json(body);
  } catch (err) {
    console.error("Error en agente-mercados:", err);
    res.status(500).json({ error: "No se pudo generar el resumen del mercado." });
  }
}
