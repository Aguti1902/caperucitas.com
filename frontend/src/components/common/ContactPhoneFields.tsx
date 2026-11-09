import { DIAL_OPTIONS, joinInternationalPhone, parseInternationalPhone } from '@/utils/countryPhones'
import { isWhatsAppUsername, sanitizeWhatsAppInput } from '@/utils/phoneUtils'

type WaMode = 'phone' | 'username'

interface Props {
  phone: string
  whatsapp: string
  onChange: (next: { phone: string; whatsapp: string }) => void
  phoneLabel?: string
  whatsappLabel?: string
}

/**
 * Teléfono con prefijo internacional (default +34) + WhatsApp
 * en modalidad excluyente: número internacional O nombre de usuario.
 */
export default function ContactPhoneFields({
  phone,
  whatsapp,
  onChange,
  phoneLabel = 'Teléfono (visible en público)',
  whatsappLabel = 'WhatsApp (visible en público)',
}: Props) {
  const phoneParts = parseInternationalPhone(phone)
  const waIsUser = isWhatsAppUsername(whatsapp)
  const waMode: WaMode = waIsUser ? 'username' : 'phone'
  const waParts = waIsUser ? { dial: '+34', national: '' } : parseInternationalPhone(whatsapp)

  const setPhone = (dial: string, national: string) => {
    onChange({ phone: joinInternationalPhone(dial, national), whatsapp })
  }

  const setWaPhone = (dial: string, national: string) => {
    onChange({ phone, whatsapp: joinInternationalPhone(dial, national) })
  }

  const setWaUser = (raw: string) => {
    let cleaned = sanitizeWhatsAppInput(raw)
    if (cleaned && !cleaned.startsWith('@') && /[a-zA-Z_]/.test(cleaned)) {
      cleaned = `@${cleaned.replace(/^@/, '')}`
    }
    onChange({ phone, whatsapp: cleaned })
  }

  const switchWaMode = (mode: WaMode) => {
    if (mode === 'username') {
      onChange({ phone, whatsapp: waIsUser ? whatsapp : '' })
    } else {
      onChange({ phone, whatsapp: waIsUser ? '' : whatsapp })
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">{phoneLabel}</label>
        <div className="flex gap-2">
          <select
            value={phoneParts.dial}
            onChange={(e) => setPhone(e.target.value, phoneParts.national)}
            className="bg-gray-900 border border-gray-600 text-white text-sm rounded-lg px-2 py-2.5 max-w-[42%] focus:outline-none focus:ring-1 focus:ring-red-500"
            aria-label="Prefijo teléfono"
          >
            {DIAL_OPTIONS.map((o) => (
              <option key={o.dial} value={o.dial}>
                {o.label}
              </option>
            ))}
          </select>
          <input
            type="tel"
            inputMode="numeric"
            value={phoneParts.national}
            onChange={(e) => setPhone(phoneParts.dial, e.target.value.replace(/\D/g, ''))}
            placeholder="600000000"
            className="flex-1 bg-gray-900 border border-gray-600 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>
        <p className="text-gray-500 text-[11px] mt-1">Por defecto España (+34). Puedes elegir otro país.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">{whatsappLabel}</label>
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => switchWaMode('phone')}
            className={`flex-1 text-xs font-bold py-2 rounded-lg border transition-colors ${
              waMode === 'phone'
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-gray-900 border-gray-700 text-gray-400'
            }`}
          >
            Número de teléfono
          </button>
          <button
            type="button"
            onClick={() => switchWaMode('username')}
            className={`flex-1 text-xs font-bold py-2 rounded-lg border transition-colors ${
              waMode === 'username'
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-gray-900 border-gray-700 text-gray-400'
            }`}
          >
            Nombre de usuario
          </button>
        </div>

        {waMode === 'phone' ? (
          <div className="flex gap-2">
            <select
              value={waParts.dial}
              onChange={(e) => setWaPhone(e.target.value, waParts.national)}
              className="bg-gray-900 border border-gray-600 text-white text-sm rounded-lg px-2 py-2.5 max-w-[42%] focus:outline-none focus:ring-1 focus:ring-emerald-500"
              aria-label="Prefijo WhatsApp"
            >
              {DIAL_OPTIONS.map((o) => (
                <option key={`wa-${o.dial}`} value={o.dial}>
                  {o.label}
                </option>
              ))}
            </select>
            <input
              type="tel"
              inputMode="numeric"
              value={waParts.national}
              onChange={(e) => setWaPhone(waParts.dial, e.target.value.replace(/\D/g, ''))}
              placeholder="600000000"
              className="flex-1 bg-gray-900 border border-gray-600 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        ) : (
          <input
            type="text"
            inputMode="text"
            value={whatsapp}
            onChange={(e) => setWaUser(e.target.value)}
            placeholder="@tunombreusuario"
            className="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        )}
        <p className="text-gray-500 text-[11px] mt-1">
          Elige solo una modalidad: número internacional o usuario de WhatsApp (no las dos).
        </p>
      </div>
    </div>
  )
}
