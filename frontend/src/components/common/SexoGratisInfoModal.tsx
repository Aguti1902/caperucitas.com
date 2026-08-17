import { Info, X } from 'lucide-react'

interface SexoGratisInfoModalProps {
  isOpen: boolean
  onClose: () => void
}

/** Contenido compartido del modal +INFO de Sexo gratis (index / listado / páginas Info). */
export const SEXO_GRATIS_INFO = {
  title: 'Nueva sección de Sexo Gratis en Caperucitas.com',
  paragraphs: [
    'En Caperucitas.com estrenamos nuestra nueva sección de Sexo Gratis, donde puedes crear tu perfil y conocer chicas y chicos heterosexuales o gays cerca de ti.',
    'Crear tu perfil es 100% gratis y, al registrarte, disfrutarás de 1 mes de PREMIUM gratis.',
    'Con PREMIUM, tendrás máxima visibilidad: tu perfil aparecerá en primera fila y podrás recibir contactos directos por WhatsApp y llamadas, para conectar más rápido.',
    '¿Prefieres seguir con la opción gratuita? También puedes hacerlo. Tu perfil permanecerá publicado durante 3 meses, podrás renovarlo gratis cada 3 meses y tendrás disponible el contacto mediante mensajes.',
    '🚀 ¿Quieres más visibilidad y contactos más rápidos? Contrata PREMIUM por solo 20 € cada 3 meses, precio promocional, y aparece en el carrusel de perfiles destacados, en primera fila, para que te vean desde el primer vistazo. Además, podrán contactarte directamente por WhatsApp y llamadas, además de recibir mensajes.',
  ],
  redWarning:
    'En esta sección no se puede pedir compensación económica o serás expulsado/a, para ello tienes la sección "escorts".',
}

export default function SexoGratisInfoModal({ isOpen, onClose }: SexoGratisInfoModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-gray-900 rounded-2xl shadow-2xl border border-emerald-800/50 overflow-hidden max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-emerald-900/20 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <h2 className="text-white font-bold text-base leading-snug">
              {SEXO_GRATIS_INFO.title} <span aria-hidden>🆕</span>
            </h2>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white flex-shrink-0 ml-2">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3 text-sm text-gray-300 leading-relaxed overflow-y-auto">
          {SEXO_GRATIS_INFO.paragraphs.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
          <p className="text-red-400 font-semibold text-sm bg-red-950/40 border border-red-700/40 rounded-xl px-3 py-2">
            {SEXO_GRATIS_INFO.redWarning}
          </p>
        </div>
        <div className="px-5 pb-4 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}
