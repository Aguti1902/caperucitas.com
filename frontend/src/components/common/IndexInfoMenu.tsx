import { Link } from 'react-router-dom'
import { X, ChevronRight } from 'lucide-react'

export const INDEX_INFO_LINKS = [
  {
    to: '/como-funciona-caperucitas-y-sus-ventajas',
    emoji: '🧭',
    title: '¿Qué estás buscando?',
    subtitle: '¿Quieres saber cómo funciona nuestra web?',
    body:
      'Descubre cómo navegar por la plataforma y conoce todas las opciones que ofrecemos a nuestros visitantes.',
    cta: 'Más info para visitantes',
    accent: 'border-pink-600/50 hover:border-pink-500',
  },
  {
    to: '/publicistas-escorts',
    emoji: '📣',
    title: '¿Eres publicista o profesional del sector?',
    subtitle: 'Anuncia a tus clientes en Caperucitas.com',
    body:
      'Te explicamos cómo anunciar a tus clientes/as en nuestra web, cómo publicar sus perfiles y qué opciones tienes a tu disposición.',
    cta: 'Más info para publicistas',
    accent: 'border-amber-600/50 hover:border-amber-500',
  },
  {
    to: '/info-escorts',
    emoji: '💋',
    title: '¿Eres escort y quieres publicar tu perfil?',
    subtitle: 'Visibilidad, Premium y contacto directo',
    body:
      'Conoce nuestro funcionamiento, descubre cómo dar visibilidad a tu perfil y averigua qué nos hace diferentes del resto de webs.',
    cta: 'Más info para escorts',
    accent: 'border-red-600/50 hover:border-red-500',
  },
  {
    to: '/info-sexo-gratis',
    emoji: '💚',
    title: '¿Buscas encuentros gratuitos y sin ánimo de lucro?',
    subtitle: 'Conoce gente cerca de ti',
    body:
      'Si buscas conocer personas y disfrutar de encuentros sin fines comerciales, este espacio es para ti.',
    cta: 'Más info sexo gratis',
    accent: 'border-emerald-600/50 hover:border-emerald-500',
  },
] as const

interface Props {
  open: boolean
  onClose: () => void
}

export default function IndexInfoMenu({ open, onClose }: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[10040] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/80"
        aria-label="Cerrar"
        onClick={onClose}
      />

      <div className="relative w-full sm:max-w-lg bg-gray-950 border border-gray-700 sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-white font-black text-lg">ℹ️ Info Caperucitas</p>
            <p className="text-gray-400 text-xs">¿Qué estás buscando?</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 space-y-3 pb-6">
          {INDEX_INFO_LINKS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={`block bg-gray-900 border ${item.accent} rounded-xl p-4 transition-colors`}
            >
              <div className="flex gap-3">
                <span className="text-2xl flex-shrink-0" aria-hidden>
                  {item.emoji}
                </span>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-white font-bold text-sm leading-snug">{item.title}</p>
                  <p className="text-gray-400 text-xs font-medium">{item.subtitle}</p>
                  <p className="text-gray-500 text-xs leading-relaxed">{item.body}</p>
                  <p className="inline-flex items-center gap-1 text-red-400 text-xs font-black pt-1">
                    {item.cta}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
