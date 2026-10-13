import { Router, Request, Response } from 'express';
import {
  buildPrioritySitemapXml,
  getLastSeoDailyReport,
  runSeoDailyJob,
} from '../services/seo-daily.service';

const router = Router();

/** Informe del último job SEO diario (público, sin datos sensibles) */
router.get('/report', (_req: Request, res: Response) => {
  const report = getLastSeoDailyReport();
  if (!report) {
    return res.status(404).json({
      error: 'Aún no hay informe. El cron diario corre a las 06:15 UTC, o dispara POST /api/seo/run',
    });
  }
  res.json(report);
});

/** Sitemap prioritario dinámico (ciudades con perfiles + lastmod de hoy) */
router.get('/sitemap-priority.xml', async (_req: Request, res: Response) => {
  let report = getLastSeoDailyReport();
  if (!report) {
    try {
      report = await runSeoDailyJob();
    } catch (e: any) {
      return res.status(500).type('text/plain').send(`SEO sitemap error: ${e?.message || e}`);
    }
  }
  res
    .type('application/xml')
    .set('Cache-Control', 'public, max-age=3600')
    .send(buildPrioritySitemapXml(report));
});

/**
 * Disparo manual / desde Vercel Cron.
 * Protegido con SEO_CRON_SECRET (header x-seo-cron-secret o ?secret=)
 */
router.post('/run', async (req: Request, res: Response) => {
  const expected = process.env.SEO_CRON_SECRET || process.env.CRON_SECRET;
  if (expected) {
    const got =
      (req.headers['x-seo-cron-secret'] as string) ||
      (req.query.secret as string) ||
      (req.body && req.body.secret);
    if (got !== expected) {
      return res.status(401).json({ error: 'No autorizado' });
    }
  }

  try {
    const report = await runSeoDailyJob();
    res.json({ ok: true, report });
  } catch (e: any) {
    console.error('❌ SEO daily run error:', e);
    res.status(500).json({ error: e?.message || 'Error SEO daily' });
  }
});

/** Plan documentado (qué hace el sistema) */
router.get('/plan', (_req: Request, res: Response) => {
  res.json({
    title: 'Plan SEO automático Caperucitas.com',
    frequency: 'Diario a las 06:15 UTC (cron Railway) + opcional Vercel Cron',
    previously: 'Solo build-time en Vercel (sitemap + prerender). Sin job recurrente.',
    daily: [
      'Analizar perfiles activos por ciudad',
      'Construir lista prioritaria de URLs (home, perfiles, ciudades con anuncios)',
      'Notificar IndexNow (Bing/Yandex/…) para indexación rápida',
      'Publicar sitemap prioritario en /api/seo/sitemap-priority.xml con lastmod de hoy',
      'Guardar informe en /api/seo/report',
    ],
    onEachDeploy: [
      'Regenerar sitemap.xml completo (~17k URLs municipios)',
      'Prerender metas HTML de ciudades top',
      'Índice de municipios INE',
    ],
    alwaysOn: [
      'Canonical + JSON-LD (WebPage, FAQPage, ItemList) en páginas ciudad',
      'SSR/edge metas vía /api/seo-html para /putas/* y /sexo-gratis/*',
      'robots.txt con sitemaps',
      '410 Gone en perfiles eliminados',
    ],
  });
});

export default router;
