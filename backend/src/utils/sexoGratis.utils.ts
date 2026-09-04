/** Utilidades freemium / premium de listado (Sexo gratis + Escorts) */

export const SEXO_GRATIS_LISTING_DAYS = 90
export const SEXO_GRATIS_TRIAL_PREMIUM_DAYS = 30
export const SEXO_GRATIS_PAID_PREMIUM_DAYS = 90
export const SEXO_GRATIS_PREMIUM_PRICE_EUR = 20
export const SEXO_GRATIS_CAROUSEL_RADIUS_KM = 10

/** Premium escorts: 20€ / mes → 30 días de Tel/WhatsApp públicos */
export const ESCORT_PREMIUM_DAYS = 30
export const ESCORT_PREMIUM_PRICE_EUR = 20

/** Inactividad: aviso/pausa a los 90 días (pausa automática desactivada por defecto) */
export const INACTIVITY_PAUSE_DAYS = 90
export const INACTIVITY_WARNING_DAYS = 83 // ~1 semana antes
export const INACTIVITY_EMAIL_EVERY_DAYS = 30
/** Feature flag: pausa automática por inactividad (PDF: OFF hasta que fluya la web) */
export const AUTO_PAUSE_INACTIVE_ENABLED =
  process.env.AUTO_PAUSE_INACTIVE === 'true' || process.env.AUTO_PAUSE_INACTIVE === '1'

export function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000)
}

export function isSexoGratisPremium(profile: {
  profileType?: string | null
  premiumUntil?: Date | string | null
}): boolean {
  if (profile.profileType !== 'sexo_gratis') return false
  if (!profile.premiumUntil) return false
  return new Date(profile.premiumUntil).getTime() > Date.now()
}

/** Premium de listado: Sexo gratis (premiumUntil) o Escort (premiumUntil o suscripción 9plus) */
export function isListingPremium(profile: {
  profileType?: string | null
  premiumUntil?: Date | string | null
  user?: { subscription?: { isActive?: boolean | null } | null } | null
}): boolean {
  if (profile.profileType === 'sexo_gratis') {
    return isSexoGratisPremium(profile)
  }
  // escort
  if (profile.premiumUntil && new Date(profile.premiumUntil).getTime() > Date.now()) {
    return true
  }
  if (profile.user?.subscription?.isActive) return true
  return false
}

export function isListingActive(profile: {
  profileType?: string | null
  listingExpiresAt?: Date | string | null
  isPaused?: boolean
}): boolean {
  if (profile.isPaused) return false
  if (profile.profileType !== 'sexo_gratis') return true
  if (!profile.listingExpiresAt) return true
  return new Date(profile.listingExpiresAt).getTime() > Date.now()
}

/**
 * Contacto público:
 * - Sin Premium → no Tel/WhatsApp; mensajes siempre activos (escorts gratis y sexo gratis)
 * - Con Premium → Tel/WhatsApp visibles si existen
 */
export function sanitizePublicContact<T extends Record<string, any>>(profile: T): T & {
  isPremium: boolean
  acceptMessages: boolean
} {
  const isPremium = isListingPremium(profile)

  return {
    ...profile,
    isPremium,
    acceptMessages: true,
    phone: isPremium ? profile.phone ?? null : null,
    whatsapp: isPremium ? profile.whatsapp ?? null : null,
  }
}
