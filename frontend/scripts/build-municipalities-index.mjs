/**
 * Genera índice ligero de los 8.132 municipios INE para SEO y sitemap.
 * Ejecutar: node scripts/build-municipalities-index.mjs
 */
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

function cityToSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const raw = JSON.parse(
  readFileSync(join(__dirname, '../src/data/spanishMunicipalities.json'), 'utf8')
)

const slugCount = new Map()
for (const m of raw) {
  const base = cityToSlug(m.nombre)
  slugCount.set(base, (slugCount.get(base) || 0) + 1)
}

const entries = []
const slugToEntry = new Map()

for (const m of raw) {
  const base = cityToSlug(m.nombre)
  const slug =
    slugCount.get(base) > 1 ? `${base}-p${m.provincia_id}` : base

  const entry = { slug, name: m.nombre, provinciaId: m.provincia_id }
  entries.push(entry)
  slugToEntry.set(slug, entry)
  // Alias: primer municipio con slug base también responde al slug corto
  if (!slugToEntry.has(base)) slugToEntry.set(base, entry)
}

entries.sort((a, b) => a.name.localeCompare(b.name, 'es'))

const out = `// AUTO-GENERADO — no editar a mano. Fuente: INE vía codeforspain/ds-organizacion-administrativa
// Regenerar: node scripts/build-municipalities-index.mjs

export interface MunicipalityEntry {
  slug: string
  name: string
  provinciaId: string
}

export const SPANISH_MUNICIPALITIES: MunicipalityEntry[] = ${JSON.stringify(entries)}

export const MUNICIPALITY_BY_SLUG: Record<string, MunicipalityEntry> = ${JSON.stringify(Object.fromEntries(slugToEntry))}
`

writeFileSync(join(__dirname, '../src/data/spanishMunicipalitiesIndex.ts'), out)
console.log(`✅ Índice generado: ${entries.length} municipios, ${slugToEntry.size} slugs`)
