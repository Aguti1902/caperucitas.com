import { useState, useRef, useEffect } from 'react'

interface NominatimResult {
  place_id: number
  display_name: string
  name: string
  lat: string
  lon: string
  address?: {
    city?: string
    town?: string
    village?: string
    municipality?: string
    county?: string
    state?: string
  }
}

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
  placeholder = 'Calle, número, ciudad...',
}: CitySelectorProps) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<NominatimResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Buscar con Nominatim cuando cambia el texto
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (search.length < 3) {
      setResults([])
      setOpen(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&countrycodes=es&format=json&limit=8&addressdetails=1`
        const res = await fetch(url, {
          headers: { 'Accept-Language': 'es' },
        })
        const data: NominatimResult[] = await res.json()
        setResults(data)
        setOpen(data.length > 0)
      } catch {
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }, 400)
  }, [search])

  const extractPlaceName = (result: NominatimResult): string => {
    const a = result.address
    return (
      a?.city ||
      a?.town ||
      a?.village ||
      a?.municipality ||
      a?.county ||
      result.name ||
      result.display_name.split(',')[0]
    )
  }

  const handleSelect = (result: NominatimResult) => {
    const placeName = extractPlaceName(result)
    onChange(placeName, parseFloat(result.lat), parseFloat(result.lon))
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

          {/* Spinner de búsqueda */}
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <span className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin inline-block" />
            </div>
          )}

          {/* Dropdown de resultados */}
          {open && results.length > 0 && (
            <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-64 overflow-y-auto">
              {results.map(result => (
                <button
                  key={result.place_id}
                  type="button"
                  onMouseDown={() => handleSelect(result)}
                  className="w-full text-left px-4 py-3 text-sm transition-colors border-b border-gray-700 last:border-0 hover:bg-gray-700"
                >
                  <p className="text-white font-semibold">
                    📍 {extractPlaceName(result)}
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5 truncate">
                    {result.display_name}
                  </p>
                </button>
              ))}
            </div>
          )}

          {/* Sin resultados */}
          {open && !isSearching && results.length === 0 && search.length >= 3 && (
            <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-gray-800 border border-gray-600 rounded-lg shadow-xl">
              <p className="text-gray-400 text-sm px-4 py-3">Sin resultados para "{search}"</p>
            </div>
          )}
        </div>

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

      {/* Ubicación actual seleccionada */}
      {value && (
        <p className="text-green-400 text-xs mt-1">
          ✓ Ubicación: <strong>{value}</strong>
        </p>
      )}

      {/* Hint */}
      {!value && (
        <p className="text-gray-500 text-xs mt-1">
          Escribe al menos 3 letras para buscar cualquier dirección en España
        </p>
      )}
    </div>
  )
}
