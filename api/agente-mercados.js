import Anthropic from "@anthropic-ai/sdk";
import { put } from "@vercel/blob";

const FINNHUB_KEY = "d88c1mhr01qq4342hla0d88c1mhr01qq4342hlag";

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

async function fetchPrecios() {
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

async function fetchNoticias() {
  try {
    const res = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_KEY}`);
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data
      .filter((n) => isSafeHeadline(n.headline))
      .slice(0, 10)
      .map((n) => ({ titulo: n.headline, resumen: n.summary, fuente: n.source }));
  } catch {
    return [];
  }
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

const DIAS_SEMANA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function formatearFechaLarga(fechaUTC) {
  const dia = DIAS_SEMANA[fechaUTC.getUTCDay()];
  const mes = MESES[fechaUTC.getUTCMonth()];
  return `${dia} ${fechaUTC.getUTCDate()} de ${mes} de ${fechaUTC.getUTCFullYear()}`;
}

// Dado un día (UTC, a medianoche), retorna el día de trading anterior más
// reciente saltando fines de semana. La fórmula funciona para cualquier día
// de la semana como entrada, no solo lunes: p.ej. si el día dado es sábado o
// domingo, retrocede hasta el viernes anterior.
function diaTradingAnterior(fechaUTC) {
  const diaSemana = fechaUTC.getUTCDay(); // 0=domingo ... 6=sábado
  const diasAtras = diaSemana === 1 ? 3 : diaSemana === 0 ? 2 : diaSemana === 6 ? 1 : 1;
  return new Date(fechaUTC.getTime() - diasAtras * 86400000);
}

const APERTURA_MIN = 9 * 60 + 30; // 9:30am ET
const CIERRE_MIN = 16 * 60; // 4:00pm ET

// Determina, con base en la hora actual en America/New_York, si el mercado
// está antes de abrir, abierto en vivo, o ya cerró por hoy — y qué día de
// trading deben reflejar los precios que tenemos (que siempre vienen del
// último "quote" de Finnhub, sea el cierre de ayer o el precio en vivo de hoy).
function getContextoTemporal(now = new Date()) {
  const partesFecha = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const { year, month, day } = Object.fromEntries(partesFecha.map((p) => [p.type, p.value]));
  const hoyUTC = new Date(Date.UTC(+year, +month - 1, +day));

  const partesHora = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const { hour, minute } = Object.fromEntries(partesHora.map((p) => [p.type, p.value]));
  const horaET = hour === "24" ? 0 : +hour; // Intl con hour12:false a veces da "24" para medianoche
  const minutosDesdeMedianoche = horaET * 60 + +minute;

  const horaActualTexto = new Intl.DateTimeFormat("es-DO", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(now);

  const diaSemana = hoyUTC.getUTCDay();
  const esFinDeSemana = diaSemana === 0 || diaSemana === 6;

  let estadoMercado; // "antes-apertura" | "abierto" | "cerrado-hoy" | "fin-de-semana"
  let diaReferenciaUTC;

  if (esFinDeSemana) {
    estadoMercado = "fin-de-semana";
    diaReferenciaUTC = diaTradingAnterior(hoyUTC);
  } else if (minutosDesdeMedianoche < APERTURA_MIN) {
    estadoMercado = "antes-apertura";
    diaReferenciaUTC = diaTradingAnterior(hoyUTC);
  } else if (minutosDesdeMedianoche < CIERRE_MIN) {
    estadoMercado = "abierto";
    diaReferenciaUTC = hoyUTC;
  } else {
    estadoMercado = "cerrado-hoy";
    diaReferenciaUTC = hoyUTC;
  }

  return {
    estadoMercado,
    horaActualTexto,
    fechaActualTexto: formatearFechaLarga(hoyUTC),
    fechaReferenciaTexto: formatearFechaLarga(diaReferenciaUTC),
    nombreDiaReferencia: DIAS_SEMANA[diaReferenciaUTC.getUTCDay()],
    esReferenciaHoy: diaReferenciaUTC.getTime() === hoyUTC.getTime(),
  };
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

function buildContextoTiempoTexto(ctx) {
  const { estadoMercado, horaActualTexto, fechaActualTexto, fechaReferenciaTexto, nombreDiaReferencia } = ctx;

  if (estadoMercado === "antes-apertura") {
    return `- Hoy es ${fechaActualTexto}. Este resumen se genera ANTES de que abra el mercado de valores de EE.UU. (que abre a las 9:30am ET).
- Los precios y variaciones porcentuales de abajo son del CIERRE del día de trading anterior (${fechaReferenciaTexto}), no de hoy. El mercado de hoy todavía no ha abierto.
- Nunca digas que el mercado "cerró hoy" ni "hoy subió/bajó". Refiérete a esos movimientos como "ayer" (si corresponde) o nombrando explícitamente el día, por ejemplo "el ${nombreDiaReferencia}".`;
  }

  if (estadoMercado === "abierto") {
    return `- Hoy es ${fechaActualTexto}. El mercado de valores de EE.UU. está ABIERTO en este momento (son las ${horaActualTexto} hora del Este).
- Los precios de abajo son niveles EN VIVO/intradía de hoy, ${fechaActualTexto}, y pueden seguir moviéndose hasta el cierre a las 4:00pm ET.
- No digas que el mercado "cerró" ni que estos son los niveles finales del día. Aclara que el mercado sigue operando y estos son los movimientos hasta el momento.`;
  }

  if (estadoMercado === "cerrado-hoy") {
    return `- Hoy es ${fechaActualTexto}. El mercado de valores de EE.UU. ya cerró por hoy (el cierre fue a las 4:00pm ET).
- Los precios de abajo son del CIERRE DE HOY, ${fechaActualTexto}.
- Puedes decir que el mercado "cerró hoy" y describir los movimientos de hoy en tiempo pasado.`;
  }

  // fin-de-semana
  return `- Hoy es ${fechaActualTexto}. El mercado de valores de EE.UU. está cerrado por ser fin de semana.
- Los precios de abajo son del CIERRE del último día de trading (${fechaReferenciaTexto}), no de hoy.
- Aclara que el mercado no opera hoy y que los datos corresponden al ${nombreDiaReferencia}.`;
}

const ESPECIFICACION_EDITORIAL = `=== ESPECIFICACIÓN EDITORIAL — FINANZADR ===

ROL
Eres el editor financiero jefe de FinanzaDR, un medio en español que explica
Wall Street a la comunidad latina en Estados Unidos. Escribes con la autoridad
de un editor senior de Bloomberg o el Wall Street Journal, pero con la
claridad de alguien que sabe que su lector puede estar comprando su primera
acción esta semana.

AUDIENCIA
Personas trabajadoras, muchas primera generación de inmigrantes, con
curiosidad financiera real pero sin vocabulario técnico previo. No solo
quieren saber "qué pasó" — quieren saber "por qué me debería importar".

REGLAS DE ESCRITURA (no negociables)

1. CADENA CAUSAL SIEMPRE. Nunca reportes datos sueltos. Cada dato se conecta
   con el siguiente: "A pasó, lo cual causó B, y eso presiona C". Ejemplo del
   patrón que ya funcionó: petróleo sube → alimenta inflación → bancos
   centrales mantienen tasas altas → presiona acciones y bonos.

2. NÚMEROS CON CONTEXTO, nunca solos. No "subió 1.2%" sino "subió 1.2%, el
   mayor avance en tres semanas" o "subió 1.2%, revirtiendo la caída de ayer".

3. PROHIBIDO usar muletillas de IA genérica: "es importante destacar",
   "cabe mencionar", "en resumen", "en conclusión", "cabe resaltar", "es
   fundamental entender". Ve directo al punto.

4. CADA PÁRRAFO responde "¿y esto qué significa para mí?" — no solo informa,
   traduce el dato a algo que el lector pueda entender en su propia vida.

5. VARÍA LA ESTRUCTURA de las oraciones. No empieces dos párrafos seguidos
   igual ("El mercado...", "El mercado..."). Alterna longitud y ritmo.

6. JERGA SIEMPRE EXPLICADA la primera vez que aparece en el texto (P/E, VIX,
   "hawkish", spread, etc. — nunca asumas que el lector ya lo sabe).

7. NUNCA des consejo de inversión personalizado ni recomendación específica de
   compra/venta. Explicas el panorama y el porqué; la decisión es del lector.

8. NUNCA afirmes certeza sobre el futuro ("esto va a subir mañana"). Habla en
   términos de riesgo, probabilidad y qué vigilar, no de predicción.

9. CIERRA siempre con una invitación concreta a finanzadr.com, nunca genérica
   ("visítanos") — conecta el cierre con el tema específico del día.

ESTRUCTURA — RESUMEN DE CIERRE (tarde, después de cerrar el mercado)
a) Cómo cerraron los índices reales, con las cifras exactas
b) Por qué — la cadena causal completa detrás del movimiento
c) Qué significa esto para alguien que está empezando a invertir
d) Cierre con gancho a finanzadr.com

QUÉ EVITAR SIEMPRE
- Relleno / frases vacías que no aportan información nueva
- Alarmismo o sensacionalismo ("el mercado se desploma" si solo bajó 0.3%)
- Afirmaciones de certeza sobre el futuro
- Tono robótico o de lista — debe leerse como un texto humano bien escrito

LONGITUD
3-4 párrafos, cada uno de 2-4 oraciones. Ni telegráfico ni denso.

RECORDATORIO LEGAL
Este contenido es educativo e informativo, no es asesoría financiera
personalizada. No lo repitas como disclaimer robótico en cada texto — que se
sienta implícito en cómo está escrito (explicando panorama, no diciendo qué
hacer), y sí inclúyelo explícitamente una vez al final en letra pequeña.`;

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

  return `${ESPECIFICACION_EDITORIAL}

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
