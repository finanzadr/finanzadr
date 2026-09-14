// Proxy same-origin para el alta al boletín. El navegador no puede llamar a
// Listmonk directamente: el servidor no envía cabeceras CORS y el preflight
// OPTIONS devuelve 404, así que cualquier fetch cross-origin falla antes de
// salir. Aquí no hay CORS que negociar y la lista (UUID) no viaja en el bundle.
const LISTMONK_SUBSCRIBE_URL = "https://listmonk.juliolab.dev/api/public/subscription";
const LISTMONK_LIST_UUID = "dc43c2bf-a2ae-4451-ac25-c609ece45a6b";
const TIEMPO_LIMITE_MS = 10_000;

// Misma regla que EMAIL_VALIDO en src/App.jsx: se repite aquí para no confiar
// en la validación del cliente.
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Método no permitido" });
  }

  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
  if (!EMAIL_VALIDO.test(email)) {
    return res.status(400).json({ message: "Correo inválido" });
  }

  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_LIMITE_MS);

  let respuesta;
  try {
    respuesta = await fetch(LISTMONK_SUBSCRIBE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        name: email.split("@")[0],
        list_uuids: [LISTMONK_LIST_UUID],
      }),
      signal: controlador.signal,
    });
  } catch (err) {
    // 504 = no hubo confirmación: el cliente lo muestra como "no pudimos
    // confirmar", distinto de un rechazo.
    return res.status(err.name === "AbortError" ? 504 : 502).json({ message: "Sin respuesta del servicio de correo" });
  } finally {
    clearTimeout(temporizador);
  }

  let cuerpo = null;
  try { cuerpo = await respuesta.json(); } catch { /* respuesta sin cuerpo JSON */ }

  if (respuesta.ok) return res.status(200).json({ ok: true });

  const mensaje = String(cuerpo?.message || "").toLowerCase();
  if (mensaje.includes("already") || mensaje.includes("exist") || mensaje.includes("duplicad")) {
    return res.status(409).json({ message: "Ese correo ya estaba suscrito" });
  }
  return res.status(502).json({ message: cuerpo?.message || "El servicio de correo rechazó el alta" });
}
