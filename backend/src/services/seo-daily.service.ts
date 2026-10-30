/**
 * SEO diario automático (Caperucitas.com)
 *
 * Antes: solo se regeneraba sitemap/metas en el build de Vercel (no había job recurrente).
 * Ahora: cada día analiza perfiles activos, prioriza URLs con contenido, notifica IndexNow
 * y deja un informe consultable en /api/seo/report.
 */

import prisma from '../lib/prisma';

const SITE_URL = 'https://www.caperucitas.com';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

const PRIORITY_CITIES = [
  'Madrid',
  'Barcelona',
  'Valencia',
  'Sevilla',
  'Zaragoza',
  'Málaga',
  'Murcia',
  'Bilbao',
  'Alicante',
  'Córdoba',
  'Granada',
  'Vigo',
  'Gijón',
  'A Coruña',
  'Palma',
  'Pamplona',
  'Valladolid',
  'Oviedo',
];

export type SeoDailyReport = {
  ranAt: string;
  siteUrl: string;
  totals: {
    activeProfiles: number;
    escort: number;
    sexoGratis: number;
    citiesWithProfiles: number;
    updatedLast24h: number;
  };
  topCities: Array<{ city: string; slug: string; count: number; escort: number; sexoGratis: number }>;
  urlsNotified: string[];
  indexNow: { ok: boolean; submitted: number; error?: string; skipped?: string };
  notes: string[];
};

type CityAgg = {
  city: string;
  slug: string;
  count: number;
  escort: number;
  sexoGratis: number;
};

let lastReport: SeoDailyReport | null = null;

export function getLastSeoDailyReport(): SeoDailyReport | null {
  return lastReport;
}

function cityToSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeCityKey(city: string): string {
  return cityToSlug(city.split(',')[0].trim());
}

function getIndexNowKey(): string {
  return (
    process.env.INDEXNOW_KEY ||
    process.env.SEO_INDEXNOW_KEY ||
    'caperucitas-seo-indexnow-key-2026'
  ).trim();
}

async function loadActiveProfiles() {
  // Soft-delete: excluir deletedAt si la columna existe
  try {
    const rows = (await prisma.$queryRawUnsafe(`
      SELECT city, "profileType", "updatedAt", "lastSeenAt"
      FROM profiles
      WHERE "isPaused" = false
        AND ("deletedAt" IS NULL)
      LIMIT 5000
    `)) as Array<{
      city: string;
      profileType: string;
      updatedAt: Date;
      lastSeenAt: Date;
    }>;
    return rows;
  } catch {
    return prisma.profile.findMany({
      where: { isPaused: false },
      select: { city: true, profileType: true, updatedAt: true, lastSeenAt: true },
      take: 5000,
    });
  }
}

async function analyzeCityCoverage() {
  const list = await loadActiveProfiles();
  const since = Date.now() - 24 * 60 * 60 * 1000;
  const byCity = new Map<string, CityAgg & { fresh: number }>();

  let escort = 0;
  let sexoGratis = 0;
  let updatedLast24h = 0;

  for (const p of list) {
    if (!p.city) continue;
    const display = p.city.split(',')[0].trim();
    const slug = normalizeCityKey(display);
    if (!slug) continue;

    const row = byCity.get(slug) || {
      city: display,
      slug,
      count: 0,
      escort: 0,
      sexoGratis: 0,
      fresh: 0,
    };
    row.count += 1;
    if (p.profileType === 'sexo_gratis') {
      row.sexoGratis += 1;
      sexoGratis += 1;
    } else {
      row.escort += 1;
      escort += 1;
    }
    const ts = Math.max(new Date(p.updatedAt).getTime(), new Date(p.lastSeenAt).getTime());
    if (ts >= since) {
      row.fresh += 1;
      updatedLast24h += 1;
    }
    byCity.set(slug, row);
  }

  const topCities = [...byCity.values()]
    .sort((a, b) => b.count - a.count || b.fresh - a.fresh)
    .slice(0, 80)
    .map(({ city, slug, count, escort: e, sexoGratis: s }) => ({
      city,
      slug,
      count,
      escort: e,
      sexoGratis: s,
    }));

  return {
    activeProfiles: list.length,
    escort,
    sexoGratis,
    citiesWithProfiles: byCity.size,
    updatedLast24h,
    topCities,
  };
}

function buildUrlsToNotify(analysis: Awaited<ReturnType<typeof analyzeCityCoverage>>): string[] {
  const urls = new Set<string>([
    `${SITE_URL}/`,
    `${SITE_URL}/perfiles`,
    `${SITE_URL}/ciudades`,
    `${SITE_URL}/blog`,
    `${SITE_URL}/como-funciona-caperucitas-y-sus-ventajas`,
    `${SITE_URL}/info-escorts`,
    `${SITE_URL}/info-sexo-gratis`,
    `${SITE_URL}/publicistas-escorts`,
  ]);

  for (const c of analysis.topCities.slice(0, 60)) {
    urls.add(`${SITE_URL}/putas/${c.slug}`);
    if (c.sexoGratis > 0) urls.add(`${SITE_URL}/sexo-gratis/${c.slug}`);
  }

  for (const name of PRIORITY_CITIES) {
    const slug = cityToSlug(name);
    urls.add(`${SITE_URL}/putas/${slug}`);
    urls.add(`${SITE_URL}/sexo-gratis/${slug}`);
  }

  return [...urls];
}

async function submitIndexNow(urls: string[]): Promise<{
  ok: boolean;
  submitted: number;
  error?: string;
  skipped?: string;
}> {
  if (process.env.SEO_INDEXNOW_DISABLED === '1' || process.env.SEO_INDEXNOW_DISABLED === 'true') {
    return { ok: true, submitted: 0, skipped: 'SEO_INDEXNOW_DISABLED' };
  }

  const key = getIndexNowKey();
  if (!key) {
    return { ok: false, submitted: 0, skipped: 'Sin INDEXNOW_KEY' };
  }

  const batch = urls.slice(0, 200);
  const keyLocation = `${SITE_URL}/${key}.txt`;

  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: 'www.caperucitas.com',
        key,
        keyLocation,
        urlList: batch,
      }),
    });

    if (res.status === 200 || res.status === 202 || res.status === 204) {
      return { ok: true, submitted: batch.length };
    }

    const text = await res.text().catch(() => '');
    return {
      ok: false,
      submitted: 0,
      error: `IndexNow HTTP ${res.status}: ${text.slice(0, 200)}`,
    };
  } catch (e: any) {
    return { ok: false, submitted: 0, error: e?.message || String(e) };
  }
}

export function buildPrioritySitemapXml(report: SeoDailyReport): string {
  const today = report.ranAt.slice(0, 10);
  const urls = report.urlsNotified.length
    ? report.urlsNotified
    : [`${SITE_URL}/`, `${SITE_URL}/perfiles`];

  const body = urls
    .map((loc) => {
      const isHome = loc === `${SITE_URL}/` || loc.endsWith('/perfiles');
      return `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${isHome ? '1.0' : '0.85'}</priority>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

export async function runSeoDailyJob(): Promise<SeoDailyReport> {
  const notes: string[] = [];
  console.log('📈 SEO diario: iniciando análisis…');

  const analysis = await analyzeCityCoverage();
  const urls = buildUrlsToNotify(analysis);
  const indexNow = await submitIndexNow(urls);

  if (!indexNow.ok && indexNow.error) {
    notes.push(`IndexNow: ${indexNow.error}`);
    notes.push(
      `Publica https://www.caperucitas.com/${getIndexNowKey()}.txt con el mismo key`
    );
  } else if (indexNow.skipped) {
    notes.push(`IndexNow omitido: ${indexNow.skipped}`);
  } else {
    notes.push(`IndexNow: ${indexNow.submitted} URLs enviadas (Bing/Yandex/Naver/Seznam)`);
  }

  notes.push(
    `Cobertura: ${analysis.activeProfiles} perfiles activos en ${analysis.citiesWithProfiles} ciudades`
  );
  notes.push(
    'Sitemap completo (~17k URLs) se regenera en cada deploy Vercel; este job refresca prioridad + IndexNow a diario'
  );

  const report: SeoDailyReport = {
    ranAt: new Date().toISOString(),
    siteUrl: SITE_URL,
    totals: {
      activeProfiles: analysis.activeProfiles,
      escort: analysis.escort,
      sexoGratis: analysis.sexoGratis,
      citiesWithProfiles: analysis.citiesWithProfiles,
      updatedLast24h: analysis.updatedLast24h,
    },
    topCities: analysis.topCities.slice(0, 30),
    urlsNotified: urls,
    indexNow,
    notes,
  };

  lastReport = report;
  console.log(
    `✅ SEO diario OK — perfiles=${report.totals.activeProfiles} ciudades=${report.totals.citiesWithProfiles} indexNow=${report.indexNow.submitted}`
  );
  return report;
}
