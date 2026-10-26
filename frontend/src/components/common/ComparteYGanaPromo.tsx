import { useEffect, useState } from 'react'
import { CheckCircle2, MessageCircle, Users, X } from 'lucide-react'

export const SHARE_TEXT =
  '¿Eres escort o buscas encuentros cerca de ti? Entra en Caperucitas.com\n\n' +
  'Si eres escort, publica tu perfil, gana visibilidad y llega a personas interesadas en conocerte.\n' +
  'Además, aprovecha nuestra promoción y disfruta de la inscripción gratuita hasta el 1 de julio de 2027.\n\n' +
  '¿Buscas sexo gratis, conocer gente o encontrar compañía cerca de ti? Descubre perfiles de tu zona y encuentra personas con las que conectar.\n\n' +
  'Escorts y contactos cerca de ti, de forma discreta y sencilla.\n\n' +
  'Entra ahora en https://www.caperucitas.com\n\n' +
  'Caperucitas.com — Tanto si buscas contactos como si quieres promocionar tu perfil, ¡te esperamos!'

export const PROMO_STORAGE_KEY = 'cap_promoShareUntil'
/** Quien participa en la promo queda gratis hasta julio 2027 (según PDF: no verificamos envíos) */
export const PROMO_UNTIL_ISO = '2027-07-01'
export const PROMO_UNTIL_LABEL = '1 de julio de 2027'

type Phase = 'intro' | 'options' | 'countdown' | 'success'

interface Props {
  open: boolean
  onClose: () => void
  onPromoClaimed?: () => void
}

function openWhatsAppShare() {
  const url = `https://wa.me/?text=${encodeURIComponent(SHARE_TEXT)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

export function hasClaimedComparteYGana(): boolean {
  try {
    return Boolean(localStorage.getItem(PROMO_STORAGE_KEY))
  } catch {
    return false
  }
}

export function claimComparteYGanaPromo() {
  try {
    localStorage.setItem(PROMO_STORAGE_KEY, PROMO_UNTIL_ISO)
    localStorage.setItem('cap_promoShareClaimedAt', new Date().toISOString())
  } catch {
    /* ignore */
  }
}

export default function ComparteYGanaPromo({ open, onClose, onPromoClaimed }: Props) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [secondsLeft, setSecondsLeft] = useState(120)
  const [successSeconds, setSuccessSeconds] = useState(5)

  useEffect(() => {
    if (!open) {
      setPhase('intro')
      setSecondsLeft(120)
      setSuccessSeconds(5)
      return
    }
    setPhase('intro')
    setSecondsLeft(120)
    setSuccessSeconds(5)
  }, [open])

  const finishWithSuccess = () => {
    claimComparteYGanaPromo()
    onPromoClaimed?.()
    setSuccessSeconds(5)
    setPhase('success')
  }

  useEffect(() => {
    if (!open || phase !== 'countdown') return
    if (secondsLeft <= 0) {
      finishWithSuccess()
      return
    }
    const t = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, phase, secondsLeft])

  useEffect(() => {
    if (!open || phase !== 'success') return
    if (successSeconds <= 0) {
      onClose()
      return
    }
    const t = window.setTimeout(() => setSuccessSeconds((s) => s - 1), 1000)
    return () => window.clearTimeout(t)
  }, [open, phase, successSeconds, onClose])

  if (!open) return null

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')

  const startShare = (_tier: 10 | 20) => {
    openWhatsAppShare()
    claimComparteYGanaPromo()
    onPromoClaimed?.()
    setSecondsLeft(120)
    setPhase('countdown')
  }

  return (
    <div className="fixed inset-0 z-[10060] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/80"
        aria-label="Cerrar"
        onClick={() => {
          if (phase === 'countdown') {
            finishWithSuccess()
            return
          }
          if (phase === 'success') {
            onClose()
            return
          }
          onClose()
        }}
      />

      {phase === 'intro' && (
        <div className="relative w-full max-w-md bg-gray-950 border border-red-700/60 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-white z-10"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="px-5 pt-8 pb-5 text-center space-y-3">
            <p className="text-red-500 font-black text-3xl tracking-wide">¡STOP!</p>
            <p className="text-white font-bold text-lg leading-snug">
              ¡NO PAGUES POR TU INSCRIPCIÓN!
            </p>
            <div className="mx-auto w-24 h-24 rounded-full border-4 border-red-600 flex items-center justify-center bg-red-950/40">
              <span className="text-red-400 font-black text-xl">STOP</span>
            </div>
            <p className="text-white font-bold text-base pt-1">
              ¿Quieres ampliar tu inscripción GRATIS?
            </p>
            <p className="text-gray-300 text-sm leading-relaxed">
              ¡Consigue mantener tu inscripción gratuita hasta el{' '}
              <strong className="text-white">1 de julio de 2027</strong>!
            </p>
            <div className="h-px bg-red-800/60 my-2" />
            <p className="text-gray-400 text-sm text-left">Es muy fácil. Solo tienes que:</p>
            <ol className="text-left space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-red-600 text-white font-black flex items-center justify-center text-xs">
                  1
                </span>
                <div>
                  <p className="text-white font-semibold">Recomendar Caperucitas.com</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    Comparte nuestra web con 10–20 contactos tuyos por WhatsApp.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-red-600 text-white font-black flex items-center justify-center text-xs">
                  2
                </span>
                <div>
                  <p className="text-white font-semibold">Comparte y participa</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    Sigue las instrucciones para completar la promoción.
                  </p>
                </div>
              </li>
            </ol>
          </div>

          <div className="px-5 pb-5 space-y-3">
            <button
              type="button"
              onClick={() => setPhase('options')}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-3.5 rounded-xl transition-colors text-sm sm:text-base"
            >
              🚀 QUIERO MI INSCRIPCIÓN GRATIS
            </button>
            <p className="text-[10px] text-gray-500 text-center">
              Promoción sujeta a las condiciones publicadas en la web.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-sky-600 hover:bg-sky-500 text-white font-black py-3 rounded-xl transition-colors text-sm"
            >
              NO QUIERO LA PROMOCIÓN
            </button>
          </div>
        </div>
      )}

      {phase === 'options' && (
        <div className="relative w-full max-w-lg bg-gradient-to-b from-emerald-700 to-emerald-900 border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 text-white/70 hover:text-white z-10"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="px-5 pt-7 pb-5 text-center space-y-2">
            <p className="text-white font-black text-lg tracking-wide">Caperucitas.com</p>
            <div className="inline-block bg-yellow-300 text-emerald-900 font-black text-sm sm:text-base px-4 py-2 rounded-lg -rotate-1 shadow">
              CONSIGUE TU INSCRIPCIÓN GRATIS
            </div>
            <p className="text-white font-bold text-sm pt-1">
              ¡Recomienda nuestra web y consigue más meses gratis!
            </p>
          </div>

          <div className="px-4 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => startShare(10)}
              className="bg-white rounded-2xl p-4 text-left shadow-lg hover:scale-[1.02] transition-transform"
            >
              <div className="inline-flex items-center gap-1.5 bg-emerald-700 text-white text-xs font-black px-3 py-1.5 rounded-full mb-3">
                <MessageCircle className="w-3.5 h-3.5" />
                CLICA AQUÍ
              </div>
              <p className="text-gray-700 text-xs font-semibold">Y COMPARTE CON</p>
              <p className="bg-yellow-300 text-emerald-900 font-black text-sm px-2 py-1 rounded mt-1 inline-block">
                10 DE TUS CONTACTOS
              </p>
              <p className="mt-3 bg-emerald-800 text-yellow-300 text-[11px] font-black text-center py-2 rounded-full">
                GRATIS HASTA EL 1 DE ABRIL DE 2027
              </p>
              <div className="flex items-center justify-center gap-2 mt-3 text-emerald-700">
                <Users className="w-5 h-5" />
                <span className="w-8 h-8 rounded-full bg-emerald-100 font-black flex items-center justify-center text-sm">
                  10
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => startShare(20)}
              className="bg-white rounded-2xl p-4 text-left shadow-lg ring-2 ring-red-500 hover:scale-[1.02] transition-transform relative"
            >
              <span className="absolute -top-2 right-3 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                RECOMENDADO
              </span>
              <div className="inline-flex items-center gap-1.5 bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-full mb-3">
                <MessageCircle className="w-3.5 h-3.5" />
                CLICA AQUÍ
              </div>
              <p className="text-gray-700 text-xs font-semibold">Y COMPARTE CON</p>
              <p className="bg-yellow-300 text-red-800 font-black text-sm px-2 py-1 rounded mt-1 inline-block">
                20 DE TUS CONTACTOS
              </p>
              <p className="mt-3 bg-red-700 text-yellow-300 text-[11px] font-black text-center py-2 rounded-full">
                GRATUITA HASTA EL 1 DE JULIO DE 2027
              </p>
              <div className="flex items-center justify-center gap-2 mt-3 text-red-600">
                <Users className="w-5 h-5" />
                <span className="w-8 h-8 rounded-full bg-red-100 font-black flex items-center justify-center text-sm">
                  20
                </span>
              </div>
            </button>
          </div>

          <p className="text-center text-white/90 italic text-sm pb-5">¡Gracias por compartir!</p>
        </div>
      )}

      {phase === 'countdown' && (
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border-2 border-red-600 overflow-hidden">
          <button
            type="button"
            onClick={finishWithSuccess}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 z-10"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="px-5 pt-6 pb-4 text-center space-y-3">
            <p className="text-gray-900 font-black text-lg">Caperucitas.com</p>
            <p className="text-gray-800 font-semibold text-base">Tienes</p>
            <div className="inline-flex items-center gap-3 bg-red-600 text-white font-black text-2xl px-5 py-3 rounded-xl">
              2 MINUTOS
              <span className="text-lg tabular-nums bg-red-800/40 px-2 py-1 rounded-lg">
                {mm}:{ss}
              </span>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">
              para compartir{' '}
              <strong className="text-red-600">Caperucitas.com</strong> con tus contactos y
              continuar con la promoción.
            </p>
            <button
              type="button"
              onClick={openWhatsAppShare}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-black py-3.5 rounded-full transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              ¡Comparte ahora por WhatsApp!
            </button>
          </div>

          <div className="bg-pink-100 px-4 py-3 flex items-start gap-2">
            <Users className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-gray-800 text-xs leading-relaxed text-left">
              Al compartir, ayudas a que más personas descubran Caperucitas.com y también puedan
              beneficiarse de esta promoción.
            </p>
          </div>

          <div className="px-5 py-3">
            <button
              type="button"
              onClick={finishWithSuccess}
              className="w-full text-sm text-gray-500 hover:text-gray-800 font-semibold py-2"
            >
              Ya he compartido — continuar registro
            </button>
          </div>
        </div>
      )}

      {phase === 'success' && (
        <div className="relative w-full max-w-md bg-gradient-to-b from-emerald-600 to-emerald-900 border border-emerald-400/50 rounded-2xl shadow-2xl overflow-hidden px-6 py-8 text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-yellow-300 mx-auto" />
          <p className="text-white font-black text-2xl leading-tight">
            ¡Promoción conseguida!
          </p>
          <p className="text-emerald-100 text-sm leading-relaxed">
            Tu inscripción queda gratuita hasta el{' '}
            <strong className="text-white">1 de julio de 2027</strong>.
            Continúa con el registro…
          </p>
          <div className="inline-flex items-center justify-center bg-black/30 text-white font-black text-lg px-4 py-2 rounded-xl tabular-nums">
            {successSeconds}s
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-white text-emerald-800 font-black py-3 rounded-xl hover:bg-emerald-50 transition-colors"
          >
            Continuar ahora
          </button>
        </div>
      )}
    </div>
  )
}
