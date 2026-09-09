import { handler as apertura } from "./_agente-apertura.js";
import { handler as contenido } from "./_agente-contenido.js";
import { handler as mercados } from "./_agente-mercados.js";
import { handler as monitoreo } from "./_agente-monitoreo.js";

// Router único de agentes.
//
// El plan Hobby de Vercel despliega como máximo 12 funciones serverless y el
// proyecto llegó a 13. Los cuatro agentes son los candidatos naturales a
// agruparse: solo los dispara el cron, comparten la misma autorización
// (CRON_SECRET), el mismo formato de respuesta y las mismas dependencias
// pesadas (SDK de Anthropic + Vercel Blob), así que compartir bundle no añade
// peso a ninguna ruta que sirva al visitante.
//
// Cada agente conserva su handler intacto en su propio módulo con prefijo "_",
// que Vercel no despliega como función independiente. Las rutas de lectura
// (/api/briefing, /api/apertura, /api/contenido, /api/monitoreo) siguen
// existiendo por separado y sin cambios.
//
// Invocación: /api/agentes?agente=apertura|contenido|mercados|monitoreo
// El cron de contenido añade &fuente=apertura, que su handler sigue leyendo de
// req.query igual que antes.
const AGENTES = { apertura, contenido, mercados, monitoreo };

export default async function handler(req, res) {
  const nombre = typeof req.query?.agente === "string" ? req.query.agente : "";

  // hasOwnProperty y no AGENTES[nombre] a secas: ?agente=constructor no debe
  // resolver a nada heredado de Object.prototype.
  if (!Object.prototype.hasOwnProperty.call(AGENTES, nombre)) {
    res.setHeader("Cache-Control", "no-store");
    res.status(404).json({
      error: `Agente desconocido. Usa ?agente=${Object.keys(AGENTES).join("|")}.`,
    });
    return;
  }

  // Cada handler valida por su cuenta el header de cron antes de gastar
  // dinero en Claude; este router no relaja esa comprobación.
  return AGENTES[nombre](req, res);
}
