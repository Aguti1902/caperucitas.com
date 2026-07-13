import { useNavigate, Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import SeoHead from '@/components/common/SeoHead'
import { SITE_URL } from '@/utils/citySeo'

export default function LandingPage() {
  const navigate = useNavigate()

  const handleEnter = () => navigate('/perfiles')
  const handleSexoGratis = () => {
    localStorage.setItem('cap_profileSection', 'sexo_gratis')
    navigate('/sexo-gratis/barcelona')
  }
  const handleEscortsCity = () => navigate('/putas/barcelona')
  const handleNotAdult = () => { window.location.href = 'https://www.google.com' }

  const handleShare = () => {
    const msg = encodeURIComponent(
      '🔥 Novedad en Caperucitas.com: nueva sección SEXO GRATIS + escorts cerca de ti.\n\n' +
      'Encuentros consensuados sin pagar, o compañía profesional si lo prefieres.\n\n' +
      '👉 https://www.caperucitas.com'
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <SeoHead
        title="Putas y escorts cerca de ti en España | Caperucitas.com"
        description="Encuentra putas y escorts en tu ciudad. Madrid, Barcelona, Valencia y más de 100 ciudades. Contacto directo, discreto y sin rodeos."
        canonical={SITE_URL}
        keywords="putas, escorts, putas cerca, escorts españa, sexo gratis"
      />
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

          {/* Banner promocional Sexo gratis */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-600/50 bg-gradient-to-br from-emerald-900/80 via-gray-900 to-gray-950 p-5 shadow-xl shadow-emerald-900/20">
            <span className="absolute top-3 right-3 bg-yellow-400 text-gray-900 text-[10px] font-black px-2 py-0.5 rounded-full">
              NUEVO
            </span>
            <p className="text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">Sección exclusiva</p>
            <h2 className="text-white text-xl font-black leading-tight mb-2">
              💚 Sexo gratis — sin pagar, sin rodeos
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              Encuentros consensuados sin compensación económica. También tenemos escorts profesionales
              en otra sección. Más visitas, más perfiles, más opciones cerca de ti.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={handleSexoGratis}
                className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-base py-3.5 rounded-xl transition-all"
              >
                Ver Sexo gratis
              </button>
              <button
                onClick={handleEscortsCity}
                className="w-full bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-base py-3.5 rounded-xl transition-all"
              >
                Ver escorts
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3 justify-center">
              <Link to="/putas/madrid" className="text-xs text-gray-400 hover:text-white underline">Putas Madrid</Link>
              <Link to="/putas/barcelona" className="text-xs text-gray-400 hover:text-white underline">Putas Barcelona</Link>
              <Link to="/putas/valencia" className="text-xs text-gray-400 hover:text-white underline">Putas Valencia</Link>
              <Link to="/ciudades" className="text-xs text-emerald-400 hover:text-emerald-300 underline">Todas las ciudades</Link>
            </div>
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
              className="w-full active:scale-95 text-white font-black text-base py-4 rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap"
              style={{ backgroundColor: '#25D366' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.085.535 4.05 1.477 5.764L.057 23.882a.5.5 0 0 0 .61.61l6.118-1.42A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.88 0-3.63-.49-5.148-1.35l-.368-.214-3.812.885.885-3.812-.214-.368A9.952 9.952 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
              ¡Comparte Caperucitas.com!
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
