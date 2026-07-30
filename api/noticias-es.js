import Anthropic from "@anthropic-ai/sdk";
import { fetchNoticiasCrudas } from "./agente-mercados.js";

const CACHE_TTL_MS = 8 * 60_000;
let cache = { data: null, at: 0 };

// Request en curso compartida entre requests concurrentes durante un cache
// miss: evita que 2-3 visitas casi simultáneas al home disparen cada una su
// propia llamada a Claude. Protección parcial (solo dentro de la misma
// instancia serverless tibia, no cross-instance), pero de costo ~cero.
let enCurso = null;

function limpiarBloqueJSON(texto) {
  return texto
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
}

function buildPrompt(crudas) {
  const lista = crudas.map((n, i) => `${i + 1}. ${n.headline} — ${n.summary || "(sin resumen)"}`).join("\n");
  return `Eres el editor de FinanzaDR, un medio de educación financiera en español para latinos en EE.UU. Te paso titulares y resúmenes de noticias financieras en inglés, tal como los reporta Finnhub. Para cada uno, reescribe (no traduzcas palabra por palabra) un titular corto y un resumen de 1-2 oraciones en español natural y claro, explicando cualquier término técnico si hace falta. Mismo tono que usa FinanzaDR: directo, sin relleno de IA, sin admiración excesiva, sin URLs.

Noticias:
${lista}

Responde ÚNICAMENTE con un JSON array, mismo orden, mismo número de items (${crudas.length}) que te di, formato exacto:
[{"titulo":"...","resumen":"..."}]
Sin markdown, sin texto antes o después del JSON.`;
}

async function generarNoticiasEs() {
  const crudas = await fetchNoticiasCrudas(3);
  if (crudas.length === 0) return null;

  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 600,
    thinking: { type: "disabled" },
    output_config: { effort: "low" },
    messages: [{ role: "user", content: buildPrompt(crudas) }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  const reescritas = JSON.parse(limpiarBloqueJSON(textBlock ? textBlock.text : ""));
  if (!Array.isArray(reescritas) || reescritas.length !== crudas.length) {
    throw new Error("Respuesta de Claude con forma inesperada.");
  }

  const items = crudas.map((n, i) => ({
    titulo: reescritas[i].titulo,
    resumen: reescritas[i].resumen,
    fuente: n.source || "Finnhub",
    url: n.url,
    categoria: n.category,
    datetime: n.datetime,
  }));

  return { generadoEn: new Date().toISOString(), items };
}

// Cache en memoria (mismo patrón que /api/noticias y /api/precios) + guard de
// promise en curso. Las fallas NUNCA se cachean: si Claude falla o devuelve
// algo inesperado, la siguiente request reintenta en fresco en vez de quedar
// escondiendo el teaser del home por los 8 minutos completos del TTL.
async function obtenerNoticiasEs() {
  if (cache.data && Date.now() - cache.at < CACHE_TTL_MS) return cache.data;
  if (enCurso) return enCurso;

  enCurso = generarNoticiasEs()
    .then((data) => {
      if (data) cache = { data, at: Date.now() };
      return data;
    })
    .finally(() => { enCurso = null; });

  return enCurso;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(200).json({ disponible: false });
    return;
  }

  try {
    const data = await obtenerNoticiasEs();
    res.status(200).json(data || { disponible: false });
  } catch (err) {
    console.error("Error en /api/noticias-es:", err);
    res.status(200).json({ disponible: false });
  }
}
