// Compara la contraseña recibida contra MONITOREO_PASSWORD y devuelve solo un
// booleano — nunca se registra ni se devuelve la contraseña real.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido." });
    return;
  }

  if (!process.env.MONITOREO_PASSWORD) {
    res.status(500).json({ error: "Falta configurar MONITOREO_PASSWORD en las variables de entorno." });
    return;
  }

  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const valido = password.length > 0 && password === process.env.MONITOREO_PASSWORD;

  res.status(200).json({ valido });
}
