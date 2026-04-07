import { useNavigate } from 'react-router-dom'
import Logo from '@/components/common/Logo'
import { ArrowLeft, Info, FileText, Shield, Cookie } from 'lucide-react'
import { useState } from 'react'

type Tab = 'info' | 'terms' | 'privacy' | 'cookies'

export default function PublicInfoPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('info')

  const tabs = [
    { id: 'info' as Tab, label: 'Info', icon: Info },
    { id: 'terms' as Tab, label: 'Términos', icon: FileText },
    { id: 'privacy' as Tab, label: 'Privacidad', icon: Shield },
    { id: 'cookies' as Tab, label: 'Cookies', icon: Cookie },
  ]

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

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-800 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-red-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Contenido */}
        {activeTab === 'info' && (
          <div className="space-y-8 text-gray-300">
            <div className="text-center">
              <Logo size="md" className="mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white">¿Cómo funciona Caperucitas.com?</h1>
            </div>

            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">
              <h2 className="text-xl font-bold text-white">Para clientes</h2>
              <ul className="space-y-2 text-sm">
                <li>✅ Navega y consulta perfiles <strong className="text-white">sin registrarte</strong></li>
                <li>✅ Filtra por género, ciudad y búsqueda de texto</li>
                <li>✅ Contacta directamente por teléfono o WhatsApp</li>
                <li>✅ Sin suscripciones ni pagos para ver anuncios</li>
              </ul>
            </div>

            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">
              <h2 className="text-xl font-bold text-white">Para escorts</h2>
              <ul className="space-y-2 text-sm">
                <li>📝 Regístrate gratis y crea tu anuncio en minutos</li>
                <li>📸 Sube hasta 7 fotos (1 portada + 6 adicionales)</li>
                <li>📍 Tu ubicación solo se actualiza cuando tú lo decides</li>
                <li>⏸️ Pausa tu perfil cuando no estés disponible</li>
                <li>🆓 <strong className="text-white">Gratis hasta el 1 de enero de 2027</strong></li>
                <li>💳 A partir de 2027: 20€/mes para aparecer en búsquedas</li>
              </ul>
            </div>

            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">
              <h2 className="text-xl font-bold text-white">ROAM — Visibilidad premium</h2>
              <p className="text-sm">
                ROAM te permite destacar en los resultados de búsqueda durante un tiempo limitado.
                Apareces en posición prioritaria para clientes cercanos a ti.
              </p>
              <ul className="space-y-2 text-sm">
                <li>⚡ 3 horas por <strong className="text-white">5€</strong></li>
                <li>⚡ 4 horas/día durante 1 semana por <strong className="text-white">35€</strong></li>
              </ul>
              <button
                onClick={() => navigate('/roam')}
                className="text-yellow-400 hover:text-yellow-300 text-sm font-semibold"
              >
                Más info sobre ROAM →
              </button>
            </div>

            <div className="text-center">
              <button
                onClick={() => navigate('/register')}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 rounded-xl transition-colors"
              >
                Publicar mi anuncio gratis
              </button>
            </div>
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="prose prose-invert max-w-none text-gray-300 text-sm space-y-4">
            <h2 className="text-xl font-bold text-white">Términos y Condiciones</h2>
            <p>Al usar Caperucitas.com aceptas estos términos. Este sitio es un directorio de anuncios para adultos.</p>
            <h3 className="text-white font-semibold">Uso del servicio</h3>
            <ul>
              <li>Debes ser mayor de 18 años para usar este sitio.</li>
              <li>Los anuncios publicados son responsabilidad del anunciante.</li>
              <li>Caperucitas.com no media ni participa en los servicios anunciados.</li>
              <li>Queda prohibida la publicación de contenido ilegal o que implique menores de edad.</li>
            </ul>
            <h3 className="text-white font-semibold">Cuentas y pagos</h3>
            <ul>
              <li>El registro es gratuito hasta el 1 de enero de 2027.</li>
              <li>A partir de esa fecha, la suscripción mensual es de 20€/mes.</li>
              <li>Si no se renueva la suscripción, el perfil queda automáticamente pausado.</li>
            </ul>
            <h3 className="text-white font-semibold">Cancelación</h3>
            <p>Puedes pausar o eliminar tu cuenta en cualquier momento desde tu perfil.</p>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="prose prose-invert max-w-none text-gray-300 text-sm space-y-4">
            <h2 className="text-xl font-bold text-white">Política de Privacidad</h2>
            <p>Caperucitas.com respeta tu privacidad. Los datos que recopilamos son únicamente los necesarios para el funcionamiento del servicio.</p>
            <h3 className="text-white font-semibold">Datos que recopilamos</h3>
            <ul>
              <li>Email y contraseña cifrada para la creación de cuenta.</li>
              <li>Información del perfil que decides publicar (nombre, descripción, fotos, ubicación).</li>
              <li>Datos de contacto (teléfono/WhatsApp) que publicas voluntariamente.</li>
            </ul>
            <h3 className="text-white font-semibold">Uso de los datos</h3>
            <ul>
              <li>Los datos del perfil son públicos y visibles por todos los visitantes.</li>
              <li>No vendemos ni cedemos datos a terceros.</li>
              <li>Tu email nunca es visible públicamente.</li>
            </ul>
            <h3 className="text-white font-semibold">Tus derechos</h3>
            <p>Puedes solicitar la eliminación de tus datos contactándonos en info@caperucitas.com</p>
          </div>
        )}

        {activeTab === 'cookies' && (
          <div className="prose prose-invert max-w-none text-gray-300 text-sm space-y-4">
            <h2 className="text-xl font-bold text-white">Política de Cookies</h2>
            <p>Usamos cookies estrictamente necesarias para el funcionamiento del sitio.</p>
            <h3 className="text-white font-semibold">Cookies que usamos</h3>
            <ul>
              <li><strong className="text-white">Sesión:</strong> Para mantener tu sesión iniciada.</li>
              <li><strong className="text-white">Preferencias:</strong> Para recordar tus filtros de búsqueda.</li>
            </ul>
            <p>No usamos cookies de seguimiento ni de publicidad de terceros.</p>
          </div>
        )}
      </div>
    </div>
  )
}
