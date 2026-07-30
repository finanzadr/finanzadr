import Anthropic from "@anthropic-ai/sdk";
import { put } from "@vercel/blob";
import { autorizadoParaCron } from "./_auth.js";
import { especificacionEditorial, ESTRUCTURA_APERTURA } from "./_editorial-spec.js";

// Pathname fijo (sin sufijo aleatorio) para poder ubicar el mismo blob en
// cada lectura desde /api/apertura sin tener que guardar la URL en otro lado.
export const BLOB_PATHNAME = "apertura/latest.json";

function buildResearchPrompt() {
  return `Eres un investigador financiero. Tu única tarea es reunir información concreta y actual usando la herramienta de búsqueda web — otro paso posterior se encargará de redactar el artículo final con estos datos, así que no te preocupes por el estilo ni el formato aquí.

Investiga estos tres puntos (haz una búsqueda por cada uno, no asumas datos de memoria):

1. Cómo cerraron o se movieron durante la noche los mercados de Asia y Europa: Nikkei (Japón), Hang Seng (Hong Kong), FTSE 100 (Reino Unido) y DAX (Alemania). Necesitas la cifra de cierre y la variación porcentual de cada uno.
2. Qué empresas grandes reportan earnings importantes HOY (antes o después del cierre de Wall Street).
3. El sentimiento general de los futuros de EE.UU. antes de la apertura (futuros del S&P 500 y del Nasdaq) — si suben, bajan, y por qué.

Para cada punto, reporta las cifras y datos concretos que encuentres. Usa ÚNICAMENTE datos que hayas confirmado con la búsqueda web en este momento; si algún dato específico no lo encuentras, dilo explícitamente en vez de inventar una cifra. No hace falta que redactes un artículo terminado ni que sigas ningún estilo editorial — esto es solo el material de investigación en bruto.`;
}

function buildRewritePrompt(investigacion) {
  return `${especificacionEditorial(ESTRUCTURA_APERTURA)}

TAREA DE HOY: Resumen de Apertura

MATERIAL DE INVESTIGACIÓN (ya recopilado con búsqueda web; puede venir fragmentado, con saltos de línea irregulares o menciones de fuentes — ignora ese formato, es solo la materia prima):
"""
${investigacion}
"""

Con base ÚNICAMENTE en los datos de ese material de investigación, redacta el "Resumen de Apertura" de hoy siguiendo EXACTAMENTE la estructura "ESTRUCTURA — RESUMEN DE APERTURA" de la especificación editorial de arriba (a, b, c, d) y todas las reglas de escritura no negociables.

Instrucciones finales:
- Escribe en español.
- No inventes datos que no estén en el material de investigación de arriba. Si algún dato específico no aparece ahí, dilo explícitamente en el texto en vez de inventar una cifra.
- NO cites fuentes, NO menciones de dónde salió cada dato, NO dejes marcas de referencia — el material de investigación es solo insumo tuyo, el lector no debe ver ese proceso.
- Escribe el resultado como un solo bloque de texto continuo y natural, sin fragmentación, tal como un artículo terminado — no un texto cortado en pedazos alrededor de cada cifra.
- Sigue la longitud indicada (3-4 párrafos, 2-4 oraciones cada uno) y cierra con el recordatorio legal en letra pequeña, tal como indica la especificación.
- Empieza tu respuesta directamente con el título del resumen (formato **Día, fecha — Resumen de Apertura FinanzaDR**). No incluyas ninguna introducción, preámbulo, ni comentario sobre tu propio proceso antes del título — la primera línea de tu respuesta debe ser el título mismo.
- Responde ÚNICAMENTE con el resumen final ya redactado. No incluyas notas, no expliques el proceso, no agregues encabezados de sección ni texto fuera del resumen.`;
}

export async function generarApertura() {
  const client = new Anthropic();

  // Paso 1: investigación con web_search. Claude fragmenta el texto en
  // varios bloques "text" alrededor de cada cita — no importa aquí, porque
  // esto es solo material en bruto que se reescribe en el paso 2.
  const researchResponse = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    thinking: { type: "disabled" },
    output_config: { effort: "medium" },
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 6,
      },
    ],
    messages: [{ role: "user", content: buildResearchPrompt() }],
  });

  const investigacion = researchResponse.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join(" ")
    .trim();

  // Paso 2: reescritura editorial. Sin web_search — Claude solo toma el
  // material del paso 1 y lo convierte en un único bloque de texto
  // continuo siguiendo la especificación de FinanzaDR.
  const rewriteResponse = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    thinking: { type: "disabled" },
    output_config: { effort: "medium" },
    messages: [{ role: "user", content: buildRewritePrompt(investigacion) }],
  });

  const textBlock = rewriteResponse.content.find((b) => b.type === "text");
  const resumen = textBlock ? textBlock.text.trim() : "";

  return {
    generadoEn: new Date().toISOString(),
    resumen,
    stopReason: rewriteResponse.stop_reason,
    investigacionStopReason: researchResponse.stop_reason,
  };
}

// Endpoint invocable manualmente para generar el Resumen de Apertura y
// guardarlo en Blob. Sin cron todavía — se activa a mano mientras se prueba.
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
    const body = await generarApertura();

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        await put(BLOB_PATHNAME, JSON.stringify(body), {
          access: "private",
          contentType: "application/json",
          addRandomSuffix: false,
          allowOverwrite: true,
        });
      } catch (err) {
        console.error("No se pudo guardar el resumen de apertura en Blob:", err);
      }
    }

    res.status(200).json(body);
  } catch (err) {
    console.error("Error en agente-apertura:", err);
    res.status(500).json({ error: "No se pudo generar el resumen de apertura." });
  }
}
