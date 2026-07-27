// Verifica el header Authorization que Vercel Cron envía automáticamente
// ("Bearer " + CRON_SECRET) en cada invocación programada. Usado por los
// endpoints de agentes (los que llaman a Claude y cuestan dinero) para
// rechazar invocaciones manuales/externas. Nombre con "_" al inicio: Vercel
// no despliega este archivo como función propia, solo se importa.
export function autorizadoParaCron(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.authorization === `Bearer ${secret}`;
}
