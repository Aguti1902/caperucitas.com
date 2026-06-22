/** Límites conservadores para evitar restricciones de WhatsApp (spam / mensajería masiva). */

/** Mensajes máximos a contactos nuevos por día (WhatsApp penaliza >~200/día en cuentas personales). */
export const WHATSAPP_DAILY_LIMIT_SAFE = 150;

/** Delay mínimo entre mensajes (ms). Por debajo de 8 s aumenta mucho el riesgo de bloqueo. */
export const WHATSAPP_MIN_DELAY_MS = 8_000;

/** Delay recomendado por defecto. */
export const WHATSAPP_DEFAULT_DELAY_MS = 12_000;

/** Máximo destinatarios por campaña a contactos fríos. */
export const WHATSAPP_MAX_CAMPAIGN_RECIPIENTS = 200;

/** Mensajes seguidos antes de pausa obligatoria (cuentas personales / con historial de spam). */
export const WHATSAPP_BURST_SIZE = 15;

/** Pausa entre lotes (ms) — simula uso humano y evita logout ~15–20 msgs. */
export const WHATSAPP_BURST_PAUSE_MS = 30 * 60 * 1000;

export const WHATSAPP_BURST_PAUSE_MESSAGE =
  'Pausa anti-spam automática tras un lote de mensajes. La campaña continuará sola cuando termine la espera.';

export const WHATSAPP_RESTRICTION_PAUSE_MESSAGE =
  'WhatsApp ha restringido la cuenta (spam/mensajería masiva). Espera a que se levante la restricción (~6 h) antes de reanudar. Solo envía a contactos que te hayan escrito primero.';

export function getConfiguredDailyLimit(): number {
  const env = parseInt(process.env.WHATSAPP_DAILY_MESSAGE_LIMIT || '', 10);
  if (Number.isFinite(env) && env > 0) return env;
  return WHATSAPP_DAILY_LIMIT_SAFE;
}

export function getMinDelayMs(): number {
  const env = parseInt(process.env.WHATSAPP_MIN_DELAY_MS || '', 10);
  if (Number.isFinite(env) && env >= 5000) return env;
  return WHATSAPP_MIN_DELAY_MS;
}

export function getMaxCampaignRecipients(): number {
  const env = parseInt(process.env.WHATSAPP_MAX_CAMPAIGN_RECIPIENTS || '', 10);
  if (Number.isFinite(env) && env > 0) return env;
  return WHATSAPP_MAX_CAMPAIGN_RECIPIENTS;
}

export function getBurstSize(): number {
  const env = parseInt(process.env.WHATSAPP_BURST_SIZE || '', 10);
  if (Number.isFinite(env) && env >= 5 && env <= 50) return env;
  return WHATSAPP_BURST_SIZE;
}

export function getBurstPauseMs(): number {
  const env = parseInt(process.env.WHATSAPP_BURST_PAUSE_MS || '', 10);
  if (Number.isFinite(env) && env >= 60_000) return env;
  return WHATSAPP_BURST_PAUSE_MS;
}

export function isBurstPauseReason(reason?: string | null): boolean {
  if (!reason) return false;
  return reason.includes('Pausa anti-spam automática') || reason.includes(WHATSAPP_BURST_PAUSE_MESSAGE.slice(0, 30));
}

export function burstPauseRemainingMs(pausedAt: Date | null | undefined, pauseMs = getBurstPauseMs()): number {
  if (!pausedAt) return 0;
  return Math.max(0, pauseMs - (Date.now() - pausedAt.getTime()));
}

export function clampCampaignDelayMs(delayMs: number): number {
  const min = getMinDelayMs();
  const max = 60_000;
  return Math.max(min, Math.min(Number(delayMs) || WHATSAPP_DEFAULT_DELAY_MS, max));
}

/** Variación aleatoria ±25 % para que el envío no parezca un bot. */
export function jitterDelayMs(baseMs: number): number {
  const factor = 0.75 + Math.random() * 0.5;
  return Math.round(baseMs * factor);
}

export function isWhatsAppRestrictionError(error?: string): boolean {
  if (!error) return false;
  const lower = error.toLowerCase();
  return (
    lower.includes('restrict') ||
    lower.includes('restring') ||
    lower.includes('spam') ||
    lower.includes('banned') ||
    lower.includes('ban ') ||
    lower.includes('not authorized') ||
    lower.includes('automated') ||
    lower.includes('masiva') ||
    lower.includes('business integrity')
  );
}

export function allowLargeCampaigns(): boolean {
  return process.env.WHATSAPP_ALLOW_LARGE_CAMPAIGNS === 'true';
}
