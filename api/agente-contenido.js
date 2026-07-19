import Anthropic from "@anthropic-ai/sdk";
import { put } from "@vercel/blob";
import { leerBriefingGuardado } from "./briefing.js";

// Pathname fijo (sin sufijo aleatorio) para poder ubicar el mismo blob en
// cada lectura desde /api/contenido sin tener que guardar la URL en otro lado.
export const BLOB_PATHNAME = "contenido/latest.json";

function limpiarBloqueJSON(texto) {
  return texto
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
}

function buildPrompt(resumenBriefing) {
  return `Eres el redactor de contenido de FinanzaDR, un medio que explica Wall Street a una audiencia latinoamericana y dominicana que recién empieza a invertir. Escribes con el tono de un profesor de finanzas: formal, claro y educativo, pero cercano — no eres un influencer de hype ni usas lenguaje de "gurú de dinero fácil".

RESUMEN DEL MERCADO DE HOY (única fuente de datos permitida; no inventes cifras ni noticias que no estén aquí):
${resumenBriefing}

Con base ÚNICAMENTE en ese resumen, genera 3 piezas de contenido para redes sociales. Cada una debe cerrar invitando explícitamente a visitar finanzadr.com para ver el análisis completo del día.

USO DE EMOJIS (aplica a las 3 piezas):
- En cada pieza, usa entre 3 y 5 emojis en total, elegidos ÚNICAMENTE de este set: 📈 📉 💰 💵 🏦 🥇 ₿ 🎯 🔍
- Cada emoji debe conectar directamente con lo que se está diciendo en ese punto exacto del texto: 📈 cuando algo subió, 📉 cuando algo cayó, 🥇 al hablar del oro, ₿ al hablar de Bitcoin/cripto, 💰 o 💵 al hablar de dinero o ganancias, 🏦 al hablar de bancos/bonos/instituciones, 🎯 al dar la conclusión o lección clave, 🔍 al invitar a profundizar o analizar.
- NUNCA uses emojis decorativos, de celebración o genéricos (nada de 🎉🚀🔥💯👏😱), ni emojis que no tengan relación directa con el dato o idea que acompañan en esa frase.
- Los emojis acompañan el contenido, no lo reemplazan ni le agregan hype — el tono sigue siendo formal y educativo.

1. GUION PARA TIKTOK/REELS (60 segundos):
- Escrito para hablarse en voz alta, no para leerse: frases cortas, cotidianas, como si le explicaras esto a un amigo en persona. Evita listas, viñetas o construcciones de texto escrito.
- Los primeros 3 segundos deben ser un hook que enganche antes de decir de qué trata el video (una pregunta directa, un dato que sorprenda, o una afirmación contraintuitiva).
- Debe poder narrarse completo en aproximadamente 60 segundos hablando a ritmo normal (~150-160 palabras).
- OBLIGATORIO: el guion debe incluir entre 3 y 5 emojis del set indicado arriba, insertados en el texto exactamente donde ocurre el dato que representan (el texto se muestra en pantalla mientras se narra, así que los emojis sí van escritos aunque el guion se hable en voz alta). Un guion sin emojis se considera incompleto.
- Cierra invitando a visitar finanzadr.com.

2. HILO DE X (3 a 4 tweets):
- Cada tweet debe tener MENOS DE 280 caracteres, incluyendo la numeración y cualquier emoji.
- Numera cada tweet al inicio, ejemplo "1/4".
- Construye una idea progresiva: hook inicial → contexto → dato clave del resumen → cierre.
- El último tweet del hilo invita a visitar finanzadr.com.
- Los 3-5 emojis del hilo se distribuyen entre los tweets (no los repitas todos en uno solo).

3. CAPTION DE INSTAGRAM:
- Gancho inicial en la primera línea, cuerpo breve con la idea central del día (2-4 líneas), cierre invitando a visitar finanzadr.com.
- Tono de profesor.
- Entre 5 y 8 hashtags relevantes, mezclando finanzas/inversión (ej. #EducaciónFinanciera, #InversionesLatam) y comunidad latina (ej. #FinanzasParaLatinos, #LatinosInvirtiendo).
- Los hashtags NUNCA deben contener espacios: cada uno es una sola palabra, en CamelCase si combina varios términos. Correcto: "#InvertirDesdeCero". Incorrecto: "#Invertir Desde Cero" o "#invertir desde cero".

Cada pieza debe poder entenderse de forma independiente — alguien que solo vea el Reel no necesita haber leído el hilo de X.

Responde EXCLUSIVAMENTE con un objeto JSON válido (sin texto antes o después, sin bloque de código markdown), con esta forma exacta:
{
  "tiktok": { "guion": "..." },
  "hiloX": ["1/4 ...", "2/4 ...", "3/4 ...", "4/4 ..."],
  "instagram": { "caption": "...", "hashtags": ["#...", "#..."] }
}`;
}

export async function generarContenido() {
  const briefing = await leerBriefingGuardado();
  if (!briefing || !briefing.resumen) {
    throw new Error(
      "No hay un briefing guardado en Blob todavía — Agente 2 depende del resumen que genera Agente 1."
    );
  }

  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    thinking: { type: "disabled" },
    output_config: { effort: "medium" },
    messages: [{ role: "user", content: buildPrompt(briefing.resumen) }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  const crudo = textBlock ? textBlock.text : "";
  const piezas = JSON.parse(limpiarBloqueJSON(crudo));

  return {
    generadoEn: new Date().toISOString(),
    basadoEnBriefing: briefing.generadoEn,
    ...piezas,
  };
}

// Genera las 3 piezas de contenido a partir del briefing ya guardado por
// Agente 1 y las guarda en Blob para que /api/contenido las sirva sin
// regenerar en cada visita. Se invoca manualmente por ahora (sin cron).
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: "Falta configurar ANTHROPIC_API_KEY en las variables de entorno." });
    return;
  }

  try {
    const body = await generarContenido();

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        await put(BLOB_PATHNAME, JSON.stringify(body), {
          access: "private",
          contentType: "application/json",
          addRandomSuffix: false,
          allowOverwrite: true,
        });
      } catch (err) {
        console.error("No se pudo guardar el contenido en Blob:", err);
      }
    }

    res.status(200).json(body);
  } catch (err) {
    console.error("Error en agente-contenido:", err);
    res.status(500).json({ error: err.message || "No se pudo generar el contenido." });
  }
}
