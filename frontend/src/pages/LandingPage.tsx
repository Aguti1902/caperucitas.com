import { useNavigate } from 'react-router-dom'
import Logo from '@/components/common/Logo'
import { useAuthStore } from '@/store/authStore'

export default function LandingPage() {
  const navigate = useNavigate()
  const { isAuthenticated, hasProfile } = useAuthStore()

  const handleEscortAccess = () => {
    if (isAuthenticated && hasProfile) navigate('/app')
    else if (isAuthenticated) navigate('/create-profile')
    else navigate('/register')
  }

  const handleEnter = () => {
    navigate('/perfiles')
  }

  const handleNotAdult = () => {
    window.location.href = 'https://www.google.com'
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header mínimo */}
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-4 flex items-center justify-between h-14">
          <Logo size="sm" />
          <button
            onClick={handleEscortAccess}
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
          >
            Soy Escort
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-0 flex flex-col">

        {/* Banner logo - ancho completo */}
        <img
          src="/logo-caperucitas.jpeg"
          alt="Caperucitas.com"
          className="w-full object-contain"
        />

        <div className="px-5 py-6 space-y-6">

          {/* Texto principal */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-black text-white leading-tight">
              La nueva forma revolucionaria de encontrar Caperucitas cerca de ti.
            </h1>
            <p className="text-red-500 font-bold text-xl">
              ¡Entra y empieza la aventura!
            </p>
          </div>

          {/* Video 1 */}
          <div className="relative w-full rounded-xl overflow-hidden shadow-2xl bg-gray-900" style={{ paddingTop: '56.25%' }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src="https://www.youtube.com/embed/2WXVJjIioWo"
              title="Caperucitas.com - Cómo funciona"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Botones edad */}
          <div className="space-y-3">
            <button
              onClick={handleEnter}
              className="w-full bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-xl py-5 rounded-xl transition-all shadow-lg shadow-red-900/40"
            >
              Tengo 18 años
            </button>
            <button
              onClick={handleNotAdult}
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xl py-5 rounded-xl transition-all"
            >
              No tengo 18 años
            </button>
          </div>

          {/* Texto descriptivo */}
          <div className="space-y-4 text-sm leading-relaxed">
            <p className="text-gray-200">
              En <span className="text-red-500 font-semibold">Caperucitas.com</span> el juego comienza cuando te conviertes en el{' '}
              <span className="text-red-400 font-semibold">Lobo Feroz</span>. Aquí podrás descubrir y "cazar" caperucitas que están cerca de ti, conocer gente nueva y vivir encuentros llenos de misterio, diversión y un toque de travesura.
            </p>
            <p className="text-gray-200">
              Explora, conecta y deja que la aventura empiece... porque en este bosque siempre hay una nueva caperucita esperandote. ¿Te atreves a entrar?
            </p>
          </div>

          {/* Video 2 */}
          <div className="relative w-full rounded-xl overflow-hidden shadow-2xl bg-gray-900" style={{ paddingTop: '56.25%' }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src="https://www.youtube.com/embed/vUVizeSgAkg"
              title="Caperucitas.com - Funciones"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Botón entrar de nuevo al final */}
          <button
            onClick={handleEnter}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-xl py-5 rounded-xl transition-all shadow-lg shadow-red-900/40"
          >
            🐺 Entrar al bosque
          </button>

          {/* Legal */}
          <p className="text-center text-xs text-gray-600 pb-4">
            Al entrar confirmas que tienes 18 años o más y aceptas nuestros{' '}
            <button onClick={() => navigate('/info')} className="text-gray-500 hover:text-gray-400 underline">
              Términos y Condiciones
            </button>
            . © {new Date().getFullYear()} Caperucitas.com
          </p>
        </div>
      </main>
    </div>
  )
}
