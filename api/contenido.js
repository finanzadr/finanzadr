import { get } from "@vercel/blob";
import { generarContenido, BLOB_PATHNAME } from "./agente-contenido.js";

async function leerContenidoGuardado() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  try {
    const resultado = await get(BLOB_PATHNAME, { access: "private" });
    if (!resultado || !resultado.stream) return null;
    const texto = await new Response(resultado.stream).text();
    return JSON.parse(texto);
  } catch (err) {
    console.error("No se pudo leer el contenido guardado en Blob:", err);
    return null;
  }
}

// Lee el último contenido generado por Agente 2 sin llamar a Claude en cada
// visita. Si todavía no existe contenido guardado (primer despliegue, o el
// blob no está disponible), cae a generarlo al vuelo como respaldo — lo que a
// su vez requiere que ya exista un briefing guardado por Agente 1.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const guardado = await leerContenidoGuardado();
  if (guardado) {
    res.status(200).json(guardado);
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: "Falta configurar ANTHROPIC_API_KEY en las variables de entorno." });
    return;
  }

  try {
    const body = await generarContenido();
    res.status(200).json(body);
  } catch (err) {
    console.error("Error en /api/contenido (respaldo sin caché):", err);
    res.status(500).json({ error: err.message || "No se pudo generar el contenido." });
  }
}
