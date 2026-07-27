import { get } from "@vercel/blob";
import { generarMonitoreo, BLOB_PATHNAME } from "./agente-monitoreo.js";

export async function leerMonitoreoGuardado() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  try {
    const resultado = await get(BLOB_PATHNAME, { access: "private" });
    if (!resultado || !resultado.stream) return null;
    const texto = await new Response(resultado.stream).text();
    return JSON.parse(texto);
  } catch (err) {
    console.error("No se pudo leer el monitoreo guardado en Blob:", err);
    return null;
  }
}

// Página /monitoreo lee de aquí en vez de /api/agente-monitoreo: sirve el
// último reporte guardado por el cron (lunes 13:00 UTC) sin llamar a Claude
// en cada visita. Si todavía no existe un reporte guardado (primer
// despliegue, o el blob no está disponible), cae a generarlo al vuelo como
// respaldo.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (!process.env.MONITOREO_PASSWORD) {
    res.status(500).json({ error: "Falta configurar MONITOREO_PASSWORD en las variables de entorno." });
    return;
  }
  if (req.headers["x-monitoreo-password"] !== process.env.MONITOREO_PASSWORD) {
    res.status(401).json({ error: "No autorizado." });
    return;
  }

  const guardado = await leerMonitoreoGuardado();
  if (guardado) {
    res.status(200).json(guardado);
    return;
  }

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
    res.status(200).json(body);
  } catch (err) {
    console.error("Error en /api/monitoreo (respaldo sin caché):", err);
    res.status(500).json({ error: "No se pudo generar el reporte de monitoreo." });
  }
}
