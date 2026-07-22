import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SITE_URL = 'https://www.caperucitas.com'

function cityToSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const municipalities = JSON.parse(
  readFileSync(join(__dirname, '../src/data/spanishMunicipalities.json'), 'utf8')
)

const slugCount = new Map()
for (const m of municipalities) {
  const base = cityToSlug(m.nombre)
  slugCount.set(base, (slugCount.get(base) || 0) + 1)
}

const slugs = new Set()
for (const m of municipalities) {
  const base = cityToSlug(m.nombre)
  const slug = slugCount.get(base) > 1 ? `${base}-p${m.provincia_id}` : base
  slugs.add(slug)
  slugs.add(base) // alias corto
}

const staticPages = [
  { loc: '/', priority: '1.0', changefreq: 'daily' },
  { loc: '/perfiles', priority: '0.9', changefreq: 'hourly' },
  { loc: '/ciudades', priority: '0.9', changefreq: 'weekly' },
  { loc: '/blog', priority: '0.85', changefreq: 'weekly' },
  { loc: '/blog/putas-en-barcelona-2026', priority: '0.8', changefreq: 'monthly' },
  { loc: '/blog/putas-en-madrid-2026', priority: '0.8', changefreq: 'monthly' },
  { loc: '/blog/sexo-gratis-barcelona', priority: '0.8', changefreq: 'monthly' },
  { loc: '/blog/sexo-gratis-madrid', priority: '0.8', changefreq: 'monthly' },
  { loc: '/blog/como-funciona-caperucitas', priority: '0.75', changefreq: 'monthly' },
  { loc: '/blog/putas-cerca-de-mi-ubicacion', priority: '0.75', changefreq: 'monthly' },
  { loc: '/info', priority: '0.5', changefreq: 'monthly' },
  { loc: '/normas', priority: '0.4', changefreq: 'monthly' },
  { loc: '/privacidad', priority: '0.3', changefreq: 'yearly' },
  { loc: '/terminos', priority: '0.3', changefreq: 'yearly' },
  { loc: '/cookies', priority: '0.3', changefreq: 'yearly' },
]

const cityPages = [...slugs].flatMap((slug) => [
  { loc: `/putas/${slug}`, priority: '0.8', changefreq: 'daily' },
  { loc: `/sexo-gratis/${slug}`, priority: '0.7', changefreq: 'daily' },
])

// Categorías SEO solo para ciudades principales (evita explotar el sitemap)
const categories = ['chicas', 'chicos', 'gays', 'trans', 'masajes', 'casas']
const majorCitiesFile = readFileSync(join(__dirname, '../src/data/spanishCities.ts'), 'utf8')
const majorSlugs = [...majorCitiesFile.matchAll(/name: '([^']+)'/g)].map((m) => cityToSlug(m[1]))
const categoryPages = majorSlugs.flatMap((slug) =>
  categories.flatMap((cat) => [
    { loc: `/putas/${cat}/en/${slug}`, priority: '0.75', changefreq: 'daily' },
    { loc: `/sexo-gratis/${cat}/en/${slug}`, priority: '0.65', changefreq: 'daily' },
  ])
)

const allPages = [...staticPages, ...cityPages, ...categoryPages]
const today = new Date().toISOString().slice(0, 10)

// Sitemap index si supera 50k URLs (no aplica aún); un solo archivo por ahora
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (p) => `  <url>
    <loc>${SITE_URL}${p.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`

writeFileSync(join(__dirname, '../public/sitemap.xml'), xml)
console.log(`✅ sitemap.xml generado con ${allPages.length} URLs (${slugs.size} municipios)`)
