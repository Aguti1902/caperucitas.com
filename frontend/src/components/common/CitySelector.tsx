import { useState, useRef, useEffect } from 'react'
import { SPANISH_CITIES } from '@/data/spanishCities'

interface CitySelectorProps {
  value: string
  onChange: (city: string, lat: number, lng: number) => void
  onDetect?: () => void
  isDetecting?: boolean
  locationError?: string
}

export default function CitySelector({ value, onChange, onDetect, isDetecting, locationError }: CitySelectorProps) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Mostrar todas si no hay búsqueda, o filtradas si hay texto
  const displayed = search.length > 0
    ? SPANISH_CITIES.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : SPANISH_CITIES

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSelect = (cityName: string) => {
    const city = SPANISH_CITIES.find(c => c.name === cityName)
    if (city) {
      onChange(city.name, city.lat, city.lng)
      setSearch('')
      setOpen(false)
    }
  }

  return (
    <div>
      {locationError && <p className="text-yellow-400 text-xs mb-2">{locationError}</p>}
      <div ref={ref} className="relative flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Busca o selecciona tu ciudad..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setOpen(true)}
            className="input-field w-full"
            autoComplete="off"
          />

          {open && (
            <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
              {displayed.length === 0 ? (
                <p className="text-gray-400 text-sm px-4 py-3">Sin resultados</p>
              ) : (
                displayed.map(city => (
                  <button
                    key={city.name}
                    type="button"
                    onMouseDown={() => handleSelect(city.name)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-700 last:border-0 ${
                      value === city.name
                        ? 'bg-red-600/30 text-white font-semibold'
                        : 'text-gray-200 hover:bg-gray-700'
                    }`}
                  >
                    📍 {city.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {onDetect && (
          <button
            type="button"
            onClick={onDetect}
            disabled={isDetecting}
            className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white px-3 rounded-lg text-sm transition-colors"
            title="Detectar ubicación automáticamente"
          >
            {isDetecting ? <span className="animate-spin inline-block">⟳</span> : '📍'}
          </button>
        )}
      </div>

      {value && (
        <p className="text-green-400 text-xs mt-1">✓ Ciudad seleccionada: <strong>{value}</strong></p>
      )}
    </div>
  )
}
