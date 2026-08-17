/** Solo dígitos y un '+' opcional al inicio (campos teléfono). */
export function sanitizePhoneInput(value: string): string {
  const cleaned = value.replace(/[^\d+]/g, '')
  if (!cleaned) return ''
  const hasPlus = cleaned.startsWith('+')
  const digits = cleaned.replace(/\+/g, '')
  return hasPlus ? `+${digits}` : digits
}

/**
 * WhatsApp: teléfono (+34...) o nombre de usuario (@alias / alias).
 * WhatsApp permite contactar con username sin mostrar el número.
 */
export function sanitizeWhatsAppInput(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''

  // Si empieza por @ o tiene letras → tratar como username
  const looksLikeUsername = trimmed.startsWith('@') || /[a-zA-Z_]/.test(trimmed)
  if (looksLikeUsername) {
    // Permitir @, letras, números, puntos, guiones y guiones bajos
    let cleaned = trimmed.replace(/[^a-zA-Z0-9._@-]/g, '')
    if (!cleaned) return ''
    // Un solo @ al inicio
    const hasAt = cleaned.startsWith('@')
    cleaned = cleaned.replace(/@/g, '')
    return hasAt ? `@${cleaned}` : cleaned
  }

  return sanitizePhoneInput(trimmed)
}

/** ¿Es un username de WhatsApp (no teléfono)? */
export function isWhatsAppUsername(value: string | null | undefined): boolean {
  if (!value) return false
  const v = value.trim()
  return v.startsWith('@') || /[a-zA-Z_]/.test(v)
}

/** Enlace wa.me para teléfono o username. */
export function getWhatsAppLink(value: string | null | undefined, text?: string): string | null {
  if (!value?.trim()) return null
  const v = value.trim()
  const q = text ? `?text=${encodeURIComponent(text)}` : ''

  if (isWhatsAppUsername(v)) {
    const user = v.replace(/^@/, '')
    if (!user) return null
    // Formato username de WhatsApp
    return `https://wa.me/${encodeURIComponent(user)}${q}`
  }

  const digits = v.replace(/\D/g, '')
  if (!digits) return null
  return `https://wa.me/${digits}${q}`
}
