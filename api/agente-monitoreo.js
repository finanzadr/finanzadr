import Anthropic from "@anthropic-ai/sdk";
import { put } from "@vercel/blob";

// Pathname fijo (sin sufijo aleatorio) para poder ubicar el mismo blob en
// cada lectura, igual que en Agente 1 (briefing/latest.json) y Agente 2
// (contenido/latest.json). Store separado del resto: "monitoreo".
export const BLOB_PATHNAME = "monitoreo/latest.json";

const VERCEL_ANALYTICS_BASE = "https://api.vercel.com/v1/query/web-analytics";

// La API de Vercel Web Analytics espera fechas simples YYYY-MM-DD (sin hora),
// no timestamps ISO 8601 completos.
function formatearFechaISO(fecha) {
  return fecha.toISOString().slice(0, 10);
}

function rangoUltimos7Dias() {
  const hasta = new Date();
  const desde = new Date(hasta.getTime() - 7 * 86400000);
  return { since: formatearFechaISO(desde), until: formatearFechaISO(hasta) };
}

function buildQuery(extra = {}) {
  const { since, until } = rangoUltimos7Dias();
  return new URLSearchParams({
    projectId: process.env.VERCEL_PROJECT_ID,
    slug: process.env.VERCEL_TEAM_SLUG,
    since,
    until,
    ...extra,
  });
}

// NOTA: endpoint no documentado públicamente por Vercel al momento de
// escribir esto — se implementa tal cual lo especificado, pero hay que
// probarlo manualmente antes de confiar en la forma de la respuesta (podría
// necesitar ajustar el formato de since/until o los nombres de los params).
async function fetchVercelAnalytics(path, extraParams) {
  const url = `${VERCEL_ANALYTICS_BASE}/${path}?${buildQuery(extraParams)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}` },
  });
  if (!res.ok) {
    const texto = await res.text().catch(() => "");
    throw new Error(`Vercel Analytics (${path}) respondió ${res.status}: ${texto}`);
  }
  return res.json();
}

async function fetchVisitantesTotales() {
  return fetchVercelAnalytics("visits/count", {});
}

async function fetchPaginasMasVisitadas() {
  return fetchVercelAnalytics("visits/aggregate", { by: "route" });
}

async function fetchFuentesDeTrafico() {
  return fetchVercelAnalytics("visits/aggregate", { by: "referrer" });
}

function buildPrompt(visitantes, paginas, fuentes) {
  return `Eres el profesor que le explica a FinanzaDR cómo le fue esta semana en tráfico web. Con base ÚNICAMENTE en estos datos crudos de Vercel Web Analytics (no inventes cifras ni páginas que no estén aquí):

VISITANTES (últimos 7 días):
${JSON.stringify(visitantes, null, 2)}

PÁGINAS MÁS VISITADAS:
${JSON.stringify(paginas, null, 2)}

FUENTES DE TRÁFICO (de dónde vinieron los visitantes):
${JSON.stringify(fuentes, null, 2)}

Escribe un resumen en español de 3 a 4 frases, con tono de profesor (claro, cercano, sin jerga técnica de analítica web), que cubra: cuántos visitantes hubo esta semana, cuáles fueron las páginas más populares, y de dónde vino el tráfico (por ejemplo redes sociales vs. tráfico directo). Debe sonar como un reporte semanal simple para alguien que no maneja términos de analítica, no como un dashboard técnico. No agregues nada fuera de esas 3-4 frases.`;
}

export async function generarMonitoreo() {
  const [visitantes, paginas, fuentes] = await Promise.all([
    fetchVisitantesTotales(),
    fetchPaginasMasVisitadas(),
    fetchFuentesDeTrafico(),
  ]);

  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    thinking: { type: "disabled" },
    output_config: { effort: "low" },
    messages: [{ role: "user", content: buildPrompt(visitantes, paginas, fuentes) }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  const resumen = textBlock ? textBlock.text : "";

  return {
    generadoEn: new Date().toISOString(),
    resumen,
    datosCrudos: { visitantes, paginas, fuentes },
  };
}

// Agente 3 (Monitoreo): genera el reporte semanal de tráfico y lo guarda en
// Blob bajo su propio store ("monitoreo"), igual que Agente 1 y Agente 2 con
// los suyos. Sin cron todavía — se invoca manualmente mientras se prueba.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: "Falta configurar ANTHROPIC_API_KEY en las variables de entorno." });
    return;
  }
  if (!process.env.VERCEL_API_TOKEN || !process.env.VERCEL_PROJECT_ID || !process.env.VERCEL_TEAM_SLUG) {
    res.status(500).json({
      error: "Faltan variables de entorno de Vercel (VERCEL_API_TOKEN, VERCEL_PROJECT_ID, VERCEL_TEAM_SLUG).",
    });
    return;
  }

  try {
    const body = await generarMonitoreo();

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        await put(BLOB_PATHNAME, JSON.stringify(body), {
          access: "private",
          contentType: "application/json",
          addRandomSuffix: false,
          allowOverwrite: true,
        });
      } catch (err) {
        console.error("No se pudo guardar el monitoreo en Blob:", err);
      }
    }

    res.status(200).json(body);
  } catch (err) {
    console.error("Error en agente-monitoreo:", err);
    res.status(500).json({ error: err.message || "No se pudo generar el reporte de monitoreo." });
  }
}
