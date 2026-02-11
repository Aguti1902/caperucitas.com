import { useState } from 'react'
import { Users, Wifi, Calendar, MapPin, Sparkles, Star, UserCircle, Heart } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

interface FilterBarProps {
  activeFilters: string[]
  onFilterChange: (filters: string[]) => void
  isPremium: boolean
  onPremiumRequired: () => void
  ageRange?: { min: number; max: number }
  distanceRange?: { min: number; max: number }
  onAgeRangeChange?: (min: number, max: number) => void
  onDistanceRangeChange?: (min: number, max: number) => void
  userOrientation?: string
  selectedGender?: string | null
  onGenderChange?: (gender: string | null) => void
  relationshipGoalFilter?: string // Nuevo
  onRelationshipGoalChange?: (goal: string) => void // Nuevo
  roleFilter?: string // Filtro de ROL solo para usuarios gay
  onRoleChange?: (role: string) => void // Cambio de ROL
}

export default function FilterBar({
  activeFilters,
  onFilterChange,
  isPremium,
  onPremiumRequired,
  ageRange = { min: 18, max: 99 },
  distanceRange = { min: 0, max: 500 },
  onAgeRangeChange,
  onDistanceRangeChange,
  userOrientation = 'hetero',
  selectedGender = null,
  onGenderChange,
  relationshipGoalFilter = '', // Nuevo
  onRelationshipGoalChange, // Nuevo
  roleFilter = '', // Filtro de ROL
  onRoleChange, // Cambio de ROL
}: FilterBarProps) {
  const [showAgeModal, setShowAgeModal] = useState(false)
  const [showDistanceModal, setShowDistanceModal] = useState(false)
  const [showGenderModal, setShowGenderModal] = useState(false)
  const [showTypeModal, setShowTypeModal] = useState(false) // Nuevo
  const [showRoleModal, setShowRoleModal] = useState(false) // Modal de ROL
  const [tempAgeMin, setTempAgeMin] = useState(ageRange.min)
  const [tempAgeMax, setTempAgeMax] = useState(ageRange.max)
  const [tempDistanceMin, setTempDistanceMin] = useState(distanceRange.min)
  const [tempDistanceMax, setTempDistanceMax] = useState(distanceRange.max)

  // Filtros base - ORDEN CORRECTO
  const baseFilters = [
    { id: 'all', label: 'TODOS', premium: false, Icon: Users },
    { id: 'recent', label: 'RECIENTES', premium: false, Icon: Calendar }, 
    { id: 'new', label: 'NUEVOS', premium: false, Icon: Sparkles },
    { id: 'distance', label: 'DISTANCIA', premium: true, Icon: MapPin, isModal: true },
    { id: 'online', label: 'ONLINE', premium: true, Icon: Wifi },
    { id: 'age', label: 'EDAD', premium: true, Icon: Calendar, isModal: true },
    { id: 'type', label: 'TIPO', premium: true, Icon: Heart, isModal: true }, // NUEVO FILTRO
  ]

  // Agregar filtro de GÉNERO solo para usuarios HETERO (después de ONLINE)
  // Agregar filtro de ROL solo para usuarios GAY (después de TIPO)
  const filters = userOrientation === 'hetero' 
    ? [
        ...baseFilters.slice(0, 5), // TODOS, RECIENTES, NUEVOS, DISTANCIA, ONLINE
        { id: 'gender', label: 'GÉNERO', premium: true, Icon: UserCircle, isModal: true },
        ...baseFilters.slice(5), // EDAD, TIPO
      ]
    : [
        ...baseFilters, // TODOS, RECIENTES, NUEVOS, DISTANCIA, ONLINE, EDAD, TIPO
        { id: 'role', label: 'ROL', premium: true, Icon: UserCircle, isModal: true }, // ROL solo para GAY
      ]

  const toggleFilter = (filterId: string, premium: boolean, isModal?: boolean) => {
    if (premium && !isPremium) {
      onPremiumRequired()
      return
    }

    // Si es un filtro modal, abrir el modal
    if (isModal) {
      if (filterId === 'age') {
        setShowAgeModal(true)
      } else if (filterId === 'distance') {
        setShowDistanceModal(true)
      } else if (filterId === 'gender') {
        setShowGenderModal(true)
      } else if (filterId === 'type') {
        setShowTypeModal(true)
      } else if (filterId === 'role') {
        setShowRoleModal(true)
      }
      return
    }

    if (filterId === 'all') {
      onFilterChange(['all'])
      return
    }

    const newFilters = activeFilters.includes(filterId)
      ? activeFilters.filter(f => f !== filterId)
      : [...activeFilters.filter(f => f !== 'all'), filterId]

    onFilterChange(newFilters.length === 0 ? ['all'] : newFilters)
  }

  const handleApplyAge = () => {
    onAgeRangeChange?.(tempAgeMin, tempAgeMax)
    
    // Activar el filtro de edad
    if (!activeFilters.includes('age')) {
      const newFilters = [...activeFilters.filter(f => f !== 'all'), 'age']
      onFilterChange(newFilters)
    }
    
    setShowAgeModal(false)
  }

  const handleApplyDistance = () => {
    onDistanceRangeChange?.(tempDistanceMin, tempDistanceMax)
    
    // Activar el filtro de distancia
    if (!activeFilters.includes('distance')) {
      const newFilters = [...activeFilters.filter(f => f !== 'all'), 'distance']
      onFilterChange(newFilters)
    }
    
    setShowDistanceModal(false)
  }

  return (
    <>
      {/* Contenedor con scroll horizontal sin barra visible - Mejorado */}
      <div className="overflow-x-auto px-2 pb-1 scrollbar-hide">
        <div className="flex gap-2 min-w-min">
          {filters.map((filter) => {
            const Icon = filter.Icon
            const isActive = activeFilters.includes(filter.id)
            return (
              <button
                key={filter.id}
                onClick={() => toggleFilter(filter.id, filter.premium, filter.isModal)}
                className={`whitespace-nowrap flex items-center gap-1.5 px-4 py-2 rounded-full transition-all flex-shrink-0 ${
                  isActive 
                    ? 'bg-primary text-white shadow-lg scale-105' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs font-bold">{filter.label}</span>
                {filter.premium && !isPremium && (
                  <Star className="w-3 h-3 text-accent fill-accent ml-1" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Modal Filtro de Edad */}
      <Modal
        isOpen={showAgeModal}
        onClose={() => setShowAgeModal(false)}
        title="Filtrar por edad"
        maxWidth="sm"
      >
        <div className="space-y-6 pb-2">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Desde
              </label>
              <select
                value={tempAgeMin}
                onChange={(e) => setTempAgeMin(parseInt(e.target.value))}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 text-base border border-gray-700 focus:border-primary focus:outline-none"
              >
                {Array.from({ length: 82 }, (_, i) => i + 18).map(age => (
                  <option key={age} value={age}>{age} años</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Hasta
              </label>
              <select
                value={tempAgeMax}
                onChange={(e) => setTempAgeMax(parseInt(e.target.value))}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 text-base border border-gray-700 focus:border-primary focus:outline-none"
              >
                {Array.from({ length: 82 }, (_, i) => i + 18).map(age => (
                  <option key={age} value={age}>{age} años</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              fullWidth
              variant="outline"
              onClick={() => setShowAgeModal(false)}
            >
              Cancelar
            </Button>
            <Button
              fullWidth
              variant="primary"
              onClick={handleApplyAge}
            >
              Aplicar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Filtro de Distancia */}
      <Modal
        isOpen={showDistanceModal}
        onClose={() => setShowDistanceModal(false)}
        title="Filtrar por distancia"
        maxWidth="sm"
      >
        <div className="space-y-6 pb-2">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Desde
              </label>
              <select
                value={tempDistanceMin}
                onChange={(e) => setTempDistanceMin(parseInt(e.target.value))}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 text-base border border-gray-700 focus:border-primary focus:outline-none"
              >
                <option value={0}>0 km</option>
                {Array.from({ length: 100 }, (_, i) => i + 1).map(km => (
                  <option key={km} value={km}>{km} km</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Hasta
              </label>
              <select
                value={tempDistanceMax > 100 ? 500 : tempDistanceMax}
                onChange={(e) => {
                  const value = parseInt(e.target.value)
                  setTempDistanceMax(value)
                }}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 text-base border border-gray-700 focus:border-primary focus:outline-none"
              >
                <option value={0}>0 km</option>
                {Array.from({ length: 100 }, (_, i) => i + 1).map(km => (
                  <option key={km} value={km}>{km} km</option>
                ))}
                <option value={500}>100+ km</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              fullWidth
              variant="outline"
              onClick={() => setShowDistanceModal(false)}
            >
              Cancelar
            </Button>
            <Button
              fullWidth
              variant="primary"
              onClick={handleApplyDistance}
            >
              Aplicar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Filtro de Género (solo para HETERO y 9PLUS) */}
      <Modal
        isOpen={showGenderModal}
        onClose={() => setShowGenderModal(false)}
        title="Filtrar por género"
        maxWidth="sm"
      >
        <div className="space-y-6 pb-2">
          <div className="space-y-3">
            <p className="text-gray-400 text-sm mb-4">
              Selecciona el género que quieres ver:
            </p>
            
            <button
              onClick={() => {
                onGenderChange?.(null)
                setShowGenderModal(false)
              }}
              className={`w-full text-left px-4 py-4 rounded-lg border-2 transition-all ${
                selectedGender === null
                  ? 'border-primary bg-primary/10 text-white'
                  : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <UserCircle className="w-6 h-6" />
                <div>
                  <div className="font-semibold">Todos los géneros</div>
                  <div className="text-sm text-gray-400">Ver hombres y mujeres</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                onGenderChange?.('hombre')
                setShowGenderModal(false)
              }}
              className={`w-full text-left px-4 py-4 rounded-lg border-2 transition-all ${
                selectedGender === 'hombre'
                  ? 'border-primary bg-primary/10 text-white'
                  : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <UserCircle className="w-6 h-6" />
                <div>
                  <div className="font-semibold">Solo hombres</div>
                  <div className="text-sm text-gray-400">Ver solo perfiles de hombres</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                onGenderChange?.('mujer')
                setShowGenderModal(false)
              }}
              className={`w-full text-left px-4 py-4 rounded-lg border-2 transition-all ${
                selectedGender === 'mujer'
                  ? 'border-primary bg-primary/10 text-white'
                  : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <UserCircle className="w-6 h-6" />
                <div>
                  <div className="font-semibold">Solo mujeres</div>
                  <div className="text-sm text-gray-400">Ver solo perfiles de mujeres</div>
                </div>
              </div>
            </button>
          </div>

          <div className="pt-2">
            <Button
              fullWidth
              variant="outline"
              onClick={() => setShowGenderModal(false)}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Filtro de Tipo de relación */}
      <Modal
        isOpen={showTypeModal}
        onClose={() => setShowTypeModal(false)}
        title="Filtrar por tipo de relación"
        maxWidth="sm"
      >
        <div className="space-y-6 pb-2">
          <div className="space-y-3">
            <p className="text-gray-400 text-sm mb-4">
              Selecciona qué tipo de relación buscas:
            </p>
            
            <button
              onClick={() => {
                onRelationshipGoalChange?.('amistad')
                setShowTypeModal(false)
              }}
              className={`w-full text-left px-4 py-4 rounded-lg border-2 transition-all ${
                relationshipGoalFilter === 'amistad'
                  ? 'border-primary bg-primary/10 text-white'
                  : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">👥</span>
                <div>
                  <div className="font-semibold">Amistad</div>
                  <div className="text-sm text-gray-400">Conocer gente nueva y hacer amigos</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                onRelationshipGoalChange?.('relacion_seria')
                setShowTypeModal(false)
              }}
              className={`w-full text-left px-4 py-4 rounded-lg border-2 transition-all ${
                relationshipGoalFilter === 'relacion_seria'
                  ? 'border-primary bg-primary/10 text-white'
                  : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">❤️</span>
                <div>
                  <div className="font-semibold">Relación seria</div>
                  <div className="text-sm text-gray-400">Busco una relación estable y comprometida</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                onRelationshipGoalChange?.('encuentros_casuales')
                setShowTypeModal(false)
              }}
              className={`w-full text-left px-4 py-4 rounded-lg border-2 transition-all ${
                relationshipGoalFilter === 'encuentros_casuales'
                  ? 'border-primary bg-primary/10 text-white'
                  : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔥</span>
                <div>
                  <div className="font-semibold">Encuentros casuales</div>
                  <div className="text-sm text-gray-400">Encuentros sin compromiso</div>
                </div>
              </div>
            </button>
          </div>

          <div className="pt-2">
            <Button
              fullWidth
              variant="outline"
              onClick={() => setShowTypeModal(false)}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Filtro de ROL (solo para usuarios GAY y 9PLUS) */}
      {userOrientation === 'gay' && (
        <Modal
          isOpen={showRoleModal}
          onClose={() => setShowRoleModal(false)}
          title="Filtrar por ROL"
          maxWidth="sm"
        >
          <div className="space-y-6 pb-2">
            <div className="space-y-3">
              <p className="text-gray-400 text-sm mb-4">
                Selecciona el ROL que quieres ver:
              </p>
              
              <button
                onClick={() => {
                  onRoleChange?.('')
                  setShowRoleModal(false)
                }}
                className={`w-full text-left px-4 py-4 rounded-lg border-2 transition-all ${
                  roleFilter === ''
                    ? 'border-primary bg-primary/10 text-white'
                    : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <UserCircle className="w-6 h-6" />
                  <div>
                    <div className="font-semibold">Todos los ROLes</div>
                    <div className="text-sm text-gray-400">Ver activos, pasivos y versátiles</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  onRoleChange?.('activo')
                  setShowRoleModal(false)
                }}
                className={`w-full text-left px-4 py-4 rounded-lg border-2 transition-all ${
                  roleFilter === 'activo'
                    ? 'border-green-500 bg-green-500/10 text-white'
                    : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔵</span>
                  <div>
                    <div className="font-semibold">Activo</div>
                    <div className="text-sm text-gray-400">Ver solo perfiles activos</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  onRoleChange?.('pasivo')
                  setShowRoleModal(false)
                }}
                className={`w-full text-left px-4 py-4 rounded-lg border-2 transition-all ${
                  roleFilter === 'pasivo'
                    ? 'border-blue-500 bg-blue-500/10 text-white'
                    : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔴</span>
                  <div>
                    <div className="font-semibold">Pasivo</div>
                    <div className="text-sm text-gray-400">Ver solo perfiles pasivos</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  onRoleChange?.('versatil')
                  setShowRoleModal(false)
                }}
                className={`w-full text-left px-4 py-4 rounded-lg border-2 transition-all ${
                  roleFilter === 'versatil'
                    ? 'border-purple-500 bg-purple-500/10 text-white'
                    : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚪</span>
                  <div>
                    <div className="font-semibold">Versátil</div>
                    <div className="text-sm text-gray-400">Ver solo perfiles versátiles</div>
                  </div>
                </div>
              </button>
            </div>

            <div className="pt-2">
              <Button
                fullWidth
                variant="outline"
                onClick={() => setShowRoleModal(false)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
