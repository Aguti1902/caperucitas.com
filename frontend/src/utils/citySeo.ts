import { SPANISH_CITIES } from '@/data/spanishCities'
import { getTopCityCopy } from '@/data/citySeoCopy'

export const SITE_URL = 'https://www.caperucitas.com'

export type SeoSection = 'escort' | 'sexo_gratis'

export interface SeoCity {
  name: string
  slug: string
  lat: number | null
  lng: number | null
  provinciaId?: string
}

export const SEO_CATEGORIES = [
  { id: 'chica', slug: 'chicas', label: 'Chicas', labelSingular: 'chica' },
  { id: 'chico', slug: 'chicos', label: 'Chicos', labelSingular: 'chico' },
  { id: 'gay', slug: 'gays', label: 'Gays', labelSingular: 'gay' },
  { id: 'trans', slug: 'trans', label: 'Trans', labelSingular: 'trans' },
  { id: 'masajes', slug: 'masajes', label: 'Masajes', labelSingular: 'masajes' },
  { id: 'casa', slug: 'casas', label: 'Casas/Pisos', labelSingular: 'casa' },
] as const

const COORDS_BY_SLUG = new Map(
  SPANISH_CITIES.map((c) => [cityToSlug(c.name), { name: c.name, lat: c.lat, lng: c.lng }])
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

export function slugToDisplayName(slug: string): string {
  return slug
    .split('-')
    .filter((p) => !/^p\d+$/.test(p))
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function getCityBySlug(slug: string): SeoCity | undefined {
  if (!slug) return undefined
  const key = slug.toLowerCase()
  const major = COORDS_BY_SLUG.get(key)
  if (major) {
    return { name: major.name, slug: key, lat: major.lat, lng: major.lng }
  }
  return { name: slugToDisplayName(key), slug: key, lat: null, lng: null }
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

export function getCitySeoBody(city: SeoCity, section: SeoSection, categorySlug?: string | null) {
  const cityName = city.name
  const cat = getCategoryBySlug(categorySlug)
  const catLabel = cat ? cat.label.toLowerCase() : null
  const unique = getTopCityCopy(city.slug)

  if (section === 'sexo_gratis') {
    return {
      intro: unique?.gratisIntro
        || (catLabel
          ? `Caperucitas te permite conocer ${catLabel} según la zona en la que te encuentras. En ${cityName} puedes crear tu perfil y conectar con gente cercana para chatear y conoceros, sin compensación económica.`
          : `Caperucitas te permite conocer personas según la zona en la que te encuentras. En ${cityName} puedes crear tu perfil y conectar con gente cercana para chatear y conoceros.`),
      localNote: unique?.localNote || null,
      faq: unique?.faq || [],
      emptyTitle: `¿Todavía no ves perfiles en ${cityName}?`,
      emptyText:
        `Es posible que aún no haya suficientes usuarios activos en esta zona. Puedes registrarte y aparecer cuando haya personas conectadas cerca de ti.`,
      disclaimer:
        `La sección Sexo gratis está pensada para contactos y encuentros consensuados sin compensación económica. Pedir o aceptar dinero supone expulsión permanente.`,
      nearbyTitle: `Explora otros perfiles de sexo gratis cerca de ${cityName}`,
    }
  }

  return {
    intro: unique?.escortIntro
      || (catLabel
        ? `Directorio de putas y escorts ${catLabel} en ${cityName}. Contacto directo, fotos reales y perfiles cerca de tu ubicación.`
        : `Directorio de putas y escorts en ${cityName}. Contacto directo, fotos reales y perfiles cerca de tu ubicación.`),
    localNote: unique?.localNote || null,
    faq: unique?.faq || [],
    emptyTitle: `¿Todavía no hay perfiles en ${cityName}?`,
    emptyText:
      `Puede que aún no haya anuncios activos en esta zona. Explora perfiles cercanos o publica el tuyo para aparecer en ${cityName}.`,
    disclaimer: `Contacta siempre de forma respetuosa. Verifica la información y usa el botón de denuncia si detectas irregularidades.`,
    nearbyTitle: `Explora otros perfiles cerca de ${cityName}`,
  }
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Ciudades cercanas (lista principal ~100) — sin cargar 8.000 municipios en el bundle */
export function getNearbyMunicipalities(city: SeoCity, limit = 8): SeoCity[] {
  if (city.lat == null || city.lng == null) {
    return SPANISH_CITIES.filter((c) => cityToSlug(c.name) !== city.slug)
      .slice(0, limit)
      .map((c) => ({
        name: c.name,
        slug: cityToSlug(c.name),
        lat: c.lat,
        lng: c.lng,
      }))
  }

  return [...SPANISH_CITIES]
    .filter((c) => cityToSlug(c.name) !== city.slug)
    .map((c) => ({
      name: c.name,
      slug: cityToSlug(c.name),
      lat: c.lat,
      lng: c.lng,
      dist: haversineKm(city.lat!, city.lng!, c.lat, c.lng),
    }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, limit)
    .map(({ name, slug, lat, lng }) => ({ name, slug, lat, lng }))
}

export function findMunicipalityByName(name: string): SeoCity | undefined {
  const normalized = name.toLowerCase().trim()
  const major = SPANISH_CITIES.find((c) => c.name.toLowerCase() === normalized)
  if (major) {
    return {
      name: major.name,
      slug: cityToSlug(major.name),
      lat: major.lat,
      lng: major.lng,
    }
  }
  return getCityBySlug(cityToSlug(name))
}
