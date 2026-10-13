/**
 * Vercel Cron → dispara el job SEO diario del backend Railway.
 * Configurar SEO_CRON_SECRET / CRON_SECRET igual en Vercel y Railway.
 */
export const config = {
  runtime: 'nodejs',
}

const BACKEND =
  process.env.VITE_API_URL ||
  process.env.BACKEND_URL ||
  'https://caperucitascom-production.up.railway.app'

export default async function handler(req, res) {
  // Vercel Cron envía GET; también aceptamos POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const secret = process.env.SEO_CRON_SECRET || process.env.CRON_SECRET || ''
  const url = `${BACKEND.replace(/\/$/, '')}/api/seo/run`
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(secret ? { 'x-seo-cron-secret': secret } : {}),
      },
      body: JSON.stringify(secret ? { secret } : {}),
    })
    const data = await r.json().catch(() => ({}))
    res.status(r.status).json({ ok: r.ok, backendStatus: r.status, data })
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) })
  }
}
