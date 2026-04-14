import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '@/components/common/Logo'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { api } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { MapPin, Search, Phone, MessageCircle, Zap, Share2, Info, Home, ChevronLeft, ChevronRight } from 'lucide-react'

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


export default function IndexPage() {
  const navigate = useNavigate()
  const { isAuthenticated, hasProfile } = useAuthStore()
  const [profiles, setProfiles] = useState<any[]>([])
  const [roamProfiles, setRoamProfiles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedGender, setSelectedGender] = useState('all')
  const [citySearch, setCitySearch] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [minAge, setMinAge] = useState('')
  const [maxAge, setMaxAge] = useState('')
  const [showAgeFilter, setShowAgeFilter] = useState(false)
  const roamRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadProfiles()
  }, [selectedGender])

  const loadProfiles = async () => {
    setIsLoading(true)
    try {
      const params: any = { filter: 'all' }
      if (selectedGender !== 'all') params.gender = selectedGender

      const response = await api.get('/profile/public-search', { params })
      const all = response.data.profiles.filter(
        (p: any, i: number, self: any[]) => i === self.findIndex((x) => x.id === p.id)
      )
      setProfiles(all)
      setRoamProfiles(all.filter((p: any) => p.isRoaming))
    } catch {
      setProfiles([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProfiles = profiles.filter((p) => {
    if (searchQuery && !p.title?.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (citySearch && !p.city?.toLowerCase().includes(citySearch.toLowerCase())) return false
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
    if (isAuthenticated && hasProfile) navigate('/app')
    else if (isAuthenticated) navigate('/create-profile')
    else navigate('/register')
  }

  const handleShare = () => {
    const shareData = { title: 'Caperucitas.com', text: '¡Encuentra los mejores perfiles en Caperucitas.com!', url: window.location.origin }
    if (navigator.share) navigator.share(shareData).catch(() => {})
    else { navigator.clipboard.writeText(window.location.origin); alert('¡Enlace copiado!') }
  }

  const scrollRoam = (dir: 'left' | 'right') => {
    if (roamRef.current) {
      roamRef.current.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur border-b border-gray-800 shadow-lg">
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
            {/* Ciudad texto libre */}
            <div className="flex items-center gap-1 bg-gray-800 rounded-full px-3 py-1.5 flex-1 min-w-[130px] max-w-[200px]">
              <MapPin className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Ciudad, calle..."
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                className="bg-transparent text-white text-sm focus:outline-none w-full"
              />
              {citySearch && (
                <button onClick={() => setCitySearch('')} className="text-gray-400 hover:text-white text-xs">✕</button>
              )}
            </div>
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
              className="flex-shrink-0 p-2 rounded-full bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
              title="Compartir"
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

      {/* Banner principal — logo completo sin recortes */}
      <div className="w-full bg-gray-900 border-b border-gray-800">
        <img
          src="/logo-caperucitas.jpeg"
          alt="Caperucitas.com"
          className="w-full h-auto block"
          style={{ maxHeight: 'none' }}
        />
      </div>

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
          className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-white transition-colors px-4"
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
