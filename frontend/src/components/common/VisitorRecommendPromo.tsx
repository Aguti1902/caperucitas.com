import { useEffect, useState } from 'react'
import { Heart, Link2, Megaphone, MessageCircle, X } from 'lucide-react'

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
  /** Si true, fuerza mostrar (útil para tests). Por defecto decide por localStorage semanal. */
  forceOpen?: boolean
}

export default function VisitorRecommendPromo({ forceOpen }: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (forceOpen || shouldShowVisitorRecommend()) {
      // Pequeño delay para no tapar la primera pintura
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

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText('https://www.caperucitas.com')
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      shareWhatsApp()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[10050] flex items-center justify-center p-3 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/80"
        aria-label="Cerrar"
        onClick={dismiss}
      />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-3 right-3 z-10 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Cabecera visual */}
        <div className="relative bg-gradient-to-br from-red-700 via-red-600 to-pink-700 px-5 pt-8 pb-10 text-center overflow-hidden">
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -left-6 bottom-0 w-28 h-28 rounded-full bg-black/10" />
          <p className="relative text-white font-black text-2xl sm:text-3xl leading-tight drop-shadow">
            ¡Ayúdanos a seguir creciendo!
          </p>
          <Heart className="relative w-8 h-8 text-white mx-auto mt-3 fill-white" />
        </div>

        <div className="px-5 py-5 space-y-4 text-center">
          <p className="text-gray-800 text-sm sm:text-base leading-relaxed">
            ¿Te gusta <strong className="text-red-600">Caperucitas.com</strong>? Recomiéndanos a
            tus amigos y ayúdanos a llegar a más personas.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Con tu apoyo podremos seguir mejorando y mantener nuestra web gratuita para nuestros
            visitantes. ¡No dejes que este proyecto se detenga!
          </p>

          <div className="flex items-start gap-2 bg-pink-100 text-left rounded-xl px-3 py-3">
            <Megaphone className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-gray-800 text-sm font-semibold">
              Comparte, recomienda y ayúdanos a seguir adelante.
            </p>
          </div>

          <button
            type="button"
            onClick={copyLink}
            className="w-full inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 rounded-full transition-colors"
          >
            <Link2 className="w-5 h-5" />
            {copied ? '¡Enlace copiado!' : 'https://www.caperucitas.com'}
          </button>

          <button
            type="button"
            onClick={shareWhatsApp}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-black py-3.5 rounded-full transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            Recomendar por WhatsApp
          </button>

          <p className="text-gray-700 text-sm font-semibold flex items-center justify-center gap-1.5">
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            ¡Gracias por formar parte de Caperucitas.com!
          </p>
        </div>

        <div className="bg-black px-5 py-4">
          <button
            type="button"
            onClick={dismiss}
            className="w-full border-2 border-lime-400 text-lime-400 hover:bg-lime-400 hover:text-black font-black py-3 rounded-xl transition-colors tracking-wide"
          >
            NO RECOMENDAR
          </button>
        </div>
      </div>
    </div>
  )
}
