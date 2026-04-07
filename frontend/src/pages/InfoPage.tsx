import Logo from '@/components/common/Logo'
import { BookOpen, FileText, Shield, Cookie, Users } from 'lucide-react'
import { useState } from 'react'
import TermsAndConditions from '@/components/legal/TermsAndConditions'
import PrivacyPolicy from '@/components/legal/PrivacyPolicy'
import CookiePolicy from '@/components/legal/CookiePolicy'
import CommunityGuidelines from '@/components/legal/CommunityGuidelines'

type LegalTab = 'info' | 'terms' | 'privacy' | 'cookies' | 'community'

export default function InfoPage() {
  const [activeTab, setActiveTab] = useState<LegalTab>('info')

  const tabs = [
    { id: 'info' as LegalTab, label: 'Información', icon: BookOpen },
    { id: 'terms' as LegalTab, label: 'Términos', icon: FileText },
    { id: 'privacy' as LegalTab, label: 'Privacidad', icon: Shield },
    { id: 'cookies' as LegalTab, label: 'Cookies', icon: Cookie },
    { id: 'community' as LegalTab, label: 'Normas', icon: Users },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <Logo size="md" className="mx-auto mb-4" />
      </div>

      {/* Tabs de navegación */}
      <div className="flex gap-2 mb-8 border-b border-gray-800 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 font-semibold transition-colors whitespace-nowrap rounded-t-lg text-sm ${
                activeTab === tab.id
                  ? 'text-red-400 bg-gray-900 border-b-2 border-red-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'info' && (
        <div className="space-y-8">
          {/* Cómo funciona */}
          <section className="bg-gray-900 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">¿Cómo funciona Caperucitas.com?</h2>
            <div className="text-gray-300 space-y-3">
              <p>
                <strong className="text-white">1. Sin registro:</strong> Cualquier persona puede ver todos los anuncios sin necesidad de crear una cuenta.
              </p>
              <p>
                <strong className="text-white">2. Registro de escorts:</strong> Solo las escorts necesitan registrarse para aparecer en los resultados de búsqueda.
              </p>
              <p>
                <strong className="text-white">3. Anuncio completo:</strong> Añade fotos, descripción, servicios, teléfono y WhatsApp para que los clientes te encuentren fácilmente.
              </p>
              <p>
                <strong className="text-white">4. Actualiza tu ubicación:</strong> La ubicación solo se actualiza cuando tú lo decides, pulsando "Actualizar ubicación".
              </p>
              <p>
                <strong className="text-white">5. Pausa cuando quieras:</strong> Puedes pausar y reactivar tu anuncio en cualquier momento desde tu perfil.
              </p>
            </div>
          </section>

          {/* Planes y tarifas */}
          <section className="bg-gray-900 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Planes y tarifas</h2>
            <div className="space-y-5">
              <div className="bg-green-900/20 border border-green-700 rounded-xl p-4">
                <h3 className="text-xl font-semibold text-green-400 mb-2">Anuncio Gratis</h3>
                <p className="text-gray-300 text-sm mb-3">
                  <strong className="text-white">Gratis hasta el 1 de enero de 2027</strong>
                </p>
                <ul className="text-gray-300 space-y-1.5 text-sm list-disc list-inside">
                  <li>Perfil completo con fotos (1 portada + 6 adicionales)</li>
                  <li>Teléfono y WhatsApp de contacto visibles</li>
                  <li>Apareces en las búsquedas por ciudad y categoría</li>
                  <li>Pausar y activar tu anuncio cuando quieras</li>
                  <li>Actualizar tu ubicación manualmente</li>
                </ul>
              </div>

              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <h3 className="text-xl font-semibold text-gray-300 mb-2">A partir del 1 de enero de 2027</h3>
                <p className="text-yellow-400 font-bold text-lg mb-3">20€/mes</p>
                <p className="text-gray-400 text-sm">
                  Si al finalizar la suscripción no se ha renovado, el anuncio dejará de aparecer en los listados de búsqueda.
                </p>
              </div>
            </div>
          </section>

          {/* ROAM */}
          <section className="bg-gray-900 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">⚡ Función ROAM</h2>
            <p className="text-gray-300 mb-4">
              ROAM te permite destacar en los resultados y aparecer primero en un radio de 8km, consiguiendo más visibilidad y clientes.
            </p>

            <div className="space-y-3 mb-4">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-bold">3 horas</p>
                  <p className="text-gray-400 text-sm">Desde que lo actives</p>
                </div>
                <span className="text-yellow-400 font-bold text-xl">5€</span>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-bold">4 horas/día durante 1 semana</p>
                  <p className="text-gray-400 text-sm">Eliges las horas cada día</p>
                </div>
                <span className="text-yellow-400 font-bold text-xl">35€</span>
              </div>
            </div>

            <p className="text-gray-400 text-sm">
              ROAM está disponible desde tu panel de escort. Si no estás registrada, créate una cuenta gratuita primero.
            </p>
          </section>

          {/* Normas */}
          <section className="bg-gray-900 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Normas de uso</h2>
            <div className="text-gray-300 space-y-2 text-sm">
              <p className="text-red-400 font-semibold text-base">
                ⚠️ El incumplimiento puede resultar en la eliminación del perfil
              </p>
              <p><strong className="text-white">1. Mayoría de edad:</strong> Debes tener al menos 18 años para publicar o usar Caperucitas.com.</p>
              <p><strong className="text-white">2. Fotos reales:</strong> Usa fotos tuyas reales y actuales. Queda prohibida la suplantación de identidad.</p>
              <p><strong className="text-white">3. Contenido apropiado:</strong> Las fotos de portada no pueden mostrar contenido explícito.</p>
              <p><strong className="text-white">4. Categoría correcta:</strong> Regístrate en la categoría que te corresponde (Chica, Chico, Trans o Casa/Piso).</p>
              <p><strong className="text-white">5. Respeto:</strong> Evita mensajes ofensivos, xenófobos o discriminatorios.</p>
            </div>
          </section>

          {/* Contacto */}
          <section className="bg-gray-900 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Contacto</h2>
            <div className="text-gray-300 space-y-2 text-sm">
              <p>📧 soporte@caperucitas.com</p>
              <p>⚖️ legal@caperucitas.com</p>
              <p>🛡️ safety@caperucitas.com</p>
              <p className="text-gray-500 mt-3 text-xs">
                © {new Date().getFullYear()} Caperucitas.com — Todos los derechos reservados
              </p>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'terms' && (
        <div className="bg-gray-900 rounded-xl p-8">
          <TermsAndConditions />
        </div>
      )}

      {activeTab === 'privacy' && (
        <div className="bg-gray-900 rounded-xl p-8">
          <PrivacyPolicy />
        </div>
      )}

      {activeTab === 'cookies' && (
        <div className="bg-gray-900 rounded-xl p-8">
          <CookiePolicy />
        </div>
      )}

      {activeTab === 'community' && (
        <div className="bg-gray-900 rounded-xl p-8">
          <CommunityGuidelines />
        </div>
      )}
    </div>
  )
}
