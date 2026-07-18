import { list } from "@vercel/blob";
import { generarBriefing, BLOB_PATHNAME } from "./agente-mercados.js";

async function leerBriefingGuardado() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { data: null, error: "BLOB_READ_WRITE_TOKEN no está definido en este entorno" };
  }
  try {
    const { blobs } = await list({ prefix: BLOB_PATHNAME });
    const blob = blobs.find((b) => b.pathname === BLOB_PATHNAME);
    if (!blob) return { data: null, error: `no se encontró un blob en "${BLOB_PATHNAME}" (${blobs.length} blobs con ese prefijo)` };
    const res = await fetch(blob.url);
    if (!res.ok) return { data: null, error: `fetch al blob devolvió HTTP ${res.status}` };
    return { data: await res.json(), error: null };
  } catch (err) {
    console.error("No se pudo leer el briefing guardado en Blob:", err);
    return { data: null, error: err.message };
  }
}

// Página /briefing lee de aquí en vez de /api/agente-mercados: sirve el
// último resultado guardado por el cron (7am ET) sin llamar a Claude en cada
// visita. Si todavía no existe un briefing guardado (primer despliegue, o el
// blob no está disponible), cae a generarlo al vuelo como respaldo.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const { data: guardado, error: blobError } = await leerBriefingGuardado();
  if (guardado) {
    res.status(200).json({ ...guardado, _fuente: "blob" });
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: "Falta configurar ANTHROPIC_API_KEY en las variables de entorno." });
    return;
  }

  try {
    const body = await generarBriefing();
    // Diagnóstico temporal (_blob*) para ver en producción por qué no se
    // pudo leer el blob guardado, sin depender de los logs del dashboard.
    res.status(200).json({ ...body, _fuente: "generado", _blobReadError: blobError });
  } catch (err) {
    console.error("Error en /api/briefing (respaldo sin caché):", err);
    res.status(500).json({ error: "No se pudo generar el resumen del mercado." });
  }
}
