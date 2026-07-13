import { cityToSlug, findMunicipalityByName, getCityPath, type SeoSection } from './citySeo'

const NOMINATIM_HEADERS = { 'User-Agent': 'Caperucitas/1.0 (SEO local España)' }

/** Geocodifica inversa: lat/lng → municipio español → ruta SEO */
export async function resolveCityFromCoords(
  lat: number,
  lng: number,
  section: SeoSection = 'escort'
): Promise<{ path: string; name: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=es`
    const res = await fetch(url, { headers: NOMINATIM_HEADERS })
    const data = await res.json()
    const addr = data.address || {}

    const candidates = [
      addr.city,
      addr.town,
      addr.village,
      addr.municipality,
      addr.county,
    ].filter(Boolean) as string[]

    for (const candidate of candidates) {
      const match = findMunicipalityByName(candidate)
      if (match) {
        return { path: getCityPath(section, match), name: match.name }
      }
    }

    // Fallback: slug desde el nombre que devuelve Nominatim
    const fallbackName = candidates[0]
    if (fallbackName) {
      const slug = cityToSlug(fallbackName)
      return {
        path: section === 'sexo_gratis' ? `/sexo-gratis/${slug}` : `/putas/${slug}`,
        name: fallbackName,
      }
    }
  } catch {
    /* sin red */
  }
  return null
}
