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

  const filtered = search.length > 0
    ? SPANISH_CITIES.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).slice(0, 8)
    : []

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
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
            placeholder={value || 'Busca tu ciudad...'}
            value={search}
            onChange={e => { setSearch(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            className="input-field w-full pr-8"
          />
          {value && !search && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 text-xs pointer-events-none">✓</span>
          )}
          {open && filtered.length > 0 && (
            <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-56 overflow-y-auto">
              {filtered.map(city => (
                <button
                  key={city.name}
                  type="button"
                  onMouseDown={() => handleSelect(city.name)}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-0"
                >
                  📍 {city.name}
                </button>
              ))}
            </div>
          )}
        </div>
        {onDetect && (
          <button
            type="button"
            onClick={onDetect}
            disabled={isDetecting}
            className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white px-3 rounded-lg text-sm transition-colors flex items-center gap-1"
            title="Detectar automáticamente"
          >
            {isDetecting ? (
              <span className="animate-spin text-xs">⟳</span>
            ) : '📍'}
          </button>
        )}
      </div>
      {value && (
        <p className="text-green-400 text-xs mt-1">✓ Ciudad seleccionada: <strong>{value}</strong></p>
      )}
    </div>
  )
}
