import { SPANISH_CITIES } from '@/data/spanishCities'

export interface LocationResult {
  city: string
  latitude: number
  longitude: number
}

/** Encuentra la ciudad española más cercana a unas coordenadas */
function closestCity(lat: number, lng: number): LocationResult {
  const closest = SPANISH_CITIES.reduce((prev, city) => {
    const d = Math.hypot(city.lat - lat, city.lng - lng)
    const pd = Math.hypot(prev.lat - lat, prev.lng - lng)
    return d < pd ? city : prev
  })
  return { city: closest.name, latitude: lat, longitude: lng }
}

/** Convierte coordenadas a nombre de ciudad usando Nominatim */
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=es`,
      { headers: { 'User-Agent': 'caperucitas.com/1.0' }, signal: AbortSignal.timeout(5000) }
    )
    if (!res.ok) return null
    const data = await res.json()
    const a = data.address
    const raw = a.city || a.town || a.municipality || a.village || a.county || ''
    if (!raw) return null
    const normalized = raw
      .split(' ')
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
    // Buscar en lista española o devolver el nombre real
    const match = SPANISH_CITIES.find(c => c.name.toLowerCase() === normalized.toLowerCase())
    return match ? match.name : normalized
  } catch {
    return null
  }
}

/** Fallback: geolocalización por IP usando ipapi.co */
async function geolocateByIP(): Promise<LocationResult | null> {
  try {
    const res = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(5000)
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data.latitude || !data.longitude) return null
    const lat = parseFloat(data.latitude)
    const lng = parseFloat(data.longitude)
    const cityName = data.city || null
    // Buscar en lista española
    const match = cityName
      ? SPANISH_CITIES.find(c => c.name.toLowerCase() === cityName.toLowerCase())
      : null
    if (match) return { city: match.name, latitude: lat, longitude: lng }
    return closestCity(lat, lng)
  } catch {
    return null
  }
}

/**
 * Obtiene la ubicación del usuario con múltiples fallbacks:
 * 1. navigator.geolocation con baja precisión (WiFi/celda) — funciona en iOS sin GPS
 * 2. Geolocalización por IP (ipapi.co)
 * 3. Madrid como último recurso
 */
export async function detectLocation(): Promise<LocationResult> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      geolocateByIP().then(r => resolve(r ?? { city: 'Madrid', latitude: 40.4168, longitude: -3.7038 }))
      return
    }

    // Usar LOW accuracy (WiFi/celda): evita kCLErrorLocationUnknown en iOS
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const cityName = await reverseGeocode(latitude, longitude)
        if (cityName) {
          resolve({ city: cityName, latitude, longitude })
        } else {
          resolve(closestCity(latitude, longitude))
        }
      },
      async () => {
        // Permisos denegados o error — intentar por IP
        const ipResult = await geolocateByIP()
        resolve(ipResult ?? { city: 'Madrid', latitude: 40.4168, longitude: -3.7038 })
      },
      {
        enableHighAccuracy: false, // LOW accuracy: WiFi/celda, funciona en iOS
        timeout: 10000,
        maximumAge: 300000,        // Acepta posición cacheada de hasta 5 min
      }
    )
  })
}
