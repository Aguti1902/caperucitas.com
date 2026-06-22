import { useState, useEffect } from 'react'
import { X, Cookie } from 'lucide-react'
import Button from './Button'

const COOKIE_CONSENT_KEY = 'cookie_consent'

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Verificar si ya hay consentimiento guardado
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!consent) {
      // Mostrar el banner después de un pequeño delay
      setTimeout(() => {
        setShowBanner(true)
      }, 1000)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted')
    setShowBanner(false)
    import('../../utils/analytics').then(({ initGA }) => initGA())
  }

  const handleReject = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected')
    setShowBanner(false)
  }

  const handleCustomize = () => {
    // Opcional: abrir modal de configuración de cookies
    // Por ahora, redirigir a la política de cookies
    window.location.href = '/app/info'
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[10000] p-4 animate-slide-up">
      <div className="max-w-4xl mx-auto bg-gray-900 border-2 border-primary/50 rounded-xl shadow-2xl p-6 relative">
        {/* Botón de cerrar */}
        <button
          onClick={handleReject}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>

        {/* Contenido */}
        <div className="flex items-start gap-4">
          {/* Icono */}
          <div className="flex-shrink-0 mt-1">
            <div className="bg-primary/20 rounded-full p-3">
              <Cookie className="text-primary" size={24} />
            </div>
          </div>

          {/* Texto */}
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">
              🍪 Usamos cookies
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              Utilizamos cookies y tecnologías similares para mejorar tu experiencia, 
              personalizar el contenido, analizar el tráfico y mostrar publicidad relevante. 
              Al hacer clic en "Aceptar todas", aceptas el uso de todas las cookies. 
              Puedes personalizar tus preferencias o rechazar las cookies no esenciales.
            </p>
            <p className="text-gray-400 text-xs mb-4">
              Para más información, consulta nuestra{' '}
              <a 
                href="/app/info" 
                className="text-primary hover:underline"
                onClick={(e) => {
                  e.preventDefault()
                  // Cambiar al tab de cookies en la página de info
                  window.location.href = '/app/info'
                }}
              >
                Política de Cookies
              </a>
            </p>

            {/* Botones */}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="primary"
                onClick={handleAccept}
                className="text-sm px-6 py-2"
              >
                Aceptar todas
              </Button>
              <Button
                variant="secondary"
                onClick={handleCustomize}
                className="text-sm px-6 py-2"
              >
                Personalizar
              </Button>
              <Button
                variant="outline"
                onClick={handleReject}
                className="text-sm px-6 py-2"
              >
                Rechazar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

