import { useState, useEffect } from 'react'
import { api } from '@/services/api'
import { showToast } from '@/store/toastStore'
import Button from '@/components/common/Button'
import Modal from '@/components/common/Modal'
import Logo from '@/components/common/Logo'
import RoamPaymentForm from '@/components/payment/RoamPaymentForm'
import RoamStatusContent from '@/components/common/RoamStatusContent'
import { Zap, Crown, Check } from 'lucide-react'

export default function PlusPage() {
  const [showRoamPaymentModal, setShowRoamPaymentModal] = useState(false)
  const [showRoamStatusModal, setShowRoamStatusModal] = useState(false)
  const [roamDuration, setRoamDuration] = useState(180)
  const [roamPrice, setRoamPrice] = useState(5)
  const [roamStatus, setRoamStatus] = useState<any>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const roamSuccess = params.get('roam')
    if (roamSuccess === 'success') {
      showToast('¡ROAM activado exitosamente!', 'success')
      window.history.replaceState({}, '', window.location.pathname)
      loadRoamStatus()
    }
    loadRoamStatus()
  }, [])

  const loadRoamStatus = async () => {
    try {
      const response = await api.get('/roam/status')
      setRoamStatus(response.data)
    } catch {}
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
      <div className="text-center mb-8">
        <Logo size="md" className="mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white">Destaca tu anuncio</h1>
        <p className="text-gray-400 mt-2">Consigue más clientes con nuestras opciones de visibilidad</p>
      </div>

      {/* Estado actual de ROAM */}
      {roamStatus?.isActive && (
        <div className="bg-yellow-500/10 border border-yellow-500 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
              <Zap className="w-5 h-5 text-gray-900" fill="currentColor" strokeWidth={0} />
            </div>
            <div>
              <p className="text-yellow-400 font-bold">¡ROAM Activo!</p>
              <p className="text-gray-400 text-xs">Tu anuncio aparece primero en los resultados</p>
            </div>
          </div>
          <button
            onClick={() => setShowRoamStatusModal(true)}
            className="text-yellow-400 text-sm hover:text-yellow-300 underline"
          >
            Ver estado
          </button>
        </div>
      )}

      {/* ROAM - Función de destacar */}
      <section className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-gray-900" fill="currentColor" strokeWidth={0} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Función ROAM</h2>
            <p className="text-gray-400 text-sm">Destaca en los resultados de búsqueda</p>
          </div>
        </div>

        <ul className="space-y-2 mb-5">
          {[
            'Tu anuncio aparece primero en los resultados',
            'Visible en un radio de 8km para más clientes',
            'Indicador especial ⚡ en tu perfil',
            'Más visibilidad = más contactos',
          ].map(benefit => (
            <li key={benefit} className="flex items-center gap-2 text-gray-300 text-sm">
              <Check className="w-4 h-4 text-yellow-500 flex-shrink-0" />
              {benefit}
            </li>
          ))}
        </ul>

        {/* Planes ROAM */}
        <div className="space-y-3 mb-5">
          <button
            onClick={() => { setRoamDuration(180); setRoamPrice(5) }}
            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
              roamDuration === 180 ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-700 bg-gray-800 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-bold">3 horas</p>
                <p className="text-gray-400 text-sm">Desde que lo actives</p>
              </div>
              <div className="text-right">
                <p className="text-yellow-400 font-bold text-2xl">5€</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => { setRoamDuration(960); setRoamPrice(35) }}
            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
              roamDuration === 960 ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-700 bg-gray-800 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-bold">4 horas/día — 1 semana</p>
                <p className="text-gray-400 text-sm">Eliges las horas cada día</p>
                <span className="inline-block bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded mt-1">AHORRO</span>
              </div>
              <div className="text-right">
                <p className="text-yellow-400 font-bold text-2xl">35€</p>
              </div>
            </div>
          </button>
        </div>

        <Button
          fullWidth
          variant="accent"
          onClick={() => setShowRoamPaymentModal(true)}
          className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 border-0 font-bold py-4 text-lg"
        >
          <Zap className="w-5 h-5 mr-2" fill="currentColor" strokeWidth={0} />
          Activar ROAM — {roamPrice}€
        </Button>
      </section>

      {/* Suscripción mensual */}
      <section className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Suscripción mensual</h2>
            <p className="text-gray-400 text-sm">Para aparecer en los listados de búsqueda</p>
          </div>
        </div>

        <div className="bg-green-900/20 border border-green-700 rounded-xl p-4 mb-4">
          <p className="text-green-400 font-bold text-lg">🎉 GRATIS hasta el 1 de enero de 2027</p>
          <p className="text-gray-300 text-sm mt-1">
            Aprovecha el período de lanzamiento gratuito. A partir del 1/1/2027, la suscripción será de <strong className="text-white">20€/mes</strong>.
          </p>
        </div>

        <ul className="space-y-2 mb-4">
          {[
            'Aparece en los resultados de búsqueda',
            'Filtros por ciudad y categoría',
            'Perfil completo con fotos y contacto',
            'Sin límite de visualizaciones',
          ].map(benefit => (
            <li key={benefit} className="flex items-center gap-2 text-gray-300 text-sm">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              {benefit}
            </li>
          ))}
        </ul>

        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <p className="text-gray-400 text-sm">
            Si no renuevas la suscripción cuando expire, tu anuncio dejará de aparecer en los listados hasta que la renueves.
          </p>
        </div>
      </section>

      {/* Modal pago ROAM */}
      <Modal
        isOpen={showRoamPaymentModal}
        onClose={() => setShowRoamPaymentModal(false)}
        title={`Activar ROAM — ${roamDuration === 180 ? '3 horas · 5€' : '1 semana · 35€'}`}
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

      {/* Modal estado ROAM */}
      {roamStatus?.isActive && roamStatus?.roamingUntil && (
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
