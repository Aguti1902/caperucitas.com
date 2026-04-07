import { useState, useEffect } from 'react'
import { X, Download, Share } from 'lucide-react'

export default function InstallPWA() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Detectar si ya está instalada
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    setIsStandalone(standalone)

    // Detectar si la app puede ser instalada (Android Chrome)
    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Para iOS, mostrar el prompt si no está instalada y no fue cerrado
    const dismissed = localStorage.getItem('pwa-prompt-dismissed')
    if (iOS && !standalone && !dismissed) {
      // Mostrar después de 3 segundos
      setTimeout(() => {
        setShowInstallPrompt(true)
      }, 3000)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('PWA instalada')
    }
    
    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    // Guardar que el usuario cerró el banner
    localStorage.setItem('pwa-prompt-dismissed', 'true')
  }

  // No mostrar si ya está instalada
  if (isStandalone) return null
  
  if (!showInstallPrompt) return null

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 px-4 animate-fade-in">
      <div className="max-w-md mx-auto bg-gradient-to-r from-primary to-pink-600 rounded-2xl shadow-2xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📱</span>
              <h3 className="text-white font-bold text-lg">Instalar Caperucitas</h3>
            </div>
            <p className="text-white/90 text-sm mb-3">
              Añade Caperucitas a tu pantalla de inicio para una experiencia completa como app nativa
            </p>
            
            {/* Android Chrome - Botón automático */}
            {deferredPrompt && !isIOS && (
              <button
                onClick={handleInstall}
                className="w-full bg-white text-primary font-bold py-2.5 px-4 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Instalar Ahora
              </button>
            )}

            {/* iOS Safari - Instrucciones manuales */}
            {isIOS && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-white text-sm space-y-2">
                <p className="font-semibold flex items-center gap-2">
                  <Share className="w-4 h-4" />
                  Para instalar en iOS:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Toca el botón <strong>Compartir</strong> (□↑) abajo</li>
                  <li>Desliza y toca <strong>"Añadir a pantalla de inicio"</strong></li>
                  <li>Confirma tocando <strong>"Añadir"</strong></li>
                </ol>
              </div>
            )}

            {/* Otros navegadores - Instrucciones genéricas */}
            {!deferredPrompt && !isIOS && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
                <p className="font-semibold mb-2">Para instalar:</p>
                <p className="text-xs">
                  Abre el menú de tu navegador y busca la opción "Añadir a pantalla de inicio" o "Instalar app"
                </p>
              </div>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

