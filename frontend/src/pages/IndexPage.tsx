import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '@/components/common/Logo'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { api } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { MapPin, Search, Phone, MessageCircle, Zap, Clock } from 'lucide-react'
import { formatLastSeen } from '@/utils/timeUtils'

const GENDER_FILTERS = [
  { id: 'all', label: 'Todas' },
  { id: 'chica', label: 'Chicas' },
  { id: 'chico', label: 'Chicos' },
  { id: 'trans', label: 'Trans' },
  { id: 'casa', label: 'Casas/Pisos' },
]

const SPANISH_CITIES = [
  'Todas las ciudades',
  'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza',
  'Málaga', 'Murcia', 'Palma', 'Las Palmas', 'Bilbao',
  'Alicante', 'Córdoba', 'Valladolid', 'Vigo', 'Gijón',
  'A Coruña', 'Granada', 'Vitoria', 'Oviedo', 'Santa Cruz de Tenerife',
  'Cartagena', 'Pamplona', 'Figueres',
]

export default function IndexPage() {
  const navigate = useNavigate()
  const { isAuthenticated, hasProfile } = useAuthStore()
  const [profiles, setProfiles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedGender, setSelectedGender] = useState('all')
  const [selectedCity, setSelectedCity] = useState('Todas las ciudades')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadProfiles()
  }, [selectedGender, selectedCity])

  const loadProfiles = async () => {
    setIsLoading(true)
    try {
      const params: any = { filter: 'all' }
      if (selectedGender !== 'all') params.gender = selectedGender
      if (selectedCity !== 'Todas las ciudades') params.city = selectedCity

      const response = await api.get('/profile/public-search', { params })
      const uniqueProfiles = response.data.profiles.filter(
        (profile: any, index: number, self: any[]) =>
          index === self.findIndex((p) => p.id === profile.id)
      )
      setProfiles(uniqueProfiles)
    } catch {
      setProfiles([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProfiles = profiles.filter((p) => {
    if (!searchQuery) return true
    return p.title?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const handleProfileClick = (profileId: string, index: number) => {
    sessionStorage.setItem('browseProfiles', JSON.stringify(filteredProfiles.map(p => p.id)))
    sessionStorage.setItem('browseIndex', String(index))
    navigate(`/profile/${profileId}`)
  }

  const handleEscortAccess = () => {
    if (isAuthenticated && hasProfile) {
      navigate('/app')
    } else if (isAuthenticated) {
      navigate('/create-profile')
    } else {
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 flex items-center justify-between h-14">
          <Logo size="sm" />
          <button
            onClick={handleEscortAccess}
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
          >
            {isAuthenticated ? 'Mi Perfil' : 'Soy Escort'}
          </button>
        </div>
      </header>

      {/* Filtro de género */}
      <div className="sticky top-14 z-40 bg-gray-900 border-b border-gray-800 px-3 py-2">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
          {GENDER_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedGender(f.id)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                selectedGender === f.id
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
          <div className="flex-shrink-0 flex items-center gap-2 ml-auto">
            {/* Selector de ciudad */}
            <div className="relative flex items-center gap-1 bg-gray-800 rounded-full px-3 py-1.5">
              <MapPin className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-transparent text-white text-sm font-medium focus:outline-none cursor-pointer appearance-none pr-1"
              >
                {SPANISH_CITIES.map((city) => (
                  <option key={city} value={city} className="bg-gray-900">
                    {city}
                  </option>
                ))}
              </select>
            </div>
            {/* Búsqueda */}
            <div className="relative flex items-center bg-gray-800 rounded-full px-3 py-1.5">
              <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-white text-sm pl-2 focus:outline-none w-24"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid de perfiles */}
      <main className="max-w-7xl mx-auto px-3 py-4">
        {isLoading ? (
          <LoadingSpinner />
        ) : filteredProfiles.length === 0 ? (
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
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-8 px-4 mt-8">
        <div className="max-w-7xl mx-auto text-center space-y-3">
          <Logo size="sm" className="mx-auto" />
          <p className="text-gray-400 text-sm">
            Directorio de escorts adultos. Solo mayores de 18 años.
          </p>
          <div className="flex justify-center gap-4 text-xs text-gray-500">
            <button onClick={() => navigate('/login')} className="hover:text-gray-300">
              Acceso escorts
            </button>
            <button onClick={() => navigate('/register')} className="hover:text-gray-300">
              Publicar anuncio
            </button>
          </div>
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} Caperucitas.com — Todos los derechos reservados
          </p>
        </div>
      </footer>
    </div>
  )
}

function ProfileCard({ profile, onClick }: { profile: any; onClick: () => void }) {
  const coverPhoto = profile.photos?.find((p: any) => p.type === 'cover')

  return (
    <div
      className="cursor-pointer group rounded-xl overflow-hidden bg-gray-900 border border-gray-800 hover:border-red-600 transition-all duration-200 hover:shadow-lg hover:shadow-red-900/20"
      onClick={onClick}
    >
      {/* Imagen */}
      <div className="relative aspect-[3/4] bg-gray-800 overflow-hidden">
        {coverPhoto ? (
          <img
            src={coverPhoto.url}
            alt={profile.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-5xl">👤</div>
          </div>
        )}

        {/* ROAM badge */}
        {profile.isRoaming && (
          <div className="absolute top-2 right-2 bg-yellow-500 rounded-full p-1 shadow-lg">
            <Zap className="w-3 h-3 text-gray-900" fill="currentColor" strokeWidth={0} />
          </div>
        )}

        {/* Online badge */}
        {profile.isOnline && (
          <div className="absolute top-2 left-2 flex items-center bg-green-500/90 rounded-full px-1.5 py-0.5">
            <span className="w-1.5 h-1.5 bg-white rounded-full mr-1 animate-pulse"></span>
            <span className="text-white text-[10px] font-bold">Online</span>
          </div>
        )}

        {/* Overlay con info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2 pt-6">
          <p className="text-white font-bold text-sm leading-tight truncate">
            {profile.title}, {profile.age}
          </p>
          <div className="flex items-center gap-1 text-gray-300 text-[10px] mt-0.5">
            <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
            <span className="truncate">{profile.city || 'España'}</span>
          </div>
          {!profile.isOnline && profile.lastSeenAt && (
            <div className="flex items-center gap-1 text-gray-400 text-[10px]">
              <Clock className="w-2.5 h-2.5 flex-shrink-0" />
              <span>{formatLastSeen(profile.lastSeenAt)}</span>
            </div>
          )}
          {/* Resumen de lo que busca (30 chars) */}
          {profile.lookingFor && (
            <p className="text-gray-300 text-[10px] mt-0.5 line-clamp-1">
              {profile.lookingFor.substring(0, 30)}{profile.lookingFor.length > 30 ? '…' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Botones de contacto rápido */}
      {(profile.phone || profile.whatsapp) && (
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
