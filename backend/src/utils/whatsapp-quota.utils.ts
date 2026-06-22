import prisma from '../lib/prisma';

export const WHATSAPP_MESSAGE_LIMIT_DEFAULT = 30_000;
export const WHATSAPP_DAILY_LIMIT_DEFAULT = 1_000;

export const QUOTA_EXHAUSTED_MESSAGE =
  'Has agotado tus 30.000 mensajes disponibles. No puedes enviar más hasta recargar. Contacta con el administrador para ampliar tu cuota.';

export const DAILY_QUOTA_EXHAUSTED_MESSAGE =
  'Has alcanzado el límite diario de envíos. La campaña se pausará y podrás reanudarla mañana.';

export interface WhatsAppQuotaInfo {
  limit: number;
  used: number;
  remaining: number;
  exhausted: boolean;
  percentUsed: number;
}

export interface WhatsAppDailyQuotaInfo {
  limit: number;
  usedToday: number;
  remainingToday: number;
  exhausted: boolean;
  percentUsedToday: number;
}

export function getDayStart(): Date {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start;
}

export async function ensureWhatsAppSettings() {
  const envLimit = parseInt(process.env.WHATSAPP_MESSAGE_LIMIT || '', 10);
  const defaultLimit =
    Number.isFinite(envLimit) && envLimit > 0 ? envLimit : WHATSAPP_MESSAGE_LIMIT_DEFAULT;

  const envDaily = parseInt(process.env.WHATSAPP_DAILY_MESSAGE_LIMIT || '', 10);
  const defaultDaily =
    Number.isFinite(envDaily) && envDaily > 0 ? envDaily : WHATSAPP_DAILY_LIMIT_DEFAULT;

  try {
    const { ensureWhatsAppSchemaColumns } = await import('./whatsapp-schema-migrate.utils');
    await ensureWhatsAppSchemaColumns();
  } catch {
    /* ignore */
  }

  try {
    await prisma.whatsAppSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', messageLimit: defaultLimit, dailyMessageLimit: defaultDaily },
      update: {},
    });
  } catch (err) {
    console.warn('ensureWhatsAppSettings upsert:', err);
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO whatsapp_settings (id, "messageLimit", "updatedAt")
        VALUES ('default', ${defaultLimit}, NOW())
        ON CONFLICT (id) DO NOTHING;
      `);
    } catch {
      /* ignore */
    }
  }
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

export async function getWhatsAppDailyMessageLimit(): Promise<number> {
  try {
    await ensureWhatsAppSettings();
    const row = await prisma.whatsAppSettings.findUnique({ where: { id: 'default' } });
    if (row?.dailyMessageLimit && row.dailyMessageLimit > 0) return row.dailyMessageLimit;
  } catch {
    /* tabla aún no migrada */
  }
  const envDaily = parseInt(process.env.WHATSAPP_DAILY_MESSAGE_LIMIT || '', 10);
  return Number.isFinite(envDaily) && envDaily > 0 ? envDaily : WHATSAPP_DAILY_LIMIT_DEFAULT;
}

export async function getMessagesUsedCount(): Promise<number> {
  try {
    return await prisma.whatsAppMessageLog.count({ where: { status: 'sent' } });
  } catch {
    return 0;
  }
}

export async function getMessagesSentTodayCount(): Promise<number> {
  try {
    return await prisma.whatsAppMessageLog.count({
      where: { status: 'sent', sentAt: { gte: getDayStart() } },
    });
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

export async function getWhatsAppDailyQuota(): Promise<WhatsAppDailyQuotaInfo> {
  const limit = await getWhatsAppDailyMessageLimit();
  const usedToday = await getMessagesSentTodayCount();
  const remainingToday = Math.max(0, limit - usedToday);
  return {
    limit,
    usedToday,
    remainingToday,
    exhausted: remainingToday <= 0,
    percentUsedToday: limit > 0 ? Math.min(100, Math.round((usedToday / limit) * 100)) : 100,
  };
}

export async function assertQuotaForSend(
  count = 1
): Promise<{ ok: true; quota: WhatsAppQuotaInfo } | { ok: false; quota: WhatsAppQuotaInfo; error: string }> {
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

export async function assertDailyQuotaForSend(
  count = 1
): Promise<
  { ok: true; dailyQuota: WhatsAppDailyQuotaInfo } | { ok: false; dailyQuota: WhatsAppDailyQuotaInfo; error: string }
> {
  const dailyQuota = await getWhatsAppDailyQuota();
  if (dailyQuota.remainingToday <= 0) {
    return { ok: false, dailyQuota, error: DAILY_QUOTA_EXHAUSTED_MESSAGE };
  }
  if (count > dailyQuota.remainingToday) {
    return {
      ok: false,
      dailyQuota,
      error: `Solo puedes enviar ${dailyQuota.remainingToday.toLocaleString('es-ES')} mensajes más hoy (límite diario: ${dailyQuota.limit.toLocaleString('es-ES')}).`,
    };
  }
  return { ok: true, dailyQuota };
}
