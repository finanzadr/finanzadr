import { fetchPrecios } from "./agente-mercados.js";

// Caché en memoria a nivel de módulo: sobrevive entre invocaciones "calientes"
// de la misma instancia serverless, no entre instancias distintas. No es
// consistencia perfecta, pero corta bastante el volumen de llamadas a
// Finnhub cuando hay varios visitantes concurrentes dentro de la ventana.
const CACHE_TTL_MS = 25_000;
let cache = { data: null, at: 0 };

// Endpoint de solo lectura: siempre devuelve el quote de los 8 símbolos fijos
// de WS_STOCKS (agente-mercados.js), sin parámetros — el frontend nunca pide
// símbolos distintos, así que aceptar símbolos por query abriría esto como
// proxy genérico hacia Finnhub con nuestra key.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (!cache.data || Date.now() - cache.at > CACHE_TTL_MS) {
    cache = { data: await fetchPrecios(), at: Date.now() };
  }

  res.status(200).json(cache.data);
}
