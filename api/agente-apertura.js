import Anthropic from "@anthropic-ai/sdk";
import { put } from "@vercel/blob";

// Pathname fijo (sin sufijo aleatorio) para poder ubicar el mismo blob en
// cada lectura desde /api/apertura sin tener que guardar la URL en otro lado.
export const BLOB_PATHNAME = "apertura/latest.json";

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

ESTRUCTURA — RESUMEN DE APERTURA (mañana, antes de abrir el mercado)
a) Qué pasó mientras el lector dormía (Asia, Europa, futuros overnight)
b) Qué earnings o anuncios importan específicamente hoy
c) El "hilo conductor" del día — una narrativa clara de qué vigilar y por qué
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

function buildResearchPrompt() {
  return `Eres un investigador financiero. Tu única tarea es reunir información concreta y actual usando la herramienta de búsqueda web — otro paso posterior se encargará de redactar el artículo final con estos datos, así que no te preocupes por el estilo ni el formato aquí.

Investiga estos tres puntos (haz una búsqueda por cada uno, no asumas datos de memoria):

1. Cómo cerraron o se movieron durante la noche los mercados de Asia y Europa: Nikkei (Japón), Hang Seng (Hong Kong), FTSE 100 (Reino Unido) y DAX (Alemania). Necesitas la cifra de cierre y la variación porcentual de cada uno.
2. Qué empresas grandes reportan earnings importantes HOY (antes o después del cierre de Wall Street).
3. El sentimiento general de los futuros de EE.UU. antes de la apertura (futuros del S&P 500 y del Nasdaq) — si suben, bajan, y por qué.

Para cada punto, reporta las cifras y datos concretos que encuentres. Usa ÚNICAMENTE datos que hayas confirmado con la búsqueda web en este momento; si algún dato específico no lo encuentras, dilo explícitamente en vez de inventar una cifra. No hace falta que redactes un artículo terminado ni que sigas ningún estilo editorial — esto es solo el material de investigación en bruto.`;
}

function buildRewritePrompt(investigacion) {
  return `${ESPECIFICACION_EDITORIAL}

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
    max_tokens: 2048,
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
