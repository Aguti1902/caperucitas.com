import { SPANISH_CITIES } from '@/data/spanishCities'
import { MUNICIPALITY_BY_SLUG, SPANISH_MUNICIPALITIES, type MunicipalityEntry } from '@/data/spanishMunicipalitiesIndex'

const SITE_URL = 'https://www.caperucitas.com'

export type SeoSection = 'escort' | 'sexo_gratis'

export interface SeoCity {
  name: string
  slug: string
  lat: number | null
  lng: number | null
  provinciaId?: string
}

const COORDS_BY_NAME = new Map(
  SPANISH_CITIES.map((c) => [c.name.toLowerCase(), { lat: c.lat, lng: c.lng }])
)

export function cityToSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function enrichCoords(entry: MunicipalityEntry): SeoCity {
  const coords = COORDS_BY_NAME.get(entry.name.toLowerCase())
  return {
    name: entry.name,
    slug: entry.slug,
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
    provinciaId: entry.provinciaId,
  }
}

export function getCityBySlug(slug: string): SeoCity | undefined {
  const entry = MUNICIPALITY_BY_SLUG[slug.toLowerCase()]
  if (entry) return enrichCoords(entry)

  // Fallback: slug desconocido → nombre legible (long-tail SEO)
  const name = slug
    .split('-')
    .filter((p) => !/^p\d+$/.test(p))
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  if (!name) return undefined
  return { name, slug: slug.toLowerCase(), lat: null, lng: null }
}

export function getCitySlug(city: SeoCity | { name: string; slug?: string }): string {
  return city.slug || cityToSlug(city.name)
}

export function getCityPath(section: SeoSection, city: SeoCity | { name: string; slug?: string }): string {
  const slug = getCitySlug(city)
  return section === 'sexo_gratis' ? `/sexo-gratis/${slug}` : `/putas/${slug}`
}

export function getCityCanonical(section: SeoSection, city: SeoCity): string {
  return `${SITE_URL}${getCityPath(section, city)}`
}

export function getCitySeoMeta(city: SeoCity, section: SeoSection) {
  const cityName = city.name

  if (section === 'sexo_gratis') {
    return {
      title: `Sexo gratis en ${cityName} | Caperucitas.com`,
      description: `Encuentra sexo gratis en ${cityName}. Perfiles reales cerca de ti, contacto directo y sin compensación económica. Publica o busca en Caperucitas.com.`,
      h1: `Sexo gratis en ${cityName}`,
      subtitle: `Encuentros consensuados sin pagar en ${cityName} y alrededores`,
      keywords: `sexo gratis ${cityName}, encuentros ${cityName}, contactos ${cityName}`,
    }
  }

  return {
    title: `Putas y escorts en ${cityName} | Caperucitas.com`,
    description: `Putas y escorts en ${cityName} cerca de ti. Perfiles con fotos, contacto directo por WhatsApp y teléfono. Encuentra compañía en ${cityName} en Caperucitas.com.`,
    h1: `Putas y escorts en ${cityName}`,
    subtitle: `Chicas, chicos y travestis en ${cityName} — contacto directo`,
    keywords: `putas ${cityName}, escorts ${cityName}, putas en ${cityName}, escorts ${cityName}`,
  }
}

export function getNearbyMunicipalities(city: SeoCity, limit = 8): SeoCity[] {
  if (!city.provinciaId) return []

  return SPANISH_MUNICIPALITIES
    .filter((m) => m.provinciaId === city.provinciaId && m.slug !== city.slug)
    .slice(0, limit)
    .map(enrichCoords)
}

export function findMunicipalityByName(name: string): SeoCity | undefined {
  const normalized = name.toLowerCase().trim()
  const entry = SPANISH_MUNICIPALITIES.find((m) => m.name.toLowerCase() === normalized)
  if (entry) return enrichCoords(entry)

  const slug = cityToSlug(name)
  return getCityBySlug(slug)
}

export { SPANISH_MUNICIPALITIES, SITE_URL }
