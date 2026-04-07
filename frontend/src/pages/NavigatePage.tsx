import { useState, useEffect } from 'react'
import { api } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { showToast } from '@/store/toastStore'
import ProfileCard from '@/components/profile/ProfileCard'
import FilterBar from '@/components/common/FilterBar'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import Modal from '@/components/common/Modal'
import Button from '@/components/common/Button'
import RoamStatusContent from '@/components/common/RoamStatusContent'
import RoamPaymentForm from '@/components/payment/RoamPaymentForm'
import { useNavigate } from 'react-router-dom'
import { Zap, Share2, MapPin } from 'lucide-react'


export default function NavigatePage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [profiles, setProfiles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilters, setActiveFilters] = useState<string[]>(['all'])
  const [showRoamModal, setShowRoamModal] = useState(false)
  const [showRoamPaymentModal, setShowRoamPaymentModal] = useState(false)
  const [showRoamStatusModal, setShowRoamStatusModal] = useState(false)
  const [roamDuration, setRoamDuration] = useState(180) // 3 horas por defecto
  const [roamPrice, setRoamPrice] = useState(5)
  const [roamStatus, setRoamStatus] = useState<any>(null)
  const [currentCity] = useState(user?.profile?.city || 'Madrid')
  const [ageRange] = useState({ min: 18, max: 99 })
  const [distanceRange] = useState({ min: 0, max: 500 })

  const isPremium = user?.subscription?.isActive || false

  useEffect(() => {
    const main = document.querySelector('main')
    if (main) main.scrollTop = 0
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const roamSuccess = params.get('roam')
    if (roamSuccess === 'success') {
      showToast('¡ROAM activado exitosamente!', 'success')
      window.history.replaceState({}, '', window.location.pathname)
      loadRoamStatus()
    } else if (roamSuccess === 'canceled') {
      showToast('Pago cancelado', 'info')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const loadProfiles = async () => {
    setIsLoading(true)
    try {
      const queryParams: any = {}
      if (activeFilters.includes('online')) queryParams.filter = 'online'
      else if (activeFilters.includes('new')) queryParams.filter = 'new'
      else queryParams.filter = 'all'

      if (activeFilters.includes('age')) {
        queryParams.ageMin = ageRange.min
        queryParams.ageMax = ageRange.max
      }

      const response = await api.get('/profile/search', { params: queryParams })
      const uniqueProfiles = response.data.profiles.filter(
        (profile: any, index: number, self: any[]) =>
          index === self.findIndex(p => p.id === profile.id)
      )
      setProfiles(uniqueProfiles)
    } catch {
      console.error('Error al cargar perfiles')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProfiles()
    loadRoamStatus()
    const interval = setInterval(loadRoamStatus, 30000)
    return () => clearInterval(interval)
  }, [activeFilters])

  const loadRoamStatus = async () => {
    try {
      const response = await api.get('/roam/status')
      setRoamStatus(response.data)
    } catch {
      console.error('Error loading roam status')
    }
  }

  const handleShare = () => {
    const shareData = {
      title: 'Caperucitas.com',
      text: '¡Encuentra escorts cerca de ti en Caperucitas.com!',
      url: window.location.origin,
    }
    if (navigator.share) {
      navigator.share(shareData).catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.origin)
      showToast('¡Enlace copiado!', 'success')
    }
  }

  const handleProfileClick = (profileId: string, index: number) => {
    sessionStorage.setItem('browseProfiles', JSON.stringify(profiles.map(p => p.id)))
    sessionStorage.setItem('browseIndex', String(index))
    navigate(`/profile/${profileId}`)
  }

  return (
    <div className="pb-4">
      {/* Barra superior con ciudad y botones */}
      <div
        className="bg-gray-900 border-b border-gray-800"
        style={{ position: 'fixed', top: '56px', left: 0, right: 0, zIndex: 30 }}
      >
        <div className="flex items-center justify-between px-3 py-2 gap-2">
          {/* Ciudad actual */}
          <div className="flex items-center gap-1.5 text-gray-300 text-sm">
            <MapPin className="w-4 h-4 text-red-400" />
            <span className="font-medium">{currentCity}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Botón ROAM */}
            <button
              onClick={() => {
                if (roamStatus?.isActive) {
                  setShowRoamStatusModal(true)
                } else {
                  setShowRoamModal(true)
                }
              }}
              className={`${
                roamStatus?.isActive
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-1.5 rounded-full text-sm font-bold'
                  : 'w-9 h-9 bg-yellow-500 rounded-full'
              } flex items-center justify-center gap-1.5 hover:scale-105 transition-transform border-2 border-yellow-300 shadow-lg flex-shrink-0 relative`}
            >
              <Zap className="w-4 h-4 text-gray-900" fill="currentColor" strokeWidth={0} />
              {roamStatus?.isActive && (
                <>
                  <span className="text-gray-900 font-bold text-xs">ROAM activo</span>
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-ping absolute -top-0.5 -right-0.5"></span>
                </>
              )}
            </button>

            {/* Botón Compartir */}
            <button
              onClick={handleShare}
              className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors"
              title="Compartir Caperucitas"
            >
              <Share2 className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="px-2 pb-2 border-t border-gray-800 pt-2">
          <FilterBar
            activeFilters={activeFilters}
            onFilterChange={setActiveFilters}
            isPremium={isPremium}
            onPremiumRequired={() => {}}
            ageRange={ageRange}
            distanceRange={distanceRange}
            onAgeRangeChange={() => {}}
            onDistanceRangeChange={() => {}}
            userOrientation="hetero"
            selectedGender={null}
            onGenderChange={() => {}}
            relationshipGoalFilter=""
            onRelationshipGoalChange={() => {}}
            roleFilter=""
            onRoleChange={() => {}}
          />
        </div>
      </div>

      {/* Grid de perfiles - 3 por fila */}
      <div className="max-w-7xl mx-auto px-3 pt-32 pb-20">
        {isLoading ? (
          <LoadingSpinner />
        ) : profiles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No hay perfiles disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
            {profiles.map((profile, index) => (
              <div
                key={profile.id}
                onClick={() => handleProfileClick(profile.id, index)}
                className="cursor-pointer"
              >
                <ProfileCard
                  profile={profile}
                  isPremium={true}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de ROAM */}
      <Modal
        isOpen={showRoamModal}
        onClose={() => setShowRoamModal(false)}
        title="Activar ROAM ⚡"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            <strong className="text-yellow-400">Aumenta tu visibilidad</strong> y aparece en los primeros resultados para más clientes.
          </p>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <h4 className="text-white font-bold mb-3">Beneficios de ROAM:</h4>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>✓ Tu anuncio aparece primero en los resultados</li>
              <li>✓ Más clientes potenciales te ven</li>
              <li>✓ Indicador especial ⚡ en tu perfil</li>
              <li>✓ Radio de 8km en la sección ROAM</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-white font-semibold">Selecciona el plan:</h4>

            <button
              onClick={() => { setRoamDuration(180); setRoamPrice(5) }}
              className={`w-full p-4 rounded-lg border-2 transition-all ${
                roamDuration === 180 ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-700 bg-gray-800 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <div className="text-white font-bold">3 horas</div>
                  <div className="text-gray-400 text-sm">Desde que lo actives</div>
                </div>
                <div className="text-yellow-400 font-bold text-xl">5€</div>
              </div>
            </button>

            <button
              onClick={() => { setRoamDuration(960); setRoamPrice(35) }}
              className={`w-full p-4 rounded-lg border-2 transition-all ${
                roamDuration === 960 ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-700 bg-gray-800 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <div className="text-white font-bold">4h/día durante 1 semana</div>
                  <div className="text-gray-400 text-sm">Eliges las horas cada día</div>
                </div>
                <div className="text-yellow-400 font-bold text-xl">35€</div>
              </div>
            </button>
          </div>

          <Button
            fullWidth
            variant="accent"
            onClick={() => { setShowRoamModal(false); setShowRoamPaymentModal(true) }}
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 border-0 font-bold"
          >
            Activar ROAM - {roamPrice}€
          </Button>
        </div>
      </Modal>

      {/* Modal pago ROAM */}
      <Modal
        isOpen={showRoamPaymentModal}
        onClose={() => setShowRoamPaymentModal(false)}
        title={`Activar ROAM - ${roamDuration === 180 ? '3 horas' : '1 semana'}`}
        maxWidth="md"
      >
        <RoamPaymentForm
          duration={roamDuration}
          price={roamPrice}
          onSuccess={async () => {
            setShowRoamPaymentModal(false)
            showToast('¡ROAM activado!', 'success')
            await loadRoamStatus()
          }}
          onCancel={() => setShowRoamPaymentModal(false)}
        />
      </Modal>

      {/* Modal estado ROAM activo */}
      {roamStatus?.isActive && roamStatus?.roamingUntil && showRoamStatusModal && (
        <Modal
          isOpen={showRoamStatusModal}
          onClose={() => setShowRoamStatusModal(false)}
          title=""
          maxWidth="md"
        >
          <RoamStatusContent
            roamingUntil={new Date(roamStatus.roamingUntil)}
            onClose={() => setShowRoamStatusModal(false)}
          />
        </Modal>
      )}
    </div>
  )
}
