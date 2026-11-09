/** Prefijos internacionales — España (+34) por defecto */
export const DIAL_OPTIONS: { dial: string; label: string }[] = [
  { dial: '+34', label: '🇪🇸 +34 España' },
  { dial: '+351', label: '🇵🇹 +351 Portugal' },
  { dial: '+33', label: '🇫🇷 +33 Francia' },
  { dial: '+39', label: '🇮🇹 +39 Italia' },
  { dial: '+49', label: '🇩🇪 +49 Alemania' },
  { dial: '+44', label: '🇬🇧 +44 Reino Unido' },
  { dial: '+32', label: '🇧🇪 +32 Bélgica' },
  { dial: '+31', label: '🇳🇱 +31 Países Bajos' },
  { dial: '+41', label: '🇨🇭 +41 Suiza' },
  { dial: '+43', label: '🇦🇹 +43 Austria' },
  { dial: '+376', label: '🇦🇩 +376 Andorra' },
  { dial: '+212', label: '🇲🇦 +212 Marruecos' },
  { dial: '+1', label: '🇺🇸 +1 USA/Canadá' },
  { dial: '+52', label: '🇲🇽 +52 México' },
  { dial: '+54', label: '🇦🇷 +54 Argentina' },
  { dial: '+57', label: '🇨🇴 +57 Colombia' },
  { dial: '+56', label: '🇨🇱 +56 Chile' },
  { dial: '+51', label: '🇵🇪 +51 Perú' },
  { dial: '+58', label: '🇻🇪 +58 Venezuela' },
  { dial: '+55', label: '🇧🇷 +55 Brasil' },
  { dial: '+593', label: '🇪🇨 +593 Ecuador' },
  { dial: '+40', label: '🇷🇴 +40 Rumanía' },
  { dial: '+48', label: '🇵🇱 +48 Polonia' },
  { dial: '+7', label: '🇷🇺 +7 Rusia' },
  { dial: '+86', label: '🇨🇳 +86 China' },
  { dial: '+81', label: '🇯🇵 +81 Japón' },
  { dial: '+971', label: '🇦🇪 +971 EAU' },
]

export function parseInternationalPhone(value: string | null | undefined): {
  dial: string
  national: string
} {
  const raw = (value || '').trim()
  if (!raw) return { dial: '+34', national: '' }
  const digits = raw.replace(/[^\d+]/g, '')
  if (!digits.startsWith('+')) {
    return { dial: '+34', national: digits.replace(/\D/g, '') }
  }
  const dials = DIAL_OPTIONS.map((d) => d.dial).sort((a, b) => b.length - a.length)
  for (const dial of dials) {
    if (digits.startsWith(dial)) {
      return { dial, national: digits.slice(dial.length).replace(/\D/g, '') }
    }
  }
  return { dial: '+34', national: digits.replace(/\D/g, '') }
}

export function joinInternationalPhone(dial: string, national: string): string {
  const n = national.replace(/\D/g, '')
  if (!n) return ''
  return `${dial}${n}`
}
