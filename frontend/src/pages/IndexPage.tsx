import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '@/components/common/Logo'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { api } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { MapPin, Search, Phone, MessageCircle, Zap, Share2, Info, Home, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { SPANISH_CITIES } from '@/data/spanishCities'

const GENDER_LABELS: Record<string, { label: string; color: string }> = {
  chica: { label: 'Chica', color: 'bg-pink-600' },
  chico: { label: 'Chico', color: 'bg-blue-600' },
  trans: { label: 'Trans', color: 'bg-purple-600' },
  casa: { label: 'Casa/Piso', color: 'bg-orange-600' },
  gay: { label: 'Gay', color: 'bg-green-600' },
  masajes: { label: 'Masajes', color: 'bg-teal-600' },
}

const GENDER_FILTERS = [
  { id: 'all', label: 'Todas' },
  { id: 'chica', label: 'Chicas' },
  { id: 'chico', label: 'Chicos' },
  { id: 'trans', label: 'Trans' },
  { id: 'gay', label: 'Gay' },
  { id: 'masajes', label: 'Masajes' },
  { id: 'casa', label: 'Casas/Pisos' },
]


/** Haversine: distancia en km entre dos puntos lat/lng */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function IndexPage() {
  const navigate = useNavigate()
  const { isAuthenticated, hasProfile } = useAuthStore()
  const [profiles, setProfiles] = useState<any[]>([])
  const [roamProfiles, setRoamProfiles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedGender, setSelectedGender] = useState('all')
  const [citySearch, setCitySearch] = useState('')
  const [showCityModal, setShowCityModal] = useState(false)
  const [modalSearch, setModalSearch] = useState('')
  const [isDetectingModal, setIsDetectingModal] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  const modalSuggestions = modalSearch.length >= 2
    ? SPANISH_CITIES.filter(c => c.name.toLowerCase().includes(modalSearch.toLowerCase())).slice(0, 10)
    : []

  // Detectar ubicación del usuario silenciosamente al cargar
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        async () => {
          try {
            const r = await fetch('https://ipapi.co/json/')
            const d = await r.json()
            if (d.latitude && d.longitude) setUserLocation({ lat: d.latitude, lng: d.longitude })
          } catch { /* sin ubicación */ }
        },
        { enableHighAccuracy: false, timeout: 6000, maximumAge: 5 * 60 * 1000 }
      )
    }
  }, [])

  const handleUseMyLocation = () => {
    setIsDetectingModal(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        setUserLocation({ lat: latitude, lng: longitude })
        // Buscar ciudad más cercana
        const closest = SPANISH_CITIES.reduce((prev, city) => {
          const d = Math.hypot(city.lat - latitude, city.lng - longitude)
          const pd = Math.hypot(prev.lat - latitude, prev.lng - longitude)
          return d < pd ? city : prev
        })
        setCitySearch(closest.name)
        setIsDetectingModal(false)
        setShowCityModal(false)
      },
      async () => {
        try {
          const r = await fetch('https://ipapi.co/json/')
          const d = await r.json()
          if (d.latitude && d.longitude) {
            setUserLocation({ lat: d.latitude, lng: d.longitude })
            const closest = SPANISH_CITIES.reduce((prev, city) => {
              const dist = Math.hypot(city.lat - d.latitude, city.lng - d.longitude)
              const pdist = Math.hypot(prev.lat - d.latitude, prev.lng - d.longitude)
              return dist < pdist ? city : prev
            })
            setCitySearch(closest.name)
          }
        } catch { /* sin ciudad */ }
        setIsDetectingModal(false)
        setShowCityModal(false)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }
  const [searchQuery, setSearchQuery] = useState('')
  const [minAge, setMinAge] = useState('')
  const [maxAge, setMaxAge] = useState('')
  const [showAgeFilter, setShowAgeFilter] = useState(false)
  const roamRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const [headerHeight, setHeaderHeight] = useState(0)

  useEffect(() => {
    loadProfiles()
  }, [selectedGender])

  // citySearch es solo referencia visual — no filtra el backend

  // Mide el alto real del header y lo actualiza cuando cambia (filtro edad abierto/cerrado)
  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      setHeaderHeight(el.offsetHeight)
    })
    observer.observe(el)
    setHeaderHeight(el.offsetHeight)
    return () => observer.disconnect()
  }, [])

  const sortByDistance = (list: any[], loc: { lat: number; lng: number } | null) => {
    if (!loc) return list
    return [...list].sort((a, b) => {
      const hasA = a.latitude != null && a.longitude != null && !a.showExactLocation === false
      const hasB = b.latitude != null && b.longitude != null && !b.showExactLocation === false
      if (!hasA && !hasB) return 0
      if (!hasA) return 1
      if (!hasB) return -1
      return haversineKm(loc.lat, loc.lng, a.latitude, a.longitude) -
             haversineKm(loc.lat, loc.lng, b.latitude, b.longitude)
    })
  }

  const loadProfiles = async (loc?: { lat: number; lng: number } | null) => {
    setIsLoading(true)
    try {
      // No filtramos por ciudad en backend — siempre cargamos todos y ordenamos por distancia
      const params: any = { filter: 'all', limit: 100 }
      if (selectedGender !== 'all') params.gender = selectedGender

      const response = await api.get('/profile/public-search', { params })
      const all = response.data.profiles.filter(
        (p: any, i: number, self: any[]) => i === self.findIndex((x) => x.id === p.id)
      )
      const currentLoc = loc !== undefined ? loc : userLocation
      const sorted = sortByDistance(all, currentLoc)
      setProfiles(sorted)
      setRoamProfiles(sorted.filter((p: any) => p.isRoaming))
    } catch {
      setProfiles([])
    } finally {
      setIsLoading(false)
    }
  }

  // Reordenar perfiles existentes cuando se obtiene la ubicación del usuario
  useEffect(() => {
    if (userLocation && profiles.length > 0) {
      setProfiles(prev => sortByDistance(prev, userLocation))
      setRoamProfiles(prev => sortByDistance(prev, userLocation))
    }
  }, [userLocation])

  const filteredProfiles = profiles.filter((p) => {
    if (searchQuery && !p.title?.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (minAge && p.age < parseInt(minAge)) return false
    if (maxAge && p.age > parseInt(maxAge)) return false
    return true
  })

  const handleProfileClick = (profileId: string, index: number) => {
    sessionStorage.setItem('browseProfiles', JSON.stringify(filteredProfiles.map(p => p.id)))
    sessionStorage.setItem('browseIndex', String(index))
    navigate(`/profile/${profileId}`)
  }

  const handleEscortAccess = () => {
    if (isAuthenticated && hasProfile) navigate('/edit-profile')
    else if (isAuthenticated) navigate('/create-profile')
    else navigate('/register')
  }

  const handleShare = () => {
    const msg = encodeURIComponent('Hola, mira esta web brutal para adultos donde encontrarás compañía cerca de ti: caperucitas.com, discreta, directa y sin rodeos.')
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  const scrollRoam = (dir: 'left' | 'right') => {
    if (roamRef.current) {
      roamRef.current.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header — fixed para que nunca tape el contenido */}
      <header ref={headerRef} className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur border-b border-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 flex items-center justify-between h-14">
          <Logo size="sm" />
          <button
            onClick={handleEscortAccess}
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
          >
            {isAuthenticated && hasProfile ? 'Mi Perfil' : 'Mi Perfil'}
          </button>
        </div>

        {/* Barra ciudad + edad + compartir */}
        <div className="border-t border-gray-800 px-3 py-2">
          <div className="max-w-7xl mx-auto flex items-center gap-2 flex-wrap">
            {/* Botón ciudad — abre modal */}
            <button
              onClick={() => { setModalSearch(''); setShowCityModal(true) }}
              className="flex-1 min-w-[130px] max-w-[220px] flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 rounded-full px-3 py-1.5 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              <span className={`text-sm truncate ${citySearch ? 'text-white font-medium' : 'text-gray-400'}`}>
                {citySearch || 'Ciudad...'}
              </span>
              {citySearch && (
                <span
                  role="button"
                  onClick={(e) => { e.stopPropagation(); setCitySearch('') }}
                  className="ml-auto text-gray-400 hover:text-white flex-shrink-0"
                >
                  <X className="w-3 h-3" />
                </span>
              )}
            </button>
            {/* Edad */}
            <button
              onClick={() => setShowAgeFilter(v => !v)}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${showAgeFilter || minAge || maxAge ? 'bg-yellow-500 text-gray-900' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
            >
              EDAD {minAge || maxAge ? `${minAge||'0'}-${maxAge||'99'}` : ''}
            </button>
            {/* Compartir */}
            <button
              onClick={handleShare}
              className="flex-shrink-0 p-2 rounded-full bg-[#25D366] text-white hover:bg-[#1ebe5d] transition-colors"
              title="Compartir en WhatsApp"
            >
              <Share2 className="w-4 h-4" />
            </button>
            {/* Búsqueda texto */}
            <div className="flex items-center bg-gray-800 rounded-full px-3 py-1.5 flex-1 min-w-[100px]">
              <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-white text-sm pl-2 focus:outline-none w-full"
              />
            </div>
          </div>
          {/* Filtro edad expandible */}
          {showAgeFilter && (
            <div className="max-w-7xl mx-auto flex items-center gap-3 pt-2">
              <span className="text-gray-400 text-xs">Edad entre:</span>
              <input
                type="number"
                placeholder="Min"
                min={18} max={99}
                value={minAge}
                onChange={(e) => setMinAge(e.target.value)}
                className="w-16 bg-gray-800 text-white text-sm rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <span className="text-gray-400 text-xs">y</span>
              <input
                type="number"
                placeholder="Max"
                min={18} max={99}
                value={maxAge}
                onChange={(e) => setMaxAge(e.target.value)}
                className="w-16 bg-gray-800 text-white text-sm rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              {(minAge || maxAge) && (
                <button onClick={() => { setMinAge(''); setMaxAge('') }} className="text-gray-400 hover:text-white text-xs">Limpiar</button>
              )}
            </div>
          )}
        </div>

        {/* Filtros de género */}
        <div className="border-t border-gray-800 px-3 py-2">
          <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
            {GENDER_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedGender(f.id)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  selectedGender === f.id ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Modal de búsqueda de ciudad */}
      {showCityModal && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
          {/* Fondo oscuro */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCityModal(false)} />

          {/* Panel */}
          <div className="relative w-full max-w-md mx-auto bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
            {/* Cabecera */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <h2 className="text-white font-bold text-lg">Cambiar ubicación</h2>
              <button onClick={() => setShowCityModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Botón usar mi ubicación */}
              <button
                onClick={handleUseMyLocation}
                disabled={isDetectingModal}
                className="w-full flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold text-base py-4 rounded-xl transition-all active:scale-95"
              >
                {isDetectingModal ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Detectando...
                  </>
                ) : (
                  <>
                    <MapPin className="w-5 h-5" />
                    Usar mi ubicación actual
                  </>
                )}
              </button>

              {/* Separador */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-700" />
                <span className="text-gray-500 text-xs">o busca tu ciudad</span>
                <div className="flex-1 h-px bg-gray-700" />
              </div>

              {/* Input búsqueda */}
              <div className="flex items-center gap-2 bg-gray-800 rounded-xl px-4 py-3 border border-gray-700 focus-within:border-red-500 transition-colors">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar ciudad en España..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  autoFocus
                  className="bg-transparent text-white text-sm focus:outline-none w-full placeholder-gray-500"
                  autoComplete="off"
                />
                {modalSearch && (
                  <button onClick={() => setModalSearch('')} className="text-gray-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Resultados */}
              <div className="max-h-64 overflow-y-auto rounded-xl">
                {modalSearch.length < 2 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2 text-gray-500">
                    <Search className="w-10 h-10 opacity-30" />
                    <p className="text-sm font-medium">Escribe al menos 2 letras para buscar</p>
                    <p className="text-xs opacity-60">Ejemplo: Madrid, Barcelona, Valencia...</p>
                  </div>
                ) : modalSuggestions.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm py-6">Sin resultados para "{modalSearch}"</p>
                ) : (
                  <div className="space-y-0.5">
                    {modalSuggestions.map(city => (
                      <button
                        key={city.name}
                        onClick={() => {
                          setCitySearch(city.name)
                          // Actualizar punto de referencia de distancia con las coords de la ciudad
                          setUserLocation({ lat: city.lat, lng: city.lng })
                          setShowCityModal(false)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-gray-800 rounded-xl transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <span className="text-sm font-medium">{city.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Espaciador dinámico — empuja el contenido justo debajo del header fixed */}
      <div style={{ paddingTop: headerHeight }} />

      {/* Banner principal — justo debajo del header, sin márgenes */}
      <a href="/" className="w-full block overflow-hidden">
        <img
          src="/logo-caperucitas.jpeg"
          alt="Caperucitas.com"
          className="w-full block"
          style={{ height: 'auto', maxHeight: 'none', display: 'block' }}
        />
      </a>

      <main className="max-w-7xl mx-auto px-3 py-4 space-y-6">

        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            {/* Sección ROAM */}
            {roamProfiles.length > 0 && (
              <section>
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-3 mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-gray-900" fill="currentColor" strokeWidth={0} />
                    <div>
                      <span className="text-gray-900 font-black text-lg tracking-wide">PERFILES ROAM</span>
                      <span className="text-gray-800 text-xs ml-2">(CARRUSEL)</span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/roam')}
                    className="bg-gray-900/30 hover:bg-gray-900/50 text-gray-900 text-xs font-bold px-3 py-1 rounded-full transition-colors"
                  >
                    ¿Qué es ROAM?
                  </button>
                </div>
                <p className="text-gray-400 text-xs mb-3 px-1">
                  ⚡ Activa ROAM y aparece en las primeras posiciones de tu ciudad y alrededores
                </p>
                <div className="relative">
                  <button
                    onClick={() => scrollRoam('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gray-900/80 hover:bg-gray-800 text-white rounded-full p-1.5 shadow-lg -ml-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div
                    ref={roamRef}
                    className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth pb-2"
                  >
                    {roamProfiles.map((profile, index) => (
                      <div key={profile.id} className="flex-shrink-0 w-36">
                        <ProfileCard
                          profile={profile}
                          onClick={() => handleProfileClick(profile.id, index)}
                          compact
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => scrollRoam('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gray-900/80 hover:bg-gray-800 text-white rounded-full p-1.5 shadow-lg -mr-2"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </section>
            )}

            {/* Grid principal */}
            {filteredProfiles.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-gray-400 text-lg">No hay perfiles disponibles</p>
                <p className="text-gray-500 text-sm mt-2">Prueba a cambiar los filtros</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
                {filteredProfiles.map((profile, index) => (
                  <ProfileCard
                    key={profile.id}
                    profile={profile}
                    onClick={() => handleProfileClick(profile.id, index)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Texto legal - pequeño, antes del nav */}
      <div className="text-center py-4 px-4 pb-24">
        <div className="flex justify-center flex-wrap gap-3 text-xs text-gray-700">
          <button onClick={() => navigate('/privacidad')} className="hover:text-gray-400">Privacidad</button>
          <button onClick={() => navigate('/terminos')} className="hover:text-gray-400">Términos</button>
          <button onClick={() => navigate('/cookies')} className="hover:text-gray-400">Cookies</button>
          <button onClick={() => navigate('/normas')} className="hover:text-gray-400">Normas</button>
        </div>
        <p className="text-xs text-gray-800 mt-1">© {new Date().getFullYear()} Caperucitas.com</p>
      </div>

      {/* Barra de navegación fija inferior — estilo app */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-800 flex items-center justify-around h-16 safe-area-bottom shadow-2xl">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-white transition-colors px-4"
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px]">Navegar</span>
        </button>
        <button
          onClick={() => navigate('/roam')}
          className="flex flex-col items-center gap-0.5 text-yellow-400 hover:text-yellow-300 transition-colors px-4"
        >
          <Zap className="w-6 h-6" fill="currentColor" strokeWidth={0} />
          <span className="text-[10px]">ROAM</span>
        </button>
        <button
          onClick={handleShare}
          className="flex flex-col items-center gap-0.5 text-[#25D366] hover:text-[#1ebe5d] transition-colors px-4"
        >
          <Share2 className="w-6 h-6" />
          <span className="text-[10px]">Compartir</span>
        </button>
        <button
          onClick={() => navigate('/info')}
          className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-white transition-colors px-4"
        >
          <Info className="w-6 h-6" />
          <span className="text-[10px]">Info</span>
        </button>
      </nav>
    </div>
  )
}

function ProfileCard({ profile, onClick, compact = false }: { profile: any; onClick: () => void; compact?: boolean }) {
  const coverPhoto = profile.photos?.find((p: any) => p.type === 'cover')

  return (
    <div
      className="cursor-pointer group rounded-xl overflow-hidden bg-gray-900 border border-gray-800 hover:border-red-600 transition-all duration-200 hover:shadow-lg hover:shadow-red-900/20"
      onClick={onClick}
    >
      <div className={`relative ${compact ? 'aspect-[3/4]' : 'aspect-[3/4]'} bg-gray-800 overflow-hidden`}>
        {coverPhoto ? (
          <img
            src={coverPhoto.url}
            alt={profile.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <span className="text-4xl">👤</span>
          </div>
        )}

        {/* Badge género */}
        {profile.gender && GENDER_LABELS[profile.gender] && (
          <div className={`absolute top-1.5 left-1.5 ${GENDER_LABELS[profile.gender].color} rounded-full px-1.5 py-0.5`}>
            <span className="text-white text-[9px] font-bold">{GENDER_LABELS[profile.gender].label}</span>
          </div>
        )}

        {/* ROAM badge */}
        {profile.isRoaming && (
          <div className="absolute top-1.5 right-1.5 bg-yellow-500 rounded-full p-1 shadow-lg">
            <Zap className="w-2.5 h-2.5 text-gray-900" fill="currentColor" strokeWidth={0} />
          </div>
        )}

        {/* Online dot */}
        {profile.isOnline && (
          <div className="absolute bottom-10 right-1.5 w-2 h-2 bg-green-500 rounded-full border border-gray-900 shadow-lg" />
        )}

        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-2 pt-8">
          <p className="text-white font-bold text-xs leading-tight truncate">
            {profile.title}, {profile.age}
          </p>
          <div className="flex items-center gap-0.5 text-gray-300 text-[9px] mt-0.5">
            <MapPin className="w-2 h-2 flex-shrink-0" />
            <span className="truncate">{profile.city || 'España'}</span>
          </div>
          {!compact && profile.lookingFor && (
            <p className="text-gray-400 text-[9px] mt-0.5 line-clamp-1">
              {profile.lookingFor.substring(0, 30)}{profile.lookingFor.length > 30 ? '…' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Botones contacto */}
      {!compact && (profile.phone || profile.whatsapp) && (
        <div className="flex gap-1 p-1.5">
          {profile.phone && (
            <a
              href={`tel:${profile.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 rounded-lg transition-colors"
            >
              <Phone className="w-3 h-3" />
              <span className="hidden sm:inline">Llamar</span>
            </a>
          )}
          {profile.whatsapp && (
            <a
              href={`https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex-1 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1.5 rounded-lg transition-colors"
            >
              <MessageCircle className="w-3 h-3" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          )}
        </div>
      )}
    </div>
  )
}
