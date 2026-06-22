/** Normaliza teléfono a formato internacional sin + (España por defecto) */
export function normalizePhone(raw: string, defaultCountry = '34'): string | null {
  let digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 9 && /^[67]/.test(digits)) digits = defaultCountry + digits;
  if (digits.length < 10) return null;
  return digits;
}
