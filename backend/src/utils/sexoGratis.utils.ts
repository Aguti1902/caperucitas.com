/** Utilidades freemium para perfiles Sexo gratis */

export const SEXO_GRATIS_LISTING_DAYS = 90
export const SEXO_GRATIS_TRIAL_PREMIUM_DAYS = 30
export const SEXO_GRATIS_PAID_PREMIUM_DAYS = 90
export const SEXO_GRATIS_PREMIUM_PRICE_EUR = 20
export const SEXO_GRATIS_CAROUSEL_RADIUS_KM = 10

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

/** Quita teléfono/WhatsApp públicos si Sexo gratis sin Premium */
export function sanitizePublicContact<T extends Record<string, any>>(profile: T): T & {
  isPremium: boolean
  acceptMessages: boolean
} {
  const isPremium = isSexoGratisPremium(profile)
  const isSexoGratis = profile.profileType === 'sexo_gratis'

  return {
    ...profile,
    isPremium,
    acceptMessages: isSexoGratis ? true : !!profile.acceptMessages,
    phone: isSexoGratis && !isPremium ? null : profile.phone ?? null,
    whatsapp: isSexoGratis && !isPremium ? null : profile.whatsapp ?? null,
  }
}
