import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import Logo from '@/components/common/Logo'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import SeoHead from '@/components/common/SeoHead'
import { fetchAllPublicProfiles } from '@/services/profile.api'
import { useAuthStore } from '@/store/authStore'
import { MapPin, Search, Phone, MessageCircle, Zap, Share2, Info, Home, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { SPANISH_CITIES } from '@/data/spanishCities'
import { getProfileCoverPhoto } from '@/utils/profileUtils'
import {
  getCityBySlug,
  getCityCanonical,
  getCityPath,
  getCitySeoMeta,
  getCitySeoBody,
  getNearbyMunicipalities,
  findMunicipalityByName,
  getCategoryBySlug,
  getCategoryByGenderId,
  cityToSlug,
  type SeoSection,
} from '@/utils/citySeo'
import { resolveCityFromCoords } from '@/utils/geoCityRedirect'

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

type ProfileSection = 'escort' | 'sexo_gratis'


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
  const location = useLocation()
  const { citySlug, categorySlug: routeCategorySlug } = useParams<{
    citySlug?: string
    categorySlug?: string
  }>()
  const { isAuthenticated, hasProfile } = useAuthStore()

  const routeSection: SeoSection | null = location.pathname.startsWith('/sexo-gratis/')
    ? 'sexo_gratis'
    : location.pathname.startsWith('/putas/')
      ? 'escort'
      : null

  const routeCategory = useMemo(
    () => getCategoryBySlug(routeCategorySlug),
    [routeCategorySlug]
  )

  const seoCity = useMemo(
    () => (citySlug ? getCityBySlug(citySlug) : undefined),
    [citySlug]
  )

  const [profiles, setProfiles] = useState<any[]>([])
  const [nearbyProfiles, setNearbyProfiles] = useState<any[]>([])
  const [roamProfiles, setRoamProfiles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedGender, setSelectedGender] = useState(() => routeCategory?.id || 'all')
  const [selectedSection, setSelectedSection] = useState<ProfileSection>(() => {
    if (routeSection) return routeSection
    const saved = localStorage.getItem('cap_profileSection')
    return saved === 'sexo_gratis' ? 'sexo_gratis' : 'escort'
  })
  const [citySearch, setCitySearch] = useState<string>(() => {
    if (seoCity) return seoCity.name
    return localStorage.getItem('cap_citySearch') || ''
  })
  const [showCityModal, setShowCityModal] = useState(false)
  const [modalSearch, setModalSearch] = useState('')
  const [isDetectingModal, setIsDetectingModal] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(() => {
    if (seoCity?.lat != null && seoCity?.lng != null) {
      return { lat: seoCity.lat, lng: seoCity.lng }
    }
    try {
      const saved = localStorage.getItem('cap_userLocation')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })
  const [showGeoPopup, setShowGeoPopup] = useState(() => !seoCity && !localStorage.getItem('cap_userLocation'))
  const [geoDetecting, setGeoDetecting] = useState(false)
  const [nominatimResults, setNominatimResults] = useState<{ name: string; displayName: string; lat: number; lng: number }[]>([])
  const [isSearchingCity, setIsSearchingCity] = useState(false)

  // Sincronizar ciudad y ubicación con localStorage al cambiar
  useEffect(() => {
    localStorage.setItem('cap_citySearch', citySearch)
  }, [citySearch])

  useEffect(() => {
    if (userLocation) {
      localStorage.setItem('cap_userLocation', JSON.stringify(userLocation))
    }
  }, [userLocation])

  // Búsqueda de ubicaciones reales via Nominatim (OpenStreetMap) — cualquier municipio de España
  useEffect(() => {
    if (modalSearch.length < 2) { setNominatimResults([]); return }
    const timer = setTimeout(async () => {
      setIsSearchingCity(true)
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(modalSearch)}&format=json&addressdetails=1&countrycodes=es&limit=8&accept-language=es`
        const res = await fetch(url, { headers: { 'User-Agent': 'Caperucitas/1.0' } })
        const data = await res.json()
        const results = data.map((r: any) => ({
          name: r.address?.city || r.address?.town || r.address?.village || r.address?.municipality || r.name,
          displayName: r.display_name,
          lat: parseFloat(r.lat),
          lng: parseFloat(r.lon),
        })).filter((r: any) => r.name)
        setNominatimResults(results)
      } catch { setNominatimResults([]) }
      finally { setIsSearchingCity(false) }
    }, 400)
    return () => clearTimeout(timer)
  }, [modalSearch])

  const goToCity = async (name: string, lat: number, lng: number) => {
    setUserLocation({ lat, lng })
    setShowCityModal(false)
    setNominatimResults([])

    let match = name ? findMunicipalityByName(name) : undefined

    if (!match) {
      const resolved = await resolveCityFromCoords(lat, lng, selectedSection)
      if (resolved) {
        setCitySearch(resolved.name)
        navigate(resolved.path)
        return
      }
    }

    if (!match && name) {
      match = getCityBySlug(cityToSlug(name))
    }

    if (!match) {
      const resolved = await resolveCityFromCoords(lat, lng, selectedSection)
      if (resolved) {
        setCitySearch(resolved.name)
        navigate(resolved.path)
      }
      return
    }

    setCitySearch(match.name)
    navigate(getCityPath(selectedSection, match, getCategoryByGenderId(selectedGender)?.slug))
  }

  const closeGeoPopup = async (loc: { lat: number; lng: number } | null) => {
    setShowGeoPopup(false)
    setGeoDetecting(false)
    if (!loc) return

    if (!seoCity && (location.pathname === '/perfiles' || location.pathname === '/')) {
      const resolved = await resolveCityFromCoords(loc.lat, loc.lng, selectedSection)
      if (resolved) {
        setUserLocation(loc)
        setCitySearch(resolved.name)
        navigate(resolved.path)
        return
      }
    }

    setUserLocation(loc)
    loadProfiles(loc)
  }

  const handleGeoAllow = () => {
    setGeoDetecting(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        closeGeoPopup({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      async () => {
        // Fallback por IP si niega o falla GPS
        try {
          const r = await fetch('https://ipapi.co/json/')
          const d = await r.json()
          if (d.latitude && d.longitude) closeGeoPopup({ lat: d.latitude, lng: d.longitude })
          else closeGeoPopup(null)
        } catch { closeGeoPopup(null) }
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 }
    )
  }

  const handleUseMyLocation = () => {
    setIsDetectingModal(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        goToCity('', latitude, longitude)
        setIsDetectingModal(false)
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
  const [maxDistance, setMaxDistance] = useState<number | null>(null)
  const [showDistFilter, setShowDistFilter] = useState(false)
  const [showSexoGratisInfo, setShowSexoGratisInfo] = useState(false)
  const [dismissedSexoGratisBanner, setDismissedSexoGratisBanner] = useState(
    () => localStorage.getItem('cap_dismissedSexoGratisBanner') === '1'
  )

  const DIST_OPTIONS = [5, 10, 25, 50, 100]
  const roamRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const [headerHeight, setHeaderHeight] = useState(0)

  useEffect(() => {
    if (!routeSection) localStorage.setItem('cap_profileSection', selectedSection)
  }, [selectedSection, routeSection])

  useEffect(() => {
    if (routeSection) setSelectedSection(routeSection)
  }, [routeSection])

  useEffect(() => {
    setSelectedGender(routeCategory?.id || 'all')
  }, [routeCategory?.id])

  useEffect(() => {
    if (seoCity) {
      setCitySearch(seoCity.name)
      if (seoCity.lat != null && seoCity.lng != null) {
        setUserLocation({ lat: seoCity.lat, lng: seoCity.lng })
      }
      setShowGeoPopup(false)
    }
  }, [seoCity?.slug])

  const activeCategorySlug = getCategoryByGenderId(selectedGender)?.slug || null

  const changeSection = (section: ProfileSection) => {
    setSelectedSection(section)
    if (seoCity) {
      navigate(getCityPath(section, seoCity, activeCategorySlug))
    }
  }

  const changeGender = (genderId: string) => {
    setSelectedGender(genderId)
    if (seoCity && routeSection) {
      const catSlug = getCategoryByGenderId(genderId)?.slug || null
      navigate(getCityPath(routeSection, seoCity, catSlug))
    }
  }

  const seoMeta = seoCity
    ? getCitySeoMeta(seoCity, selectedSection, activeCategorySlug)
    : null
  const seoBody = seoCity
    ? getCitySeoBody(seoCity, selectedSection, activeCategorySlug)
    : null
  const nearbyCities = useMemo(
    () => (seoCity ? getNearbyMunicipalities(seoCity, 8) : []),
    [seoCity]
  )

  useEffect(() => {
    loadProfiles()
  }, [selectedGender, selectedSection, seoCity?.name])

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
      const hasA = a.latitude != null && a.longitude != null
      const hasB = b.latitude != null && b.longitude != null
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
      const params: Record<string, string> = { profileType: selectedSection }
      if (selectedGender !== 'all') params.gender = selectedGender
      if (seoCity) params.city = seoCity.name

      const all = await fetchAllPublicProfiles(params)
      const unique = all.filter(
        (p: any, i: number, self: any[]) => i === self.findIndex((x) => x.id === p.id)
      )
      const currentLoc =
        loc !== undefined
          ? loc
          : userLocation ||
            (seoCity?.lat != null && seoCity?.lng != null
              ? { lat: seoCity.lat, lng: seoCity.lng }
              : null)
      const sorted = sortByDistance(unique, currentLoc)
      setProfiles(sorted)
      setRoamProfiles(sorted.filter((p: any) => p.isRoaming))

      // Si no hay perfiles en la ciudad: cargar cercanos (evita thin content)
      if (seoCity && sorted.length === 0) {
        const nearbyParams: Record<string, string> = { profileType: selectedSection }
        if (selectedGender !== 'all') nearbyParams.gender = selectedGender
        const nearbyAll = await fetchAllPublicProfiles(nearbyParams)
        const nearbyUnique = nearbyAll.filter(
          (p: any, i: number, self: any[]) => i === self.findIndex((x) => x.id === p.id)
        )
        const nearbySorted = sortByDistance(nearbyUnique, currentLoc).slice(0, 18)
        setNearbyProfiles(nearbySorted)
      } else {
        setNearbyProfiles([])
      }
    } catch {
      setProfiles([])
      setNearbyProfiles([])
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
    if (maxDistance && userLocation && p.latitude != null && p.longitude != null) {
      const dist = haversineKm(userLocation.lat, userLocation.lng, p.latitude, p.longitude)
      if (dist > maxDistance) return false
    }
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
    const msg = encodeURIComponent(
      '🔥 Novedad en Caperucitas.com: nueva sección SEXO GRATIS + escorts cerca de ti.\n\n' +
      'Encuentros consensuados sin pagar, o compañía profesional si lo prefieres.\n\n' +
      '👉 https://www.caperucitas.com'
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  const scrollRoam = (dir: 'left' | 'right') => {
    if (roamRef.current) {
      roamRef.current.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {seoMeta && seoCity && (
        <SeoHead
          title={seoMeta.title}
          description={seoMeta.description}
          canonical={getCityCanonical(selectedSection, seoCity, activeCategorySlug)}
          keywords={seoMeta.keywords}
          jsonLd={{
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: seoMeta.title,
            description: seoMeta.description,
            url: getCityCanonical(selectedSection, seoCity, activeCategorySlug),
            inLanguage: 'es-ES',
            about: {
              '@type': 'Place',
              name: seoCity.name,
              ...(seoCity.lat != null && seoCity.lng != null
                ? {
                    geo: {
                      '@type': 'GeoCoordinates',
                      latitude: seoCity.lat,
                      longitude: seoCity.lng,
                    },
                  }
                : {}),
            },
          }}
        />
      )}

      {/* ── Popup geolocalización obligatorio ── */}
      {showGeoPopup && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
        >
          <div className="w-full max-w-sm bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden animate-fade-in">
            {/* Cabecera visual */}
            <div className="bg-gradient-to-br from-red-700 to-red-900 px-6 pt-8 pb-6 text-center">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-white text-xl font-black">¿Dónde estás?</h2>
              <p className="text-red-200 text-sm mt-1">Para ver las Caperucitas más cercanas a ti</p>
            </div>

            {/* Cuerpo */}
            <div className="px-6 py-5 space-y-3">
              <button
                onClick={handleGeoAllow}
                disabled={geoDetecting}
                className="w-full flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-black text-base py-4 rounded-xl transition-all active:scale-95"
              >
                {geoDetecting ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Detectando ubicación...
                  </>
                ) : (
                  <>
                    <MapPin className="w-5 h-5" />
                    Permitir mi ubicación
                  </>
                )}
              </button>

              <button
                onClick={() => { setShowCityModal(true); setShowGeoPopup(false) }}
                className="w-full py-3 rounded-xl border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 text-sm font-semibold transition-colors"
              >
                Elegir ciudad manualmente
              </button>

              <p className="text-center text-gray-600 text-xs pt-1">
                Solo se usa para ordenar perfiles por cercanía.<br/>No guardamos tu ubicación.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header — fixed para que nunca tape el contenido */}
      <header ref={headerRef} className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur border-b border-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 flex items-center justify-between h-14">
          <Logo size="sm" />
          {isAuthenticated ? (
            <button
              onClick={handleEscortAccess}
              className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
            >
              Mi cuenta
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/login')}
                className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold px-3 py-2 rounded-lg transition-colors"
              >
                Entrar
              </button>
              <button
                onClick={() => navigate('/register')}
                className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-3 py-2 rounded-lg transition-colors"
              >
                Crear cuenta
              </button>
            </div>
          )}
        </div>

        {/* Selector de sección: Escorts / Sexo gratis */}
        <div className="border-t border-gray-800 px-3 py-2.5 bg-gray-950/80">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-800 rounded-xl flex-1">
              <button
                onClick={() => changeSection('escort')}
                className={`relative py-2.5 rounded-lg text-sm font-black transition-all ${
                  selectedSection === 'escort'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-900/40'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                ESCORTS
              </button>
              <button
                onClick={() => changeSection('sexo_gratis')}
                className={`relative py-2.5 rounded-lg text-sm font-black transition-all ${
                  selectedSection === 'sexo_gratis'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                SEXO GRATIS
                <span className="absolute -top-1.5 -right-1 bg-yellow-400 text-gray-900 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                  NUEVO
                </span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowSexoGratisInfo(true)}
              className="flex-shrink-0 w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 text-emerald-400 flex items-center justify-center transition-colors"
              title="Información sobre Sexo gratis"
              aria-label="Información sobre Sexo gratis"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
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
              onClick={() => { setShowAgeFilter(v => !v); setShowDistFilter(false) }}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${showAgeFilter || minAge || maxAge ? 'bg-yellow-500 text-gray-900' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
            >
              EDAD {minAge || maxAge ? `${minAge||'0'}-${maxAge||'99'}` : ''}
            </button>
            {/* Distancia */}
            <button
              onClick={() => { setShowDistFilter(v => !v); setShowAgeFilter(false) }}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${maxDistance ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
              title={userLocation ? 'Filtrar por distancia' : 'Activa la ubicación para usar este filtro'}
            >
              {maxDistance ? `≤${maxDistance}km` : 'KM'}
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

          {/* Filtro distancia expandible */}
          {showDistFilter && (
            <div className="max-w-7xl mx-auto pt-2">
              {!userLocation ? (
                <p className="text-yellow-400 text-xs">⚠️ Activa tu ubicación para filtrar por distancia</p>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-gray-400 text-xs flex-shrink-0">Máx. distancia:</span>
                  {DIST_OPTIONS.map(km => (
                    <button
                      key={km}
                      onClick={() => setMaxDistance(maxDistance === km ? null : km)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                        maxDistance === km ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {km} km
                    </button>
                  ))}
                  {maxDistance && (
                    <button onClick={() => setMaxDistance(null)} className="text-gray-400 hover:text-white text-xs">
                      Limpiar
                    </button>
                  )}
                </div>
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
                onClick={() => changeGender(f.id)}
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

      {/* Modal información Sexo gratis */}
      {showSexoGratisInfo && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowSexoGratisInfo(false)} />
          <div className="relative w-full max-w-sm bg-gray-900 rounded-2xl shadow-2xl border border-emerald-800/50 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-emerald-900/20">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-emerald-400" />
                <h2 className="text-white font-bold text-lg">Sexo gratis</h2>
              </div>
              <button onClick={() => setShowSexoGratisInfo(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3 text-sm text-gray-300 leading-relaxed">
              <p>
                Sección para personas que buscan u ofrecen encuentros consensuados{' '}
                <strong className="text-white">sin compensación económica</strong>.
              </p>
              <p>
                Si publicas aquí, te comprometes a no solicitar ni aceptar dinero, regalos ni ningún beneficio a cambio.
              </p>
              <p className="text-red-400 font-semibold text-xs">
                El incumplimiento supone baneo y expulsión permanente.
              </p>
              <button
                onClick={() => { setShowSexoGratisInfo(false); navigate('/normas') }}
                className="text-emerald-400 hover:text-emerald-300 text-xs underline"
              >
                Ver normas completas
              </button>
            </div>
            <div className="px-5 pb-4">
              <button
                onClick={() => setShowSexoGratisInfo(false)}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de búsqueda de ciudad */}
      {showCityModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
          {/* Fondo oscuro */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCityModal(false)} />

          {/* Panel */}
          <div className="relative w-full max-w-md mx-auto bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
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
                    <p className="text-xs opacity-60">Ejemplo: Vilafant, Figueres, Gerona...</p>
                  </div>
                ) : isSearchingCity ? (
                  <div className="flex items-center justify-center py-8 gap-2 text-gray-500">
                    <span className="w-5 h-5 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
                    <span className="text-sm">Buscando...</span>
                  </div>
                ) : nominatimResults.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm py-6">Sin resultados para "{modalSearch}"</p>
                ) : (
                  <div className="space-y-0.5">
                    {nominatimResults.map((place, i) => (
                      <button
                        key={i}
                        onClick={() => goToCity(place.name, place.lat, place.lng)}
                        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-800 rounded-xl transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-white text-sm font-medium">{place.name}</p>
                          <p className="text-gray-500 text-xs truncate max-w-[280px]">{place.displayName}</p>
                        </div>
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

        {seoMeta && seoCity && seoBody && (
          <header className="space-y-3">
            <div className="space-y-1">
              <h1 className="text-xl md:text-2xl font-black text-white">{seoMeta.h1}</h1>
              <p className="text-gray-400 text-sm">{seoMeta.subtitle}</p>
            </div>
            <div className="text-gray-400 text-sm leading-relaxed space-y-2 max-w-3xl">
              <p>{seoBody.intro}</p>
              <p className="text-gray-500 text-xs">{seoBody.disclaimer}</p>
            </div>
          </header>
        )}

        {/* Banner promocional Sexo gratis */}
        {selectedSection === 'escort' && (
          <button
            onClick={() => changeSection('sexo_gratis')}
            className="w-full text-left relative overflow-hidden rounded-xl border border-emerald-600/40 bg-gradient-to-r from-emerald-900/60 to-gray-900 p-4 hover:border-emerald-500 transition-colors active:scale-[0.99]"
          >
            <span className="absolute top-2 right-2 bg-yellow-400 text-gray-900 text-[9px] font-black px-1.5 py-0.5 rounded-full">
              NUEVO
            </span>
            <p className="text-emerald-300 text-[10px] font-bold uppercase tracking-wide">Novedad</p>
            <p className="text-white font-black text-sm mt-0.5">💚 Sección Sexo gratis ya disponible</p>
            <p className="text-gray-400 text-xs mt-1">Encuentros sin pagar · Toca aquí para explorar</p>
          </button>
        )}

        {selectedSection === 'sexo_gratis' && !dismissedSexoGratisBanner && (
          <div className="flex items-start gap-2.5 bg-emerald-900/20 border border-emerald-800/40 rounded-xl px-3 py-3">
            <Info className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-gray-300 text-xs flex-1 leading-relaxed">
              Encuentros consensuados sin compensación económica. Si pides o aceptas dinero, serás expulsado/a.
            </p>
            <button
              type="button"
              onClick={() => {
                setDismissedSexoGratisBanner(true)
                localStorage.setItem('cap_dismissedSexoGratisBanner', '1')
              }}
              className="text-gray-500 hover:text-white flex-shrink-0 p-0.5"
              aria-label="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

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
              <div className="space-y-6">
                <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 text-left space-y-3">
                  <h2 className="text-white font-bold text-lg">
                    {seoBody?.emptyTitle || (selectedSection === 'sexo_gratis'
                      ? 'Aún no hay perfiles en esta zona'
                      : 'No hay perfiles disponibles')}
                  </h2>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {seoBody?.emptyText || 'Prueba a cambiar los filtros o explorar otra ciudad.'}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedSection === 'sexo_gratis' && (
                      <button
                        onClick={() => changeSection('escort')}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl transition-colors text-sm"
                      >
                        Ver escorts en {seoCity?.name || 'esta zona'}
                      </button>
                    )}
                    <button
                      onClick={() => navigate('/register')}
                      className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl transition-colors text-sm"
                    >
                      Crear perfil gratis
                    </button>
                  </div>
                </div>

                {nearbyProfiles.length > 0 && (
                  <section>
                    <h2 className="text-white font-bold text-sm mb-3">
                      {seoBody?.nearbyTitle || 'Explora otros perfiles cerca de ti'}
                    </h2>
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
                      {nearbyProfiles.map((profile, index) => (
                        <ProfileCard
                          key={profile.id}
                          profile={profile}
                          onClick={() => {
                            sessionStorage.setItem(
                              'browseProfiles',
                              JSON.stringify(nearbyProfiles.map((p) => p.id))
                            )
                            sessionStorage.setItem('browseIndex', String(index))
                            navigate(`/profile/${profile.id}`)
                          }}
                        />
                      ))}
                    </div>
                  </section>
                )}
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

      {seoCity && nearbyCities.length > 0 && (
        <section className="max-w-7xl mx-auto px-3 pb-6">
          <h2 className="text-white font-bold text-sm mb-2">
            {selectedSection === 'escort' ? 'Putas y escorts cerca de' : 'Sexo gratis cerca de'} {seoCity.name}
          </h2>
          <div className="flex flex-wrap gap-2">
            {nearbyCities.map((city) => (
              <button
                key={city.slug}
                onClick={() => navigate(getCityPath(selectedSection, city, activeCategorySlug))}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              >
                {city.name}
              </button>
            ))}
            <button
              onClick={() => navigate('/ciudades')}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-700 text-gray-400 hover:text-white transition-colors"
            >
              Todas las ciudades →
            </button>
          </div>
        </section>
      )}

      {/* Texto legal - pequeño, antes del nav */}
      <div className="text-center py-4 px-4 pb-24">
        <div className="flex justify-center flex-wrap gap-3 text-xs text-gray-700">
          <button onClick={() => navigate('/privacidad')} className="hover:text-gray-400">Privacidad</button>
          <button onClick={() => navigate('/terminos')} className="hover:text-gray-400">Términos</button>
          <button onClick={() => navigate('/cookies')} className="hover:text-gray-400">Cookies</button>
          <button onClick={() => navigate('/normas')} className="hover:text-gray-400">Normas</button>
          <button onClick={() => navigate('/ciudades')} className="hover:text-gray-400">Ciudades</button>
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
  const coverPhoto = getProfileCoverPhoto(profile)

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
