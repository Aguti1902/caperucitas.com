import { useState, useEffect } from 'react'
import { MapPin, Loader2, X, Search } from 'lucide-react'
import Modal from './Modal'

interface LocationSelectorProps {
  currentCity: string
  onLocationChange: (city: string, lat: number, lng: number) => void
}

interface CityResult {
  name: string
  displayName: string
  lat: number
  lng: number
}

export default function LocationSelector({ currentCity, onLocationChange }: LocationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<CityResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Buscar ciudades cuando el usuario escribe
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        // Buscar solo en España usando Nominatim
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(searchTerm)}&` +
          `countrycodes=es&` + // Solo España
          `format=json&` +
          `addressdetails=1&` +
          `limit=10&` +
          `accept-language=es`,
          {
            headers: {
              'User-Agent': 'caperucitas.com/1.0'
            }
          }
        )

        if (response.ok) {
          const data = await response.json()
          
          // Filtrar solo ciudades/pueblos (no calles, regiones, etc)
          const cities = data
            .filter((item: any) => {
              const type = item.type
              const addressType = item.address?.city || item.address?.town || item.address?.municipality || item.address?.village
              return addressType || ['city', 'town', 'municipality', 'village', 'administrative'].includes(type)
            })
            .map((item: any) => {
              // Obtener el nombre de la ciudad
              const cityName = item.address?.city || 
                              item.address?.town || 
                              item.address?.municipality || 
                              item.address?.village ||
                              item.name

              return {
                name: cityName,
                displayName: item.display_name,
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon)
              }
            })
            // Eliminar duplicados por nombre
            .filter((city: CityResult, index: number, self: CityResult[]) => 
              index === self.findIndex(c => c.name === city.name)
            )

          setSearchResults(cities)
        }
      } catch (error) {
        console.error('Error al buscar ciudades:', error)
      } finally {
        setIsSearching(false)
      }
    }, 500) // Esperar 500ms después de que el usuario deje de escribir

    return () => clearTimeout(timer)
  }, [searchTerm])

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización')
      return
    }

    setIsGettingLocation(true)
    setIsOpen(false) // Cerrar el modal inmediatamente
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords
        
        console.log(`📍 Ubicación obtenida: ${latitude}, ${longitude} (precisión: ${accuracy}m)`)
        
        try {
          // Usar geocodificación inversa para obtener la ciudad exacta
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=es`,
            {
              headers: {
                'User-Agent': 'caperucitas.com/1.0'
              }
            }
          )
          
          if (response.ok) {
            const data = await response.json()
            const address = data.address
            
            // Intentar obtener la ciudad de diferentes campos
            const cityName = address.city || 
                          address.town || 
                          address.municipality || 
                          address.village ||
                          address.county ||
                          address.state_district ||
                          'Ubicación desconocida'
            
            console.log(`✅ Ciudad detectada: ${cityName}`)
            
            onLocationChange(cityName, latitude, longitude)
          } else {
            throw new Error('Error en geocodificación')
          }
        } catch (error) {
          console.error('Error en geocodificación inversa:', error)
          alert('No se pudo determinar tu ciudad. Por favor, búscala manualmente.')
        } finally {
          setIsGettingLocation(false)
        }
      },
      (error) => {
        console.error('Error de geolocalización:', error)
        alert('No se pudo obtener tu ubicación. Por favor, permite el acceso a tu ubicación.')
        setIsGettingLocation(false)
      },
      {
        enableHighAccuracy: true, // Máxima precisión usando GPS
        timeout: 30000, // 30 segundos para obtener ubicación precisa
        maximumAge: 0, // No usar ubicación en caché, siempre obtener nueva
      }
    )
  }

  const handleSelectCity = (city: CityResult) => {
    onLocationChange(city.name, city.lat, city.lng)
    setIsOpen(false)
    setSearchTerm('')
    setSearchResults([])
  }

  return (
    <>
      {/* Botón selector de ubicación - UN SOLO BOTÓN */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-full transition-colors min-w-0 flex-shrink-0"
        title="Cambiar ubicación"
      >
        <MapPin className="w-4 h-4 text-white flex-shrink-0" />
        <span className="text-white text-sm font-medium truncate hidden sm:inline">
          {currentCity}
        </span>
        <span className="text-white text-xs font-medium truncate sm:hidden">
          {currentCity}
        </span>
      </button>

      {/* Modal de selección */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Cambiar ubicación">
        <div className="space-y-4">
          {/* Botón de geolocalización automática */}
          <button
            onClick={handleGetCurrentLocation}
            disabled={isGettingLocation}
            className="w-full bg-primary hover:bg-primary/90 disabled:bg-gray-700 text-white py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-3 font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            {isGettingLocation ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Obteniendo ubicación...</span>
              </>
            ) : (
              <>
                <MapPin className="w-6 h-6" />
                <span>Usar mi ubicación actual</span>
              </>
            )}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-900 text-gray-400">o busca tu ciudad</span>
            </div>
          </div>

          {/* Buscador de ciudades */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar ciudad en España..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 pr-10"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSearchResults([])
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Resultados de búsqueda */}
          {isSearching && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-gray-400 mt-2">Buscando ciudades...</p>
            </div>
          )}

          {!isSearching && searchTerm.length >= 2 && searchResults.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-400">No se encontraron ciudades</p>
              <p className="text-gray-500 text-sm mt-1">Intenta con otro nombre</p>
            </div>
          )}

          {!isSearching && searchResults.length > 0 && (
            <div className="max-h-96 overflow-y-auto space-y-2">
              {searchResults.map((city, index) => (
                <button
                  key={`${city.name}-${index}`}
                  onClick={() => handleSelectCity(city)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    city.name === currentCity
                      ? 'bg-primary text-white'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{city.name}</div>
                      <div className="text-xs text-gray-400 truncate mt-0.5">
                        {city.displayName}
                      </div>
                    </div>
                    {city.name === currentCity && (
                      <span className="flex-shrink-0 text-xs bg-white/20 px-2 py-1 rounded">
                        Actual
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {!isSearching && searchTerm.length < 2 && (
            <div className="text-center py-8">
              <Search className="w-12 h-12 mx-auto text-gray-600 mb-3" />
              <p className="text-gray-400">Escribe al menos 2 letras para buscar</p>
              <p className="text-gray-500 text-sm mt-1">Ejemplo: Madrid, Barcelona, Valencia...</p>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}

