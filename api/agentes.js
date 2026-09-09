import { autorizadoParaCron } from "./_auth.js";
import { getContextoTemporal } from "./_editorial-spec.js";
import { handler as apertura, ejecutar as ejecutarApertura } from "./_agente-apertura.js";
import { handler as contenido, ejecutar as ejecutarContenido } from "./_agente-contenido.js";
import { handler as mercados, ejecutar as ejecutarMercados } from "./_agente-mercados.js";
import { handler as monitoreo, ejecutar as ejecutarMonitoreo } from "./_agente-monitoreo.js";

// Router único de agentes.
//
// Dos límites del plan Hobby de Vercel se resuelven aquí:
//
// 1. Máximo 12 funciones serverless por despliegue (el proyecto llegó a 13).
//    Los cuatro agentes comparten endpoint: solo los dispara el cron, usan la
//    misma autorización (CRON_SECRET), el mismo formato de respuesta y las
//    mismas dependencias pesadas (SDK de Anthropic + Blob), así que compartir
//    bundle no añade peso a ninguna ruta que sirva al visitante.
//
// 2. Máximo 2 cron jobs por proyecto, y de ejecución diaria. Los cinco crons
//    anteriores se pliegan en dos cadenas (?plan=apertura y ?plan=cierre) que
//    ejecutan sus pasos en orden dentro de una sola invocación.
//
// Cada agente conserva su lógica intacta en su módulo con prefijo "_", que
// Vercel no despliega como función. Las rutas de lectura (/api/briefing,
// /api/apertura, /api/contenido, /api/monitoreo) siguen existiendo aparte.
//
// Modos:
//   /api/agentes?agente=apertura|contenido|mercados|monitoreo  → uno suelto
//   /api/agentes?plan=apertura|cierre                          → la cadena
// Ambos exigen el header de cron; el modo suelto sigue sirviendo para forzar
// una regeneración a mano con curl.
const AGENTES = { apertura, contenido, mercados, monitoreo };

// El orden importa: contenido lee del Blob que acaba de escribir el agente
// anterior, así que va siempre detrás del que genera su fuente.
const PLANES = {
  apertura: [
    { nombre: "apertura", ejecutar: () => ejecutarApertura() },
    { nombre: "contenido-apertura", ejecutar: () => ejecutarContenido("apertura") },
  ],
  cierre: [
    { nombre: "mercados", ejecutar: () => ejecutarMercados() },
    { nombre: "contenido-cierre", ejecutar: () => ejecutarContenido("cierre") },
    // El monitoreo era un cron semanal propio (lunes). Al no quedar cupo para
    // un tercer cron, viaja en la cadena de cierre y se salta el resto de la
    // semana. Va el último: si la invocación se queda sin tiempo, el briefing
    // y el contenido ya están guardados.
    { nombre: "monitoreo", ejecutar: () => ejecutarMonitoreo(), soloLunes: true },
  ],
};

const esLunesEnNuevaYork = (ahora = new Date()) =>
  new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short" }).format(ahora) === "Mon";

async function correrPlan(nombrePlan, res) {
  const pasos = PLANES[nombrePlan];
  const ctx = getContextoTemporal();

  // Sábado y domingo no hay sesión: no se gasta una llamada a Claude para
  // volver a contar el cierre del viernes.
  if (ctx.estadoMercado === "fin-de-semana") {
    res.status(200).json({ plan: nombrePlan, omitido: "fin-de-semana", ejecutadoEn: new Date().toISOString() });
    return;
  }

  const lunes = esLunesEnNuevaYork();
  const resultados = [];

  for (const paso of pasos) {
    if (paso.soloLunes && !lunes) {
      resultados.push({ paso: paso.nombre, estado: "omitido", motivo: "solo se ejecuta los lunes" });
      continue;
    }
    try {
      await paso.ejecutar();
      resultados.push({ paso: paso.nombre, estado: "ok" });
    } catch (err) {
      // Un paso que falla no aborta la cadena: los siguientes pueden seguir
      // siendo útiles, y cada endpoint de lectura conserva su respaldo de
      // generación al vuelo.
      console.error(`Error en el plan ${nombrePlan}, paso ${paso.nombre}:`, err);
      resultados.push({ paso: paso.nombre, estado: "error", error: err.message || String(err) });
    }
  }

  // 500 solo si no se completó ningún paso: así el cron aparece como fallido
  // en el panel cuando de verdad no publicó nada, y no cuando únicamente se
  // cayó el paso accesorio.
  const algunOk = resultados.some((r) => r.estado === "ok");
  const huboEjecutables = resultados.some((r) => r.estado !== "omitido");
  const estadoHttp = huboEjecutables && !algunOk ? 500 : 200;

  res.status(estadoHttp).json({ plan: nombrePlan, ejecutadoEn: new Date().toISOString(), pasos: resultados });
}

export default async function handler(req, res) {
  const plan = typeof req.query?.plan === "string" ? req.query.plan : "";
  const nombre = typeof req.query?.agente === "string" ? req.query.agente : "";

  // hasOwnProperty y no PLANES[plan] a secas: ?plan=constructor no debe
  // resolver a nada heredado de Object.prototype.
  if (Object.prototype.hasOwnProperty.call(PLANES, plan)) {
    res.setHeader("Cache-Control", "no-store");

    if (!autorizadoParaCron(req)) {
      res.status(401).json({ error: "No autorizado." });
      return;
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      res.status(500).json({ error: "Falta configurar ANTHROPIC_API_KEY en las variables de entorno." });
      return;
    }

    return correrPlan(plan, res);
  }

  if (Object.prototype.hasOwnProperty.call(AGENTES, nombre)) {
    // Cada handler valida por su cuenta el header de cron antes de gastar
    // dinero en Claude; este router no relaja esa comprobación.
    return AGENTES[nombre](req, res);
  }

  res.setHeader("Cache-Control", "no-store");
  res.status(404).json({
    error: `Ruta de agente desconocida. Usa ?agente=${Object.keys(AGENTES).join("|")} o ?plan=${Object.keys(PLANES).join("|")}.`,
  });
}
