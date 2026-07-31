/** Solo dígitos y un '+' opcional al inicio (campos teléfono / WhatsApp). */
export function sanitizePhoneInput(value: string): string {
  const cleaned = value.replace(/[^\d+]/g, '')
  if (!cleaned) return ''
  const hasPlus = cleaned.startsWith('+')
  const digits = cleaned.replace(/\+/g, '')
  return hasPlus ? `+${digits}` : digits
}
