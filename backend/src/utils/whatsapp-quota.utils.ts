import prisma from '../lib/prisma';

export const WHATSAPP_MESSAGE_LIMIT_DEFAULT = 30_000;

export const QUOTA_EXHAUSTED_MESSAGE =
  'Has agotado tus 30.000 mensajes disponibles. No puedes enviar más hasta recargar. Contacta con el administrador para ampliar tu cuota.';

export interface WhatsAppQuotaInfo {
  limit: number;
  used: number;
  remaining: number;
  exhausted: boolean;
  percentUsed: number;
}

export async function ensureWhatsAppSettings() {
  const envLimit = parseInt(process.env.WHATSAPP_MESSAGE_LIMIT || '', 10);
  const defaultLimit =
    Number.isFinite(envLimit) && envLimit > 0 ? envLimit : WHATSAPP_MESSAGE_LIMIT_DEFAULT;

  await prisma.whatsAppSettings.upsert({
    where: { id: 'default' },
    create: { id: 'default', messageLimit: defaultLimit },
    update: {},
  });
}

export async function getWhatsAppMessageLimit(): Promise<number> {
  try {
    await ensureWhatsAppSettings();
    const row = await prisma.whatsAppSettings.findUnique({ where: { id: 'default' } });
    if (row?.messageLimit && row.messageLimit > 0) return row.messageLimit;
  } catch {
    /* tabla aún no migrada */
  }
  const envLimit = parseInt(process.env.WHATSAPP_MESSAGE_LIMIT || '', 10);
  return Number.isFinite(envLimit) && envLimit > 0 ? envLimit : WHATSAPP_MESSAGE_LIMIT_DEFAULT;
}

export async function getMessagesUsedCount(): Promise<number> {
  try {
    return await prisma.whatsAppMessageLog.count({ where: { status: 'sent' } });
  } catch {
    return 0;
  }
}

export async function getWhatsAppQuota(): Promise<WhatsAppQuotaInfo> {
  const limit = await getWhatsAppMessageLimit();
  const used = await getMessagesUsedCount();
  const remaining = Math.max(0, limit - used);
  return {
    limit,
    used,
    remaining,
    exhausted: remaining <= 0,
    percentUsed: limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 100,
  };
}

export async function assertQuotaForSend(count = 1): Promise<{ ok: true; quota: WhatsAppQuotaInfo } | { ok: false; quota: WhatsAppQuotaInfo; error: string }> {
  const quota = await getWhatsAppQuota();
  if (quota.remaining <= 0) {
    return { ok: false, quota, error: QUOTA_EXHAUSTED_MESSAGE };
  }
  if (count > quota.remaining) {
    return {
      ok: false,
      quota,
      error: `Solo te quedan ${quota.remaining.toLocaleString('es-ES')} mensajes. Esta campaña necesita ${count.toLocaleString('es-ES')}. Contacta con el administrador para recargar.`,
    };
  }
  return { ok: true, quota };
}
