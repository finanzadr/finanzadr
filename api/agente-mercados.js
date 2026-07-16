import Anthropic from "@anthropic-ai/sdk";

const FINNHUB_KEY = "d88c1mhr01qq4342hla0d88c1mhr01qq4342hlag";

const WS_STOCKS = [
  { s: "SPY", n: "S&P 500" },
  { s: "QQQ", n: "NASDAQ" },
  { s: "DIA", n: "Dow Jones" },
  { s: "IWM", n: "Russell 2000" },
  { s: "GLD", n: "Oro" },
  { s: "TLT", n: "Bonos T. 20Y" },
  { s: "XLU", n: "Utilities" },
  { s: "BTC-USD", n: "Bitcoin" },
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
          return { simbolo: st.s, nombre: st.n, precio: data.c, cambioPct: +cambioPct.toFixed(2) };
        }
        return { simbolo: st.s, nombre: st.n, precio: null, cambioPct: null };
      } catch {
        return { simbolo: st.s, nombre: st.n, precio: null, cambioPct: null };
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

// El cron corre a las 7am ET, antes de la apertura (9:30am ET), así que los precios
// de Finnhub reflejan el cierre del día de trading anterior, no el de "hoy".
function getContextoTemporal(now = new Date()) {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const { year, month, day } = Object.fromEntries(partes.map((p) => [p.type, p.value]));
  const hoyUTC = new Date(Date.UTC(+year, +month - 1, +day));

  const diaSemana = hoyUTC.getUTCDay(); // 0=domingo ... 6=sábado
  const diasAtras = diaSemana === 1 ? 3 : diaSemana === 0 ? 2 : diaSemana === 6 ? 1 : 1;
  const diaAnteriorUTC = new Date(hoyUTC.getTime() - diasAtras * 86400000);

  return {
    fechaActualTexto: formatearFechaLarga(hoyUTC),
    diaAnteriorTexto: formatearFechaLarga(diaAnteriorUTC),
    nombreDiaAnterior: DIAS_SEMANA[diaAnteriorUTC.getUTCDay()],
  };
}

function buildPrompt(precios, noticias) {
  const preciosTexto = precios
    .map((p) =>
      p.precio != null
        ? `${p.nombre} (${p.simbolo}): $${p.precio.toFixed(2)} (${p.cambioPct >= 0 ? "+" : ""}${p.cambioPct}%)`
        : `${p.nombre} (${p.simbolo}): dato no disponible`
    )
    .join("\n");

  const noticiasTexto = noticias.length
    ? noticias.map((n) => `- ${n.titulo}${n.resumen ? `: ${n.resumen}` : ""}`).join("\n")
    : "No hay noticias disponibles en este momento.";

  const { fechaActualTexto, diaAnteriorTexto, nombreDiaAnterior } = getContextoTemporal();

  return `Eres un analista financiero que escribe para FinanzaDR, un medio que explica Wall Street a una audiencia latinoamericana que recién empieza a invertir.

CONTEXTO DE TIEMPO IMPORTANTE:
- Hoy es ${fechaActualTexto}. Este resumen se genera a las 7:00am hora del Este (ET), ANTES de que abra el mercado de valores de EE.UU. (que abre a las 9:30am ET).
- Por lo tanto, los precios y variaciones porcentuales que ves abajo son del CIERRE del día de trading anterior (${diaAnteriorTexto}), no de hoy. El mercado de hoy todavía no ha abierto cuando escribes esto.
- Nunca digas que el mercado "cerró hoy", "hoy subió/bajó" ni nada que implique que el día de trading de hoy ya ocurrió. Refiérete a esos movimientos como "ayer" (si corresponde) o nombrando explícitamente el día, por ejemplo "el ${nombreDiaAnterior}".

Con los siguientes datos de mercado del cierre de ${diaAnteriorTexto}, escribe un resumen del mercado en español.

PRECIOS DEL CIERRE DE ${diaAnteriorTexto.toUpperCase()}:
${preciosTexto}

NOTICIAS RECIENTES:
${noticiasTexto}

Instrucciones:
- Tono profesional pero cercano, como si le explicaras a un amigo que está aprendiendo a invertir.
- Exactamente 3 párrafos cortos (2-4 oraciones cada uno).
- Menciona los movimientos más importantes del cierre anterior (los activos con mayor cambio, al alza o a la baja), dejando claro que son del día de trading pasado y no de hoy.
- Conecta los movimientos de precios con las noticias relevantes cuando tenga sentido.
- No inventes datos que no estén en la información proporcionada.
- No uses títulos ni encabezados, solo los 3 párrafos de texto corrido.`;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: "Falta configurar ANTHROPIC_API_KEY en las variables de entorno." });
    return;
  }

  try {
    const [precios, noticias] = await Promise.all([fetchPrecios(), fetchNoticias()]);

    const client = new Anthropic();
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      thinking: { type: "disabled" },
      output_config: { effort: "low" },
      messages: [{ role: "user", content: buildPrompt(precios, noticias) }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const resumen = textBlock ? textBlock.text : "";

    res.status(200).json({
      generadoEn: new Date().toISOString(),
      resumen,
      precios,
      noticiasUsadas: noticias.length,
    });
  } catch (err) {
    console.error("Error en agente-mercados:", err);
    res.status(500).json({ error: "No se pudo generar el resumen del mercado." });
  }
}
