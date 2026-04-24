import { useState, useEffect } from 'react'
import { X, Share, Plus } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const STORAGE_KEY = 'caperucitas_pwa_dismissed'
const SHOW_AFTER_MS = 4000 // Mostrar 4 segundos después de entrar

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isMobile() {
  return /iphone|ipad|ipod|android/i.test(navigator.userAgent) || window.innerWidth < 768
}

function isInStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
  )
}

export default function PWAInstallPrompt() {
  const [show, setShow] = useState(false)
  const [isIOSDevice, setIsIOSDevice] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    // No mostrar si ya se descartó, si ya está instalada, o si no es móvil
    if (
      localStorage.getItem(STORAGE_KEY) ||
      isInStandaloneMode() ||
      !isMobile()
    ) return

    const ios = isIOS()
    setIsIOSDevice(ios)

    if (ios) {
      // iOS no tiene beforeinstallprompt, mostramos instrucciones manuales
      const timer = setTimeout(() => setShow(true), SHOW_AFTER_MS)
      return () => clearTimeout(timer)
    }

    // Android / Chrome: capturar el evento beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      const timer = setTimeout(() => setShow(true), SHOW_AFTER_MS)
      return () => clearTimeout(timer)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    setInstalling(true)
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === 'accepted') {
      dismiss()
    } else {
      setInstalling(false)
    }
  }

  const dismiss = () => {
    setShow(false)
    localStorage.setItem(STORAGE_KEY, '1')
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center px-4 pb-4 sm:items-center sm:pb-0">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Panel */}
      <div className="relative w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
        {/* Botón cerrar */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors z-10"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Cabecera con degradado rojo */}
        <div className="bg-gradient-to-br from-red-700 to-red-900 px-6 pt-8 pb-6 flex flex-col items-center gap-3">
          <img
            src="/logo-caperucitas.jpeg"
            alt="Caperucitas"
            className="h-20 w-auto object-contain rounded-xl shadow-lg"
          />
          <div className="text-center">
            <h2 className="text-white font-black text-xl leading-tight">
              Instala Caperucitas.com
            </h2>
            <p className="text-red-200 text-sm mt-1">
              Accede rápido desde tu pantalla de inicio
            </p>
          </div>
        </div>

        {/* Contenido */}
        <div className="px-6 py-5">
          {isIOSDevice ? (
            /* Instrucciones para iOS */
            <div className="space-y-3">
              <p className="text-gray-300 text-sm text-center mb-4">
                Sigue estos pasos en Safari:
              </p>
              <div className="flex items-center gap-3 bg-gray-800 rounded-xl px-4 py-3">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">1</div>
                <div className="flex items-center gap-2 text-gray-200 text-sm">
                  <span>Toca el botón</span>
                  <Share className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold">Compartir</span>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-gray-800 rounded-xl px-4 py-3">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">2</div>
                <div className="flex items-center gap-2 text-gray-200 text-sm">
                  <span>Selecciona</span>
                  <Plus className="w-4 h-4 text-gray-300" />
                  <span className="font-semibold">"Añadir a inicio"</span>
                </div>
              </div>
              <button
                onClick={dismiss}
                className="w-full mt-2 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium transition-colors"
              >
                Ahora no
              </button>
            </div>
          ) : (
            /* Botón de instalación para Android */
            <div className="space-y-3">
              <ul className="text-gray-400 text-sm space-y-1.5 mb-4">
                <li>⚡ Carga instantánea</li>
                <li>🔔 Notificaciones</li>
                <li>📱 Acceso directo desde tu móvil</li>
              </ul>
              <button
                onClick={handleInstall}
                disabled={installing}
                className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 disabled:opacity-60 text-white font-bold text-base transition-all shadow-lg shadow-red-900/40"
              >
                {installing ? 'Instalando...' : '📲 Instalar ahora'}
              </button>
              <button
                onClick={dismiss}
                className="w-full py-2.5 rounded-xl bg-transparent text-gray-500 text-sm transition-colors hover:text-gray-300"
              >
                Ahora no
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
