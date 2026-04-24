import { useState, useRef, useEffect } from 'react'

/* ------------------------------------------------------------------ */
/*  Tipos                                                               */
/* ------------------------------------------------------------------ */

interface PhotonFeature {
  geometry: { coordinates: [number, number] }
  properties: {
    name?: string
    street?: string
    housenumber?: string
    city?: string
    town?: string
    village?: string
    municipality?: string
    county?: string
    state?: string
    postcode?: string
    country?: string
  }
}

interface PlaceResult {
  id: string
  label: string      // línea principal (calle + número, o nombre del lugar)
  sublabel: string   // línea secundaria (ciudad, provincia)
  city: string       // valor que se guarda en el perfil
  lat: number
  lng: number
}

/* ------------------------------------------------------------------ */
/*  Utilidades                                                          */
/* ------------------------------------------------------------------ */

/** Bounding box de España peninsular + islas */
const SPAIN_BBOX = '-18.2,27.6,4.4,43.8'

function extractCity(p: PhotonFeature['properties']): string {
  return (
    p.city ||
    p.town ||
    p.village ||
    p.municipality ||
    p.county ||
    p.state ||
    ''
  )
}

function buildLabel(p: PhotonFeature['properties']): string {
  if (p.street) {
    const parts = [p.street]
    if (p.housenumber) parts.push(p.housenumber)
    return parts.join(', ')
  }
  return p.name || ''
}

function buildSublabel(p: PhotonFeature['properties'], city: string): string {
  const parts: string[] = []
  if (city && city !== p.name) parts.push(city)
  if (p.state && p.state !== city) parts.push(p.state)
  if (p.postcode) parts.push(p.postcode)
  return parts.join(' · ')
}

function photonToResults(features: PhotonFeature[]): PlaceResult[] {
  return features
    .filter(f => f.properties.country?.toLowerCase().includes('españa') || f.properties.country?.toLowerCase().includes('spain'))
    .map((f, i) => {
      const p = f.properties
      const city = extractCity(p)
      const label = buildLabel(p) || city
      return {
        id: `${i}-${f.geometry.coordinates.join(',')}`,
        label,
        sublabel: buildSublabel(p, city),
        city,
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
      }
    })
}

/* ------------------------------------------------------------------ */
/*  Componente                                                          */
/* ------------------------------------------------------------------ */

interface CitySelectorProps {
  value: string
  onChange: (city: string, lat: number, lng: number) => void
  onDetect?: () => void
  isDetecting?: boolean
  locationError?: string
  placeholder?: string
}

export default function CitySelector({
  value,
  onChange,
  onDetect,
  isDetecting,
  locationError,
  placeholder = 'Calle, número, ciudad, municipio...',
}: CitySelectorProps) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<PlaceResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* Cerrar dropdown al hacer clic fuera */
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  /* Buscar con debounce */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (search.trim().length < 3) {
      setResults([])
      setOpen(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        /* Photon — rápido, cubre calles y portales de España */
        const photonUrl =
          `https://photon.komoot.io/api/?` +
          `q=${encodeURIComponent(search)}` +
          `&lang=es&limit=10` +
          `&bbox=${SPAIN_BBOX}`

        const res = await fetch(photonUrl, {
          headers: { 'Accept-Language': 'es' },
        })
        const data = await res.json()
        const places = photonToResults(data.features || [])

        if (places.length > 0) {
          setResults(places)
          setOpen(true)
        } else {
          /* Fallback: Nominatim si Photon no devuelve resultados */
          const nomUrl =
            `https://nominatim.openstreetmap.org/search?` +
            `q=${encodeURIComponent(search)}` +
            `&countrycodes=es&format=json&limit=8&addressdetails=1`

          const nomRes = await fetch(nomUrl, {
            headers: { 'Accept-Language': 'es' },
          })
          const nomData = await nomRes.json()

          interface NomResult {
            place_id: number
            display_name: string
            lat: string
            lon: string
            address?: {
              city?: string; town?: string; village?: string
              municipality?: string; county?: string; state?: string
              road?: string; house_number?: string; postcode?: string
            }
          }

          const nomPlaces: PlaceResult[] = (nomData as NomResult[]).map((r) => {
            const a = r.address || {}
            const city = a.city || a.town || a.village || a.municipality || a.county || ''
            const street = a.road
              ? `${a.road}${a.house_number ? ' ' + a.house_number : ''}`
              : r.display_name.split(',')[0]
            return {
              id: String(r.place_id),
              label: street,
              sublabel: [city, a.state, a.postcode].filter(Boolean).join(' · '),
              city,
              lat: parseFloat(r.lat),
              lng: parseFloat(r.lon),
            }
          })
          setResults(nomPlaces)
          setOpen(nomPlaces.length > 0)
        }
      } catch {
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }, 400)
  }, [search])

  const handleSelect = (place: PlaceResult) => {
    onChange(place.city || place.label, place.lat, place.lng)
    setSearch('')
    setResults([])
    setOpen(false)
  }

  return (
    <div>
      {locationError && (
        <p className="text-yellow-400 text-xs mb-2">{locationError}</p>
      )}

      <div ref={ref} className="relative flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={placeholder}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            className="input-field w-full"
            autoComplete="off"
          />

          {/* Spinner */}
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <span className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin inline-block" />
            </div>
          )}

          {/* Dropdown */}
          {open && results.length > 0 && (
            <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-72 overflow-y-auto">
              {results.map(place => (
                <button
                  key={place.id}
                  type="button"
                  onMouseDown={() => handleSelect(place)}
                  className="w-full text-left px-4 py-3 transition-colors border-b border-gray-700 last:border-0 hover:bg-gray-700"
                >
                  <p className="text-white text-sm font-semibold leading-tight">
                    📍 {place.label}
                  </p>
                  {place.sublabel ? (
                    <p className="text-gray-400 text-xs mt-0.5">{place.sublabel}</p>
                  ) : null}
                </button>
              ))}
            </div>
          )}

          {/* Sin resultados */}
          {open && !isSearching && results.length === 0 && search.trim().length >= 3 && (
            <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-gray-800 border border-gray-600 rounded-lg shadow-xl">
              <p className="text-gray-400 text-sm px-4 py-3">
                Sin resultados para "<span className="text-white">{search}</span>"
              </p>
            </div>
          )}
        </div>

        {/* Botón detectar automáticamente */}
        {onDetect && (
          <button
            type="button"
            onClick={onDetect}
            disabled={isDetecting}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap shadow-lg shadow-red-900/30"
            title="Detectar ubicación automáticamente"
          >
            {isDetecting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                <span>Detectando...</span>
              </>
            ) : (
              <>
                <span>📍</span>
                <span>Detectar</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Ciudad seleccionada actualmente */}
      {value && (
        <p className="text-green-400 text-xs mt-1.5">
          ✓ Ubicación guardada: <strong>{value}</strong>
        </p>
      )}

      {/* Hint */}
      {!value && (
        <p className="text-gray-500 text-xs mt-1">
          Escribe al menos 3 letras — calles, barrios, municipios, provincias...
        </p>
      )}
    </div>
  )
}
