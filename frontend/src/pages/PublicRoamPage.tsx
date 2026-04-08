import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import Logo from '@/components/common/Logo'
import { Zap, MapPin, Clock, Star, ArrowLeft } from 'lucide-react'

export default function PublicRoamPage() {
  const navigate = useNavigate()
  const { isAuthenticated, hasProfile } = useAuthStore()

  const handleActivateRoam = () => {
    if (isAuthenticated && hasProfile) {
      navigate('/app/plus')
    } else if (isAuthenticated) {
      navigate('/create-profile')
    } else {
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between h-14">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Logo size="sm" />
          <div className="w-5" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">

        {/* Hero ROAM */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-yellow-500/30">
            <Zap className="w-10 h-10 text-gray-900" fill="currentColor" strokeWidth={0} />
          </div>
          <h1 className="text-3xl font-bold text-white">¿Qué es ROAM?</h1>
          <p className="text-gray-300 text-lg">
            Destaca tu perfil y aparece en la sección prioritaria de tu zona durante horas.
            Más visibilidad = más clientes.
          </p>
        </div>

        {/* Cómo funciona */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-5">
          <h2 className="text-xl font-bold text-white">Cómo funciona</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Activa ROAM desde tu perfil</p>
                <p className="text-gray-400 text-sm">En cuanto lo activas, tu perfil aparece destacado en las búsquedas de tu zona.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Radio de 8 km</p>
                <p className="text-gray-400 text-sm">Tu perfil se muestra a clientes en un radio de 8 km alrededor de tu ubicación actual.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Solo pagas el tiempo que necesitas</p>
                <p className="text-gray-400 text-sm">Actívalo cuando tengas disponibilidad y desactívalo cuando quieras.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Star className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Posición destacada en resultados</p>
                <p className="text-gray-400 text-sm">Los perfiles ROAM activos aparecen siempre en las primeras posiciones del listado.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Precios */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white text-center">Precios</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Plan 3h */}
            <div className="bg-gray-900 border border-yellow-500/30 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" fill="currentColor" strokeWidth={0} />
                <span className="text-white font-bold">3 horas</span>
              </div>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-black text-yellow-400">5€</span>
                <span className="text-gray-400 text-sm mb-1">/ activación</span>
              </div>
              <p className="text-gray-400 text-sm">
                Actívalo cuando tengas disponibilidad. A partir del momento en que lo activas.
              </p>
            </div>

            {/* Plan semanal */}
            <div className="bg-gray-900 border border-yellow-500 rounded-2xl p-6 space-y-3 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-gray-900 text-xs font-black px-3 py-1 rounded-full">
                MEJOR PRECIO
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" fill="currentColor" strokeWidth={0} />
                <span className="text-white font-bold">4h/día — 1 semana</span>
              </div>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-black text-yellow-400">35€</span>
                <span className="text-gray-400 text-sm mb-1">/ semana</span>
              </div>
              <p className="text-gray-400 text-sm">
                Elige 4 horas al día durante 7 días consecutivos. Ideal si tienes disponibilidad diaria.
              </p>
            </div>
          </div>
        </div>

        {/* Suscripción mensual */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-lg font-bold text-white mb-3">Anuncio base — Registro</h2>
          <div className="space-y-2 text-sm text-gray-400">
            <p>✅ <span className="text-white font-medium">Gratis hasta el 1 de enero de 2027</span> — aprovecha para registrarte ahora sin coste.</p>
            <p>📅 A partir del 1 de enero de 2027: <span className="text-white font-medium">20€/mes</span> para aparecer en los listados de búsqueda.</p>
            <p>⏸️ Si no renuevas, tu perfil queda pausado automáticamente y no aparece en las búsquedas.</p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-3 pb-6">
          <button
            onClick={handleActivateRoam}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-black py-4 rounded-2xl text-lg transition-colors shadow-lg shadow-yellow-500/20"
          >
            <Zap className="w-5 h-5 inline mr-2" fill="currentColor" strokeWidth={0} />
            {isAuthenticated && hasProfile ? 'Activar ROAM ahora' : 'Registrarme y activar ROAM'}
          </button>
          <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
            ← Volver al directorio
          </button>
        </div>
      </div>
    </div>
  )
}
