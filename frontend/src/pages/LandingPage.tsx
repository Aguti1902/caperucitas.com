import { useNavigate } from 'react-router-dom'
import Logo from '@/components/common/Logo'
import { useAuthStore } from '@/store/authStore'
import { Share2, Info, Zap, Home } from 'lucide-react'

export default function LandingPage() {
  const navigate = useNavigate()
  const { isAuthenticated, hasProfile } = useAuthStore()

  const handleEscortAccess = () => {
    if (isAuthenticated && hasProfile) navigate('/app')
    else if (isAuthenticated) navigate('/create-profile')
    else navigate('/register')
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <Logo size="sm" />
          <button
            onClick={handleEscortAccess}
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
          >
            {isAuthenticated && hasProfile ? 'Mi Perfil' : 'Soy Escort'}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 space-y-8">

        {/* Banner logo */}
        <div className="rounded-2xl overflow-hidden shadow-2xl">
          <img
            src="/logo-caperucitas.jpeg"
            alt="Caperucitas.com"
            className="w-full object-contain"
          />
        </div>

        {/* Texto intro */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-black text-white">Bienvenido a <span className="text-red-500">Caperucitas.com</span></h1>
          <p className="text-gray-400 text-base leading-relaxed">
            El directorio de escorts más completo de España. Encuentra acompañantes cerca de ti o publica tu perfil gratis.
          </p>
        </div>

        {/* CTAs */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/perfiles')}
            className="bg-gray-800 hover:bg-gray-700 border-2 border-gray-700 hover:border-red-600 rounded-xl py-5 px-4 text-center transition-all group"
          >
            <div className="text-3xl mb-2">🔍</div>
            <div className="text-white font-bold text-lg">Ver perfiles</div>
            <div className="text-gray-400 text-sm mt-1">Navega sin registrarte</div>
          </button>
          <button
            onClick={handleEscortAccess}
            className="bg-red-600 hover:bg-red-700 rounded-xl py-5 px-4 text-center transition-all shadow-lg shadow-red-900/30"
          >
            <div className="text-3xl mb-2">💋</div>
            <div className="text-white font-bold text-lg">Soy Escort</div>
            <div className="text-red-200 text-sm mt-1">Publica gratis hasta 2027</div>
          </button>
        </div>

        {/* Video 1 */}
        <div className="space-y-3">
          <h2 className="text-white font-bold text-lg text-center">¿Cómo funciona Caperucitas.com?</h2>
          <div className="relative w-full rounded-xl overflow-hidden shadow-xl" style={{ paddingTop: '56.25%' }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src="https://www.youtube.com/embed/2WXVJjIioWo"
              title="Cómo funciona Caperucitas.com"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        {/* Video 2 */}
        <div className="space-y-3">
          <h2 className="text-white font-bold text-lg text-center">Descubre todas las funciones</h2>
          <div className="relative w-full rounded-xl overflow-hidden shadow-xl" style={{ paddingTop: '56.25%' }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src="https://www.youtube.com/embed/vUVizeSgAkg"
              title="Funciones de Caperucitas.com"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        {/* Botón ver perfiles */}
        <button
          onClick={() => navigate('/perfiles')}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-xl py-5 rounded-xl transition-colors shadow-lg"
        >
          🔍 Explorar perfiles ahora
        </button>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-6 px-4">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="grid grid-cols-4 gap-2">
            <button onClick={() => navigate('/perfiles')} className="flex flex-col items-center gap-1.5 bg-gray-800 hover:bg-gray-700 rounded-xl p-3 transition-colors">
              <Home className="w-5 h-5 text-red-400" />
              <span className="text-white text-xs font-semibold">Navegar</span>
            </button>
            <button onClick={() => navigate('/roam')} className="flex flex-col items-center gap-1.5 bg-gray-800 hover:bg-gray-700 rounded-xl p-3 transition-colors">
              <Zap className="w-5 h-5 text-yellow-400" fill="currentColor" strokeWidth={0} />
              <span className="text-white text-xs font-semibold">ROAM</span>
            </button>
            <button onClick={() => {
              const shareData = { title: 'Caperucitas.com', text: 'Directorio de escorts en España', url: window.location.origin }
              if (navigator.share) navigator.share(shareData).catch(() => {})
              else { navigator.clipboard.writeText(window.location.origin); alert('¡Enlace copiado!') }
            }} className="flex flex-col items-center gap-1.5 bg-gray-800 hover:bg-gray-700 rounded-xl p-3 transition-colors">
              <Share2 className="w-5 h-5 text-blue-400" />
              <span className="text-white text-xs font-semibold">Compartir</span>
            </button>
            <button onClick={() => navigate('/info')} className="flex flex-col items-center gap-1.5 bg-gray-800 hover:bg-gray-700 rounded-xl p-3 transition-colors">
              <Info className="w-5 h-5 text-gray-400" />
              <span className="text-white text-xs font-semibold">Info</span>
            </button>
          </div>
          <div className="flex justify-center gap-4">
            <a href="https://twitter.com/caperucitascom" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white text-xs">Twitter / X</a>
            <a href="https://instagram.com/caperucitascom" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white text-xs">Instagram</a>
            <a href="https://t.me/caperucitascom" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white text-xs">Telegram</a>
          </div>
          <p className="text-center text-xs text-gray-700">© {new Date().getFullYear()} Caperucitas.com — Solo mayores de 18 años</p>
        </div>
      </footer>
    </div>
  )
}
