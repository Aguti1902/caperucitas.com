/**
 * Genera HTML estático con metas correctas para top ciudades (prerender SEO).
 * Se ejecuta tras `vite build` → escribe en dist/putas/... y dist/sexo-gratis/...
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { metaFromPathname, injectSeoIntoHtml } from '../api/_seoMeta.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const dist = join(root, 'dist')

function cityToSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const citiesFile = readFileSync(join(root, 'src/data/spanishCities.ts'), 'utf8')
const cityNames = [...citiesFile.matchAll(/name: '([^']+)'/g)].map((m) => m[1])
const slugs = cityNames.map(cityToSlug)

const categories = ['chicas', 'chicos', 'gays', 'trans']
const paths = []

for (const slug of slugs) {
  paths.push(`/putas/${slug}`)
  paths.push(`/sexo-gratis/${slug}`)
}

// Categorías solo top 30 ciudades
for (const slug of slugs.slice(0, 30)) {
  for (const cat of categories) {
    paths.push(`/putas/${cat}/en/${slug}`)
    paths.push(`/sexo-gratis/${cat}/en/${slug}`)
  }
}

if (!existsSync(dist)) {
  console.error('❌ dist/ no existe. Ejecuta vite build antes.')
  process.exit(1)
}

const indexHtml = readFileSync(join(dist, 'index.html'), 'utf8')
let written = 0

for (const path of paths) {
  const meta = metaFromPathname(path)
  if (!meta) continue
  const html = injectSeoIntoHtml(indexHtml, meta)
  const parts = path.split('/').filter(Boolean)
  const dir = join(dist, ...parts)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), html)
  written++
}

// Blog index stub with meta
const blogMeta = {
  title: 'Blog | Guías de escorts y sexo gratis | Caperucitas.com',
  description: 'Guías prácticas: putas en Barcelona y Madrid, sexo gratis y cómo funciona Caperucitas.',
  canonical: 'https://www.caperucitas.com/blog',
}
mkdirSync(join(dist, 'blog'), { recursive: true })
writeFileSync(join(dist, 'blog', 'index.html'), injectSeoIntoHtml(indexHtml, blogMeta))
written++

console.log(`✅ Prerender: ${written} HTML estáticos en dist/ (${slugs.length} ciudades)`)
