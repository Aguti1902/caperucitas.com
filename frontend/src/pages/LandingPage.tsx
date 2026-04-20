import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function LandingPage() {
  const navigate = useNavigate()

  const handleEnter = () => navigate('/perfiles')
  const handleNotAdult = () => { window.location.href = 'https://www.google.com' }

  const handleShare = () => {
    const msg = encodeURIComponent('Hola, mira esta web brutal para adultos donde encontrarás compañía cerca de ti: caperucitas.com, discreta, directa y sin rodeos.')
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
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
            <button
              onClick={handleShare}
              className="w-full active:scale-95 text-white font-black text-xl py-5 rounded-xl transition-all flex items-center justify-center gap-3"
              style={{ backgroundColor: '#25D366' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.085.535 4.05 1.477 5.764L.057 23.882a.5.5 0 0 0 .61.61l6.118-1.42A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.88 0-3.63-.49-5.148-1.35l-.368-.214-3.812.885.885-3.812-.214-.368A9.952 9.952 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
              Si te gusta Caperucitas, ¡compártelo!
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

          {/* Botón entrar al final */}
          <button
            onClick={handleEnter}
            className="w-full bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-xl py-5 rounded-xl transition-all shadow-lg shadow-red-900/40 flex items-center justify-center gap-3"
          >
            <ArrowRight className="w-6 h-6" />
            Entrar al bosque
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
