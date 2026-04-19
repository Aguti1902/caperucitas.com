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
      { headers: { 'User-Agent': 'caperucitas.com/1.0' }, signal: AbortSignal.timeout(6000) }
    )
    if (!res.ok) return null
    const data = await res.json()
    const a = data.address
    const raw = a.city || a.town || a.municipality || a.village || a.county || ''
    if (!raw) return null
    const normalized = raw.charAt(0).toUpperCase() + raw.slice(1)
    // Si está en la lista, devolver el nombre exacto; si no, devolver el nombre real
    const match = SPANISH_CITIES.find(c => c.name.toLowerCase() === normalized.toLowerCase())
    return match ? match.name : normalized
  } catch {
    return null
  }
}

/** Obtiene lat/lng por IP usando ipapi.co */
async function ipApiCo(): Promise<{ lat: number; lng: number; city: string | null } | null> {
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    const data = await res.json()
    if (!data.latitude || !data.longitude) return null
    return { lat: parseFloat(data.latitude), lng: parseFloat(data.longitude), city: data.city || null }
  } catch {
    return null
  }
}

/** Obtiene lat/lng por IP usando ipwho.is (alternativa si ipapi.co falla) */
async function ipWhoIs(): Promise<{ lat: number; lng: number; city: string | null } | null> {
  try {
    const res = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    const data = await res.json()
    if (!data.latitude || !data.longitude || !data.success) return null
    return { lat: data.latitude, lng: data.longitude, city: data.city || null }
  } catch {
    return null
  }
}

/** Geolocalización por IP: prueba varios servicios */
async function geolocateByIP(): Promise<LocationResult | null> {
  // Intentar varios servicios en orden
  const result = await ipApiCo() ?? await ipWhoIs()
  if (!result) return null

  const { lat, lng, city: cityName } = result

  // Intentar hacer match con la lista española
  if (cityName) {
    const match = SPANISH_CITIES.find(c => c.name.toLowerCase() === cityName.toLowerCase())
    if (match) return { city: match.name, latitude: lat, longitude: lng }
  }

  // Usar Nominatim para geocodificación inversa
  const geocoded = await reverseGeocode(lat, lng)
  if (geocoded) return { city: geocoded, latitude: lat, longitude: lng }

  // Fallback: ciudad más cercana de la lista
  return closestCity(lat, lng)
}

/**
 * Obtiene la ubicación del usuario con múltiples fallbacks:
 * 1. navigator.geolocation (WiFi/cell, enableHighAccuracy:false — funciona en iOS)
 * 2. Geolocalización por IP (ipapi.co → ipwho.is)
 * 3. Madrid como último recurso
 */
export async function detectLocation(): Promise<LocationResult> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      geolocateByIP().then(r => resolve(r ?? { city: 'Madrid', latitude: 40.4168, longitude: -3.7038 }))
      return
    }

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
        // Geolocation fallida (permiso denegado / iOS error) — intentar por IP
        const ipResult = await geolocateByIP()
        resolve(ipResult ?? { city: 'Madrid', latitude: 40.4168, longitude: -3.7038 })
      },
      {
        enableHighAccuracy: false, // LOW accuracy: WiFi/celda, evita kCLErrorLocationUnknown en iOS
        timeout: 8000,
        maximumAge: 300000,        // Acepta posición cacheada de hasta 5 min
      }
    )
  })
}
