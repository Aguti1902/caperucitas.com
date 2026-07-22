import { SPANISH_CITIES } from '@/data/spanishCities'
import { MUNICIPALITY_BY_SLUG, SPANISH_MUNICIPALITIES, type MunicipalityEntry } from '@/data/spanishMunicipalitiesIndex'

export const SITE_URL = 'https://www.caperucitas.com'

export type SeoSection = 'escort' | 'sexo_gratis'

export interface SeoCity {
  name: string
  slug: string
  lat: number | null
  lng: number | null
  provinciaId?: string
}

/** Categorías SEO en URL (ej. /sexo-gratis/gays/en/figueres) */
export const SEO_CATEGORIES = [
  { id: 'chica', slug: 'chicas', label: 'Chicas', labelSingular: 'chica' },
  { id: 'chico', slug: 'chicos', label: 'Chicos', labelSingular: 'chico' },
  { id: 'gay', slug: 'gays', label: 'Gays', labelSingular: 'gay' },
  { id: 'trans', slug: 'trans', label: 'Trans', labelSingular: 'trans' },
  { id: 'masajes', slug: 'masajes', label: 'Masajes', labelSingular: 'masajes' },
  { id: 'casa', slug: 'casas', label: 'Casas/Pisos', labelSingular: 'casa' },
] as const

export type SeoCategorySlug = (typeof SEO_CATEGORIES)[number]['slug']

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

export function getCategoryBySlug(slug?: string | null) {
  if (!slug) return null
  return SEO_CATEGORIES.find((c) => c.slug === slug) || null
}

export function getCategoryByGenderId(genderId?: string | null) {
  if (!genderId || genderId === 'all') return null
  return SEO_CATEGORIES.find((c) => c.id === genderId) || null
}

export function getCityPath(
  section: SeoSection,
  city: SeoCity | { name: string; slug?: string },
  categorySlug?: string | null
): string {
  const slug = getCitySlug(city)
  const base = section === 'sexo_gratis' ? '/sexo-gratis' : '/putas'
  if (categorySlug && categorySlug !== 'all') {
    return `${base}/${categorySlug}/en/${slug}`
  }
  return `${base}/${slug}`
}

export function getCityCanonical(
  section: SeoSection,
  city: SeoCity,
  categorySlug?: string | null
): string {
  return `${SITE_URL}${getCityPath(section, city, categorySlug)}`
}

export function getCitySeoMeta(
  city: SeoCity,
  section: SeoSection,
  categorySlug?: string | null
) {
  const cityName = city.name
  const cat = getCategoryBySlug(categorySlug)

  if (section === 'sexo_gratis') {
    if (cat) {
      return {
        title: `Sexo gratis ${cat.label.toLowerCase()} en ${cityName} | Caperucitas.com`,
        description: `Sexo gratis ${cat.label.toLowerCase()} en ${cityName}. Contactos consensuados sin compensación económica. Conoce personas cerca de ti en Caperucitas.com.`,
        h1: `Sexo gratis ${cat.label.toLowerCase()} en ${cityName}`,
        subtitle: `Personas cerca de ti en ${cityName} — sección ${cat.label.toLowerCase()}`,
        keywords: `sexo gratis ${cat.label.toLowerCase()} ${cityName}, contactos ${cityName}, ${cat.slug} ${cityName}`,
      }
    }
    return {
      title: `Sexo gratis en ${cityName} | Caperucitas.com`,
      description: `Sexo gratis en ${cityName}. Contactos consensuados sin compensación económica. Crea tu perfil y conecta con personas cercanas en Caperucitas.com.`,
      h1: `Sexo gratis en ${cityName}`,
      subtitle: `Personas cerca de ti en ${cityName}`,
      keywords: `sexo gratis ${cityName}, encuentros ${cityName}, contactos ${cityName}`,
    }
  }

  if (cat) {
    return {
      title: `Putas y escorts ${cat.label.toLowerCase()} en ${cityName} | Caperucitas.com`,
      description: `Putas y escorts ${cat.label.toLowerCase()} en ${cityName}. Perfiles con fotos y contacto directo por WhatsApp y teléfono en Caperucitas.com.`,
      h1: `Putas y escorts ${cat.label.toLowerCase()} en ${cityName}`,
      subtitle: `${cat.label} cerca de ti en ${cityName} — contacto directo`,
      keywords: `putas ${cat.label.toLowerCase()} ${cityName}, escorts ${cityName}, ${cat.slug} ${cityName}`,
    }
  }

  return {
    title: `Putas y escorts en ${cityName} | Caperucitas.com`,
    description: `Putas y escorts en ${cityName} cerca de ti. Perfiles con fotos, contacto directo por WhatsApp y teléfono. Encuentra compañía en ${cityName} en Caperucitas.com.`,
    h1: `Putas y escorts en ${cityName}`,
    subtitle: `Chicas, chicos y travestis en ${cityName} — contacto directo`,
    keywords: `putas ${cityName}, escorts ${cityName}, putas en ${cityName}`,
  }
}

/** Texto SEO visible (evita thin content / doorway pages) */
export function getCitySeoBody(city: SeoCity, section: SeoSection, categorySlug?: string | null) {
  const cityName = city.name
  const cat = getCategoryBySlug(categorySlug)
  const catLabel = cat ? cat.label.toLowerCase() : null

  if (section === 'sexo_gratis') {
    return {
      intro: catLabel
        ? `Caperucitas te permite conocer ${catLabel} según la zona en la que te encuentras. En ${cityName} puedes crear tu perfil y conectar con gente cercana para chatear y conoceros, sin compensación económica.`
        : `Caperucitas te permite conocer personas según la zona en la que te encuentras. En ${cityName} puedes crear tu perfil y conectar con gente cercana para chatear y conoceros.`,
      emptyTitle: `¿Todavía no ves perfiles en ${cityName}?`,
      emptyText:
        `Es posible que aún no haya suficientes usuarios activos en esta zona. Puedes registrarte y aparecer cuando haya personas conectadas cerca de ti.`,
      disclaimer:
        `La sección Sexo gratis está pensada para contactos y encuentros consensuados sin compensación económica. Pedir o aceptar dinero supone expulsión permanente.`,
      nearbyTitle: `Explora otros perfiles de sexo gratis cerca de ${cityName}`,
    }
  }

  return {
    intro: catLabel
      ? `Directorio de putas y escorts ${catLabel} en ${cityName}. Contacto directo, fotos reales y perfiles cerca de tu ubicación.`
      : `Directorio de putas y escorts en ${cityName}. Contacto directo, fotos reales y perfiles cerca de tu ubicación.`,
    emptyTitle: `¿Todavía no hay perfiles en ${cityName}?`,
    emptyText:
      `Puede que aún no haya anuncios activos en esta zona. Explora perfiles cercanos o publica el tuyo para aparecer en ${cityName}.`,
    disclaimer: `Contacta siempre de forma respetuosa. Verifica la información y usa el botón de denuncia si detectas irregularidades.`,
    nearbyTitle: `Explora otros perfiles cerca de ${cityName}`,
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

export function slugToDisplayName(slug: string): string {
  return slug
    .split('-')
    .filter((p) => !/^p\d+$/.test(p))
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export { SPANISH_MUNICIPALITIES }
