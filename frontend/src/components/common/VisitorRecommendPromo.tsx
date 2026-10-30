import { useEffect, useState } from 'react'
import { Ban, Heart, Megaphone, MessageCircle, X } from 'lucide-react'

const STORAGE_KEY = 'cap_visitorRecommendAt'
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export const VISITOR_SHARE_TEXT =
  '¡Hola, amigos!\n\n' +
  '¿Buscas contactos, conocer gente o encontrar compañía cerca de ti?\n\n' +
  'Caperucitas.com es una web donde puedes descubrir perfiles de tu zona de forma sencilla y discreta.\n\n' +
  '¿Buscas sexo gratis? Aquí puedes buscar sexo gratis en nuestra nueva sección "Sexo Gratis".\n' +
  'También puedes encontrar a las mejores escorts que están más cerca de tu ubicación en ese mismo momento.\n\n' +
  '¿Eres escort? Publica tu perfil y consigue más visibilidad. ¡Inscripción gratuita hasta el 1 de julio de 2027!\n\n' +
  '¡Entra ahora y descubre la web!\n' +
  'https://www.caperucitas.com\n\n' +
  'Si conoces a alguien a quien le pueda interesar, ¡compárteselo!\n' +
  '¡Gracias por ayudar a difundirlo!'

export function shouldShowVisitorRecommend(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return true
    const last = Date.parse(raw)
    if (Number.isNaN(last)) return true
    return Date.now() - last >= WEEK_MS
  } catch {
    return true
  }
}

function markVisitorRecommendSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString())
  } catch {
    /* ignore */
  }
}

interface Props {
  forceOpen?: boolean
}

export default function VisitorRecommendPromo({ forceOpen }: Props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (forceOpen || shouldShowVisitorRecommend()) {
      const t = window.setTimeout(() => setOpen(true), 1200)
      return () => window.clearTimeout(t)
    }
  }, [forceOpen])

  const dismiss = () => {
    markVisitorRecommendSeen()
    setOpen(false)
  }

  const shareWhatsApp = () => {
    markVisitorRecommendSeen()
    window.open(
      `https://wa.me/?text=${encodeURIComponent(VISITOR_SHARE_TEXT)}`,
      '_blank',
      'noopener,noreferrer'
    )
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[10050] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/80"
        aria-label="Cerrar"
        onClick={dismiss}
      />

      {/* Compacto: sin botón copiar URL; texto original que invita a colaborar */}
      <div className="relative w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-2.5 right-2.5 z-10 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative bg-gradient-to-br from-red-700 via-red-600 to-pink-700 px-4 pt-5 pb-5 text-center overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -left-6 bottom-0 w-24 h-24 rounded-full bg-black/10" />
          <p className="relative text-white font-black text-xl sm:text-2xl leading-tight drop-shadow">
            ¡Ayúdanos a seguir creciendo!
          </p>
          <Heart className="relative w-6 h-6 text-white mx-auto mt-2 fill-white" />
        </div>

        <div className="px-4 py-3 space-y-2.5 text-center flex-1 overflow-y-auto">
          <p className="text-gray-800 text-sm leading-snug">
            ¿Te gusta <strong className="text-red-600">Caperucitas.com</strong>? Recomiéndanos a
            tus amigos y ayúdanos a llegar a más personas.
          </p>
          <p className="text-gray-600 text-sm leading-snug">
            Con tu apoyo podremos seguir mejorando y mantener nuestra web gratuita para nuestros
            visitantes. ¡No dejes que este proyecto se detenga!
          </p>

          <div className="flex items-start gap-2 bg-pink-100 text-left rounded-xl px-3 py-2.5">
            <Megaphone className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-gray-800 text-sm font-semibold leading-snug">
              Comparte, recomienda y ayúdanos a seguir adelante.
            </p>
          </div>

          <button
            type="button"
            onClick={shareWhatsApp}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-black py-3 rounded-full transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            Recomendar por WhatsApp
          </button>

          <p className="text-gray-700 text-sm font-semibold flex items-center justify-center gap-1.5">
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            ¡Gracias por formar parte de Caperucitas.com!
          </p>
        </div>

        <div className="bg-black px-4 py-3 flex-shrink-0">
          <button
            type="button"
            onClick={dismiss}
            className="w-full inline-flex items-center justify-center gap-2 border-2 border-lime-400 text-lime-400 hover:bg-lime-400 hover:text-black font-black py-3 rounded-xl transition-colors tracking-wide"
          >
            <Ban className="w-4 h-4" />
            NO RECOMENDAR
          </button>
        </div>
      </div>
    </div>
  )
}
