import { fetchNoticiasCrudas } from "./agente-mercados.js";

// Mismo criterio de caché en memoria que /api/precios, pero con TTL más
// largo: las noticias generales no cambian segundo a segundo.
const CACHE_TTL_MS = 90_000;
let cache = { data: null, at: 0 };

// Endpoint de solo lectura, sin parámetros (category=general fijo). Devuelve
// el shape crudo de Finnhub (headline, summary, source, datetime, category,
// url) ya filtrado por titulares no seguros — cada consumidor en el frontend
// recorta/formatea lo que necesita, igual que hacía antes con la respuesta
// directa de Finnhub.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (!cache.data || Date.now() - cache.at > CACHE_TTL_MS) {
    cache = { data: await fetchNoticiasCrudas(15), at: Date.now() };
  }

  res.status(200).json(cache.data);
}
