import { get } from "@vercel/blob";
import { generarApertura, BLOB_PATHNAME } from "./agente-apertura.js";

export async function leerAperturaGuardado() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  try {
    const resultado = await get(BLOB_PATHNAME, { access: "private" });
    if (!resultado || !resultado.stream) return null;
    const texto = await new Response(resultado.stream).text();
    return JSON.parse(texto);
  } catch (err) {
    console.error("No se pudo leer el resumen de apertura guardado en Blob:", err);
    return null;
  }
}

// Página /apertura lee de aquí en vez de /api/agente-apertura: sirve el
// último resultado guardado por el cron (7am ET) sin llamar a Claude (ni
// hacer búsquedas web) en cada visita. Si todavía no existe un resumen
// guardado (primer despliegue, o el blob no está disponible), cae a
// generarlo al vuelo como respaldo.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const guardado = await leerAperturaGuardado();
  if (guardado) {
    res.status(200).json(guardado);
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: "Falta configurar ANTHROPIC_API_KEY en las variables de entorno." });
    return;
  }

  try {
    const body = await generarApertura();
    res.status(200).json(body);
  } catch (err) {
    console.error("Error en /api/apertura (respaldo sin caché):", err);
    res.status(500).json({ error: "No se pudo generar el resumen de apertura." });
  }
}
