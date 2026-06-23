import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  WHATSAPP_MESSAGE_COST_EUR,
  DEFAULT_DELAY_MS,
  getInstanceStatus,
  sendWhatsAppMessage,
  normalizePhone,
  isWhatsAppConfigured,
  getWhatsAppProvider,
  listInstances,
  getDefaultInstanceName,
  getDefaultSenderPhone,
  createEvolutionInstance,
  getEvolutionQrCode,
  restartEvolutionInstance,
  checkEvolutionHealth,
  getWhatsAppDiagnostics,
  beginWhatsAppPairing,
  sleep,
} from '../services/whatsapp.service';
import { buildPublicUploadUrl } from '../utils/whatsapp-image.utils';
import {
  assertQuotaForSend,
  assertDailyQuotaForSend,
  getWhatsAppQuota,
  getWhatsAppDailyQuota,
  QUOTA_EXHAUSTED_MESSAGE,
} from '../utils/whatsapp-quota.utils';
import { parseContactsFromSpreadsheet } from '../utils/whatsapp-excel.utils';
import { syncWhatsAppStoredCosts, computeWhatsAppCost } from '../utils/whatsapp-cost.utils';
import { upsertWhatsAppContactsBatch } from '../utils/whatsapp-contacts.utils';
import {
  enqueueCampaign,
  resumeCampaign,
  setCampaignStatsHook,
} from '../services/whatsapp-campaign.service';
import {
  clampCampaignDelayMs,
  getMaxCampaignRecipients,
  allowLargeCampaigns,
  WHATSAPP_MIN_DELAY_MS,
  WHATSAPP_MAX_CAMPAIGN_RECIPIENTS,
  WHATSAPP_DAILY_LIMIT_SAFE,
  WHATSAPP_DEFAULT_DELAY_MS,
  getBurstSize,
  getBurstPauseMs,
} from '../utils/whatsapp-safe-limits.utils';
import { isBuiltinConnected, isBuiltinConnecting } from '../services/whatsapp-baileys.service';

let whatsappStatsCache: { data: Record<string, unknown>; expiresAt: number } | null = null;
let profilePhoneCountCache = { count: 0, expiresAt: 0 };
let schemaEnsured = false;

async function ensureWhatsAppSchemaOnce(): Promise<void> {
  if (schemaEnsured) return;
  const { ensureWhatsAppSchema } = await import('../utils/whatsapp-schema-migrate.utils');
  await ensureWhatsAppSchema();
  schemaEnsured = true;
}

setCampaignStatsHook(() => {
  whatsappStatsCache = null;
});

async function countProfilePhones(): Promise<number> {
  if (Date.now() < profilePhoneCountCache.expiresAt) {
    return profilePhoneCountCache.count;
  }
  try {
    const profiles = await prisma.profile.findMany({
      where: {
        isFake: false,
        OR: [{ whatsapp: { not: null } }, { phone: { not: null } }],
      },
      select: { whatsapp: true, phone: true },
    });
    const seen = new Set<string>();
    for (const p of profiles) {
      const n = normalizePhone(p.whatsapp || p.phone || '');
      if (n) seen.add(n);
    }
    profilePhoneCountCache = { count: seen.size, expiresAt: Date.now() + 120_000 };
    return seen.size;
  } catch (err) {
    console.warn('countProfilePhones:', err);
    return profilePhoneCountCache.count;
  }
}

function parsePhoneLines(raw: string): { phone: string; name?: string }[] {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const results: { phone: string; name?: string }[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    let phone = line;
    let name: string | undefined;

    if (line.includes(';')) {
      const [a, b] = line.split(';');
      name = a.trim();
      phone = b.trim();
    } else if (line.includes(',')) {
      const parts = line.split(',');
      if (parts.length >= 2 && parts[0].replace(/\D/g, '').length < 6) {
        name = parts[0].trim();
        phone = parts.slice(1).join(',').trim();
      } else {
        phone = line;
      }
    } else if (line.includes('\t')) {
      const [a, b] = line.split('\t');
      name = a?.trim();
      phone = b?.trim() || line;
    }

    const normalized = normalizePhone(phone);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      results.push({ phone: normalized, name });
    }
  }
  return results;
}

async function upsertContactBatch(
  parsed: { phone: string; name?: string }[],
  source: string
): Promise<{ imported: number; updated: number; total: number }> {
  return upsertWhatsAppContactsBatch(parsed, source);
}

export const getWhatsAppInstances = async (_req: AuthRequest, res: Response) => {
  const data = await listInstances();
  res.json({ ...data, defaultInstance: getDefaultInstanceName(), costPerMessage: WHATSAPP_MESSAGE_COST_EUR });
};

export const getWhatsAppStats = async (_req: AuthRequest, res: Response) => {
  try {
    await ensureWhatsAppSchemaOnce();
    if (whatsappStatsCache && Date.now() < whatsappStatsCache.expiresAt) {
      return res.json(whatsappStatsCache.data);
    }

    await syncWhatsAppStoredCosts();

    const profilePhoneCount = await countProfilePhones();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let sent = 0;
    let failed = 0;
    let pending = 0;
    let totalCostEur = 0;
    let todaySent = 0;
    let contactCount = 0;
    let campaigns = 0;

    try {
      const [waRows] = await prisma.$queryRaw<
        {
          sent: bigint;
          failed: bigint;
          pending: bigint;
          totalCostEur: number | null;
          todaySent: bigint;
          contactCount: bigint;
          campaigns: bigint;
        }[]
      >`
        SELECT
          (SELECT COUNT(*)::bigint FROM whatsapp_message_logs WHERE status = 'sent') AS sent,
          (SELECT COUNT(*)::bigint FROM whatsapp_message_logs WHERE status = 'failed') AS failed,
          (SELECT COUNT(*)::bigint FROM whatsapp_message_logs WHERE status = 'pending') AS pending,
          (SELECT COALESCE(SUM("costEur"), 0)::float FROM whatsapp_message_logs) AS "totalCostEur",
          (SELECT COUNT(*)::bigint FROM whatsapp_message_logs WHERE status = 'sent' AND "sentAt" >= ${todayStart}) AS "todaySent",
          (SELECT COUNT(*)::bigint FROM whatsapp_contacts) AS "contactCount",
          (SELECT COUNT(*)::bigint FROM whatsapp_campaigns) AS campaigns
      `;
      if (waRows) {
        sent = Number(waRows.sent || 0);
        failed = Number(waRows.failed || 0);
        pending = Number(waRows.pending || 0);
        totalCostEur = Number(waRows.totalCostEur || 0);
        todaySent = Number(waRows.todaySent || 0);
        contactCount = Number(waRows.contactCount || 0);
        campaigns = Number(waRows.campaigns || 0);
        totalCostEur = computeWhatsAppCost(sent);
      }
    } catch (dbErr) {
      console.warn('Tablas WhatsApp no disponibles aún:', dbErr);
      try {
        [sent, failed, pending, contactCount, campaigns] = await Promise.all([
          prisma.whatsAppMessageLog.count({ where: { status: 'sent' } }),
          prisma.whatsAppMessageLog.count({ where: { status: 'failed' } }),
          prisma.whatsAppMessageLog.count({ where: { status: 'pending' } }),
          prisma.whatsAppContact.count(),
          prisma.whatsAppCampaign.count(),
        ]);
        todaySent = await prisma.whatsAppMessageLog.count({
          where: { status: 'sent', sentAt: { gte: todayStart } },
        });
        totalCostEur = computeWhatsAppCost(sent);
      } catch (fallbackErr) {
        console.warn('Fallback stats WhatsApp:', fallbackErr);
      }
    }

    let quota: Awaited<ReturnType<typeof getWhatsAppQuota>>;
    let dailyQuota: Awaited<ReturnType<typeof getWhatsAppDailyQuota>>;
    try {
      quota = await getWhatsAppQuota();
    } catch (quotaErr) {
      console.warn('getWhatsAppQuota fallback:', quotaErr);
      quota = { limit: 30_000, used: sent, remaining: Math.max(0, 30_000 - sent), exhausted: false, percentUsed: 0 };
    }
    try {
      dailyQuota = await getWhatsAppDailyQuota();
    } catch (dailyErr) {
      console.warn('getWhatsAppDailyQuota fallback:', dailyErr);
      dailyQuota = {
        limit: 1000,
        usedToday: todaySent,
        remainingToday: Math.max(0, 1000 - todaySent),
        exhausted: todaySent >= 1000,
        percentUsedToday: Math.min(100, Math.round((todaySent / 1000) * 100)),
      };
    }

    let instances: Awaited<ReturnType<typeof listInstances>>['instances'] = [];
    let instance: Awaited<ReturnType<typeof getInstanceStatus>> = {
      configured: isWhatsAppConfigured(),
      connected: false,
      provider: getWhatsAppProvider(),
    };

    try {
      const instancesData = await listInstances();
      instances = instancesData.instances;
      const selectedInstance = getDefaultInstanceName();
      instance = selectedInstance
        ? await getInstanceStatus(selectedInstance)
        : instancesData.instances[0]
          ? await getInstanceStatus(instancesData.instances[0].name)
          : await getInstanceStatus();
    } catch (instErr) {
      console.warn('Error listando instancias WhatsApp:', instErr);
    }

    const payload = {
      costPerMessage: WHATSAPP_MESSAGE_COST_EUR,
      quota,
      dailyQuota,
      totals: {
        sent,
        failed,
        pending,
        totalCostEur,
        contactCount,
        profilePhoneCount,
        campaigns,
        reachableTotal: contactCount + profilePhoneCount,
      },
      todaySent,
      todayCostEur: computeWhatsAppCost(todaySent),
      instance,
      instances,
      evolutionConfigured: isWhatsAppConfigured(),
      whatsappConfigured: isWhatsAppConfigured(),
      provider: getWhatsAppProvider(),
      cachedAt: new Date().toISOString(),
      safeLimits: {
        maxRecipientsPerCampaign: getMaxCampaignRecipients(),
        minDelayMs: WHATSAPP_MIN_DELAY_MS,
        dailyLimitSafe: WHATSAPP_DAILY_LIMIT_SAFE,
        defaultDelayMs: WHATSAPP_DEFAULT_DELAY_MS,
        burstSize: getBurstSize(),
        burstPauseMinutes: Math.ceil(getBurstPauseMs() / 60_000),
      },
    };

    whatsappStatsCache = { data: payload, expiresAt: Date.now() + 45_000 };
    res.json(payload);
  } catch (error) {
    console.error('Error getWhatsAppStats:', error);
    if (whatsappStatsCache) {
      return res.json(whatsappStatsCache.data);
    }
    res.status(500).json({ error: 'Error al obtener estadísticas WhatsApp' });
  }
};

export const getInstanceConnection = async (_req: AuthRequest, res: Response) => {
  const status = await getInstanceStatus();
  res.json({ ...status, costPerMessage: WHATSAPP_MESSAGE_COST_EUR });
};

export const importContacts = async (req: AuthRequest, res: Response) => {
  try {
    const { phones, source = 'import' } = req.body as { phones: string; source?: string };
    if (!phones?.trim()) {
      return res.status(400).json({ error: 'Debes pegar al menos un número de teléfono' });
    }

    const parsed = parsePhoneLines(phones);
    if (parsed.length === 0) {
      return res.status(400).json({ error: 'No se encontraron números válidos' });
    }

    const { imported, updated, total } = await upsertContactBatch(parsed, source);

    res.json({ imported, updated, total, contactCount: await prisma.whatsAppContact.count() });
  } catch (error) {
    console.error('Error importContacts:', error);
    res.status(500).json({ error: 'Error al importar contactos' });
  }
};

export const importContactsExcel = async (req: AuthRequest, res: Response) => {
  try {
    const file = (req as AuthRequest & { file?: { buffer: Buffer; originalname: string } }).file;
    if (!file?.buffer?.length) {
      return res.status(400).json({ error: 'Sube un archivo Excel (.xlsx, .xls) o CSV' });
    }

    const source = String(req.body?.source || 'excel');
    let parsed: { phone: string; name?: string }[];
    try {
      parsed = parseContactsFromSpreadsheet(file.buffer);
    } catch (parseErr) {
      console.error('Error parseando Excel:', parseErr);
      return res.status(400).json({ error: 'No se pudo leer el archivo. Usa .xlsx, .xls o CSV con una columna de teléfono.' });
    }

    if (parsed.length === 0) {
      return res.status(400).json({
        error: 'No se encontraron números válidos en el Excel. Usa columnas como teléfono, móvil o phone.',
      });
    }

    const { imported, updated, total } = await upsertContactBatch(parsed, source);

    res.json({
      imported,
      updated,
      total,
      filename: file.originalname,
      contactCount: await prisma.whatsAppContact.count(),
    });
  } catch (error) {
    console.error('Error importContactsExcel:', error);
    res.status(500).json({ error: 'Error al importar contactos desde Excel' });
  }
};

export const getContacts = async (req: AuthRequest, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const skip = (page - 1) * limit;

    const [contacts, total] = await Promise.all([
      prisma.whatsAppContact.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.whatsAppContact.count(),
    ]);

    res.json({ contacts, total, page, limit });
  } catch (error) {
    res.status(500).json({ error: 'Error al listar contactos' });
  }
};

export const syncProfileContacts = async (_req: AuthRequest, res: Response) => {
  try {
    const profiles = await prisma.profile.findMany({
      where: {
        isFake: false,
        OR: [{ whatsapp: { not: null } }, { phone: { not: null } }],
      },
      select: { id: true, title: true, whatsapp: true, phone: true },
    });

    let synced = 0;
    for (const p of profiles) {
      const raw = p.whatsapp || p.phone;
      if (!raw) continue;
      const phone = normalizePhone(raw);
      if (!phone) continue;

      await prisma.whatsAppContact.upsert({
        where: { phone },
        create: { phone, name: p.title, source: 'profile', profileId: p.id },
        update: { name: p.title, profileId: p.id, source: 'profile' },
      });
      synced++;
    }

    res.json({ synced, contactCount: await prisma.whatsAppContact.count() });
  } catch (error) {
    console.error('Error syncProfileContacts:', error);
    res.status(500).json({ error: 'Error al sincronizar contactos de perfiles' });
  }
};

export const getCampaigns = async (_req: AuthRequest, res: Response) => {
  try {
    await ensureWhatsAppSchemaOnce();
    try {
      await syncWhatsAppStoredCosts();
    } catch {
      /* no bloquear listado */
    }
    const { listWhatsAppCampaigns, withCampaignCost } = await import('../utils/whatsapp-db.utils');
    const campaigns = (await listWhatsAppCampaigns(50)).map(withCampaignCost);
    res.json({ campaigns, costPerMessage: WHATSAPP_MESSAGE_COST_EUR });
  } catch (error) {
    console.error('Error getCampaigns:', error);
    res.json({ campaigns: [], costPerMessage: WHATSAPP_MESSAGE_COST_EUR });
  }
};

export const getCampaignById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const campaign = await prisma.whatsAppCampaign.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 500,
        },
      },
    });
    if (!campaign) return res.status(404).json({ error: 'Campaña no encontrada' });
    res.json({
      campaign: { ...campaign, totalCostEur: computeWhatsAppCost(campaign.sentCount) },
      costPerMessage: WHATSAPP_MESSAGE_COST_EUR,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener campaña' });
  }
};

async function resolveRecipients(source: string, manualPhones?: string): Promise<{ phone: string; name?: string }[]> {
  const recipients: { phone: string; name?: string }[] = [];
  const seen = new Set<string>();

  const add = (phone: string, name?: string) => {
    const n = normalizePhone(phone);
    if (n && !seen.has(n)) {
      seen.add(n);
      recipients.push({ phone: n, name });
    }
  };

  if (source === 'contacts_db' || source === 'mixed') {
    const contacts = await prisma.whatsAppContact.findMany();
    contacts.forEach((c) => add(c.phone, c.name || undefined));
  }

  if (source === 'profiles' || source === 'mixed') {
    const profiles = await prisma.profile.findMany({
      where: {
        isFake: false,
        isPaused: false,
        OR: [{ whatsapp: { not: null } }, { phone: { not: null } }],
      },
      select: { title: true, whatsapp: true, phone: true },
    });
    profiles.forEach((p) => add(p.whatsapp || p.phone || '', p.title));
  }

  if (source === 'manual' && manualPhones) {
    parsePhoneLines(manualPhones).forEach((r) => add(r.phone, r.name));
  }

  return recipients;
}

export const uploadCampaignImage = async (req: AuthRequest, res: Response) => {
  try {
    const file = (
      req as AuthRequest & { file?: { filename: string; size: number; mimetype: string } }
    ).file;
    if (!file) {
      return res.status(400).json({ error: 'No se recibió ninguna imagen' });
    }

    const url = buildPublicUploadUrl(req, file.filename);
    res.json({
      url,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
    });
  } catch (error) {
    console.error('Error uploadCampaignImage:', error);
    res.status(500).json({ error: 'Error al subir imagen' });
  }
};

export const createCampaign = async (req: AuthRequest, res: Response) => {
  try {
    await ensureWhatsAppSchemaOnce();

    const { name, message, imageUrl, source = 'contacts_db', phones, delayMs = DEFAULT_DELAY_MS, instanceName } = req.body;

    const trimmedMessage = message?.trim() || '';
    const trimmedImageUrl = imageUrl?.trim() || '';

    if (!trimmedMessage && !trimmedImageUrl) {
      return res.status(400).json({ error: 'Escribe un mensaje o adjunta una imagen' });
    }
    if (!isWhatsAppConfigured()) {
      return res.status(400).json({ error: 'WhatsApp no está configurado en el servidor' });
    }

    const resolvedInstance = (instanceName || getDefaultInstanceName()).trim();
    if (!resolvedInstance) {
      return res.status(400).json({ error: 'Selecciona el móvil/instancia desde el que enviar' });
    }

    const instance = await getInstanceStatus(resolvedInstance);
    if (!instance.connected) {
      const reconnecting =
        getWhatsAppProvider() === 'builtin' && isBuiltinConnecting(resolvedInstance);
      return res.status(reconnecting ? 503 : 400).json({
        error: reconnecting
          ? 'WhatsApp está reconectando. Espera 10–20 segundos e inténtalo de nuevo.'
          : `WhatsApp "${resolvedInstance}" no conectado: ${instance.error || instance.state || 'sin socket activo en el servidor'}`,
      });
    }

    if (getWhatsAppProvider() === 'builtin' && !isBuiltinConnected(resolvedInstance)) {
      return res.status(503).json({
        error: 'WhatsApp no tiene conexión activa en el servidor. Espera unos segundos tras vincular antes de lanzar la campaña.',
      });
    }

    const { isWhatsAppSendReady } = await import('../services/whatsapp-baileys.service');
    const sendReady = isWhatsAppSendReady(resolvedInstance);
    if (!sendReady.ready && sendReady.waitMs > 0) {
      return res.status(503).json({
        error: sendReady.reason || `Espera ${Math.ceil(sendReady.waitMs / 1000)} segundos tras conectar antes de enviar.`,
        waitMs: sendReady.waitMs,
      });
    }

    const recipients = await resolveRecipients(source, phones);
    if (recipients.length === 0) {
      return res.status(400).json({ error: 'No hay destinatarios válidos para esta campaña' });
    }

    const maxRecipients = getMaxCampaignRecipients();
    if (recipients.length > maxRecipients && !allowLargeCampaigns()) {
      return res.status(400).json({
        error: `Máximo ${maxRecipients} destinatarios por campaña para evitar bloqueo de WhatsApp. Tienes ${recipients.length}. Divide en varios días o contacta al administrador.`,
        maxRecipients,
        recipientCount: recipients.length,
      });
    }

    const safeDelayMs = clampCampaignDelayMs(Number(delayMs) || DEFAULT_DELAY_MS);
    if (safeDelayMs < WHATSAPP_MIN_DELAY_MS) {
      return res.status(400).json({
        error: `El delay mínimo es ${WHATSAPP_MIN_DELAY_MS / 1000} segundos para evitar restricciones de WhatsApp.`,
      });
    }

    const quotaCheck = await assertQuotaForSend(recipients.length);
    if (quotaCheck.ok === false) {
      return res.status(403).json({ error: quotaCheck.error, quota: quotaCheck.quota });
    }

    const dailyCheck = await assertDailyQuotaForSend(Math.min(recipients.length, 1));
    if (dailyCheck.ok === false) {
      return res.status(403).json({ error: dailyCheck.error, dailyQuota: dailyCheck.dailyQuota });
    }

    const campaign = await prisma.whatsAppCampaign.create({
      data: {
        name: name?.trim() || `Campaña ${new Date().toLocaleString('es-ES')}`,
        message: trimmedMessage,
        imageUrl: trimmedImageUrl || null,
        source,
        instanceName: resolvedInstance,
        totalCount: recipients.length,
        delayMs: safeDelayMs,
      },
    });

    const LOG_BATCH = 500;
    for (let i = 0; i < recipients.length; i += LOG_BATCH) {
      const chunk = recipients.slice(i, i + LOG_BATCH);
      await prisma.whatsAppMessageLog.createMany({
        data: chunk.map((r) => ({
          campaignId: campaign.id,
          phone: r.phone,
          name: r.name,
          status: 'pending',
        })),
      });
    }

    // Iniciar campaña tras crear logs (evita colisión con la conexión activa)
    setTimeout(() => enqueueCampaign(campaign.id), 5000);

    const dailyQuota = await getWhatsAppDailyQuota();
    const dailyWarning =
      recipients.length > dailyQuota.remainingToday
        ? `La campaña tiene ${recipients.length.toLocaleString('es-ES')} destinatarios pero hoy solo puedes enviar ${dailyQuota.remainingToday.toLocaleString('es-ES')} más. Se pausará al alcanzar el límite diario (${dailyQuota.limit.toLocaleString('es-ES')}/día) y continuará mañana.`
        : undefined;

    res.status(201).json({
      campaign,
      estimatedCostEur: recipients.length * WHATSAPP_MESSAGE_COST_EUR,
      costPerMessage: WHATSAPP_MESSAGE_COST_EUR,
      dailyQuota,
      dailyWarning,
      safeLimits: {
        maxRecipientsPerCampaign: maxRecipients,
        minDelayMs: WHATSAPP_MIN_DELAY_MS,
        dailyLimitSafe: WHATSAPP_DAILY_LIMIT_SAFE,
      },
    });
  } catch (error) {
    console.error('Error createCampaign:', error);
    res.status(500).json({ error: 'Error al crear campaña' });
  }
};

export const sendTestMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { phone, message, imageUrl, instanceName } = req.body;
    const trimmedMessage = message?.trim() || '';
    const trimmedImageUrl = imageUrl?.trim() || '';

    if (!phone || (!trimmedMessage && !trimmedImageUrl)) {
      return res.status(400).json({ error: 'Teléfono y mensaje o imagen son obligatorios' });
    }

    const quotaCheck = await assertQuotaForSend(1);
    if (quotaCheck.ok === false) {
      return res.status(403).json({ error: quotaCheck.error, quota: quotaCheck.quota });
    }

    const resolvedInstance = (instanceName || getDefaultInstanceName()).trim();
    if (!resolvedInstance) {
      return res.status(400).json({ error: 'Selecciona el móvil/instancia emisor' });
    }

    const result = await sendWhatsAppMessage(phone, trimmedMessage, resolvedInstance, trimmedImageUrl || undefined);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    await prisma.whatsAppMessageLog.create({
      data: {
        phone: normalizePhone(phone)!,
        status: 'sent',
        sentAt: new Date(),
        costEur: WHATSAPP_MESSAGE_COST_EUR,
      },
    });
    whatsappStatsCache = null;

    res.json({
      success: true,
      costEur: WHATSAPP_MESSAGE_COST_EUR,
      phone: normalizePhone(phone),
      instanceName: resolvedInstance,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al enviar mensaje de prueba' });
  }
};

export const cancelCampaign = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.whatsAppCampaign.update({
      where: { id },
      data: { status: 'cancelled', completedAt: new Date(), pauseReason: null },
    });
    res.json({ message: 'Campaña cancelada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al cancelar campaña' });
  }
};

export const resumeCampaignHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await resumeCampaign(id);
    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }
    whatsappStatsCache = null;
    res.json({ message: 'Campaña reanudada', campaignId: id });
  } catch (error) {
    console.error('Error resumeCampaign:', error);
    res.status(500).json({ error: 'Error al reanudar campaña' });
  }
};

export const getRecipientCount = async (req: AuthRequest, res: Response) => {
  try {
    const source = String(req.query.source || 'contacts_db');
    const phones = req.query.phones ? String(req.query.phones) : undefined;
    const recipients = await resolveRecipients(source, phones);
    res.json({
      count: recipients.length,
      estimatedCostEur: recipients.length * WHATSAPP_MESSAGE_COST_EUR,
      costPerMessage: WHATSAPP_MESSAGE_COST_EUR,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al calcular destinatarios' });
  }
};

export const deleteContact = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.whatsAppContact.delete({ where: { id: req.params.id } });
    res.json({ message: 'Contacto eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar contacto' });
  }
};

export const getSetupStatus = async (_req: AuthRequest, res: Response) => {
  try {
    const health = await checkEvolutionHealth();
    const instances = await listInstances();
    const defaultInstance = getDefaultInstanceName();
    const instanceStatus = defaultInstance ? await getInstanceStatus(defaultInstance) : null;

    res.json({
      evolutionConfigured: isWhatsAppConfigured(),
      whatsappConfigured: isWhatsAppConfigured(),
      provider: getWhatsAppProvider(),
      evolutionReachable: health.ok,
      evolutionError: health.error || instances.error,
      defaultInstance,
      defaultSenderPhone: getDefaultSenderPhone() || instanceStatus?.owner || null,
      instanceStatus,
      instances: instances.instances,
      costPerMessage: WHATSAPP_MESSAGE_COST_EUR,
    });
  } catch (error) {
    console.error('Error getSetupStatus:', error);
    res.status(500).json({ error: 'Error al obtener estado de WhatsApp' });
  }
};

export const setupCreateInstance = async (req: AuthRequest, res: Response) => {
  const instanceName = (req.body.instanceName || getDefaultInstanceName() || 'caperucitas').trim();
  const result = await createEvolutionInstance(instanceName);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  const data = result.data as { qrBase64?: string; connected?: boolean; phone?: string } | undefined;
  if (data?.connected) {
    return res.json({
      message: 'WhatsApp ya conectado',
      instanceName,
      connected: true,
      phone: data.phone,
    });
  }

  res.json({
    message: 'Escanea el QR con WhatsApp → Dispositivos vinculados. Tras escanear, espera unos segundos.',
    instanceName,
    qr: data?.qrBase64 ? { base64: data.qrBase64 } : null,
    qrError: !data?.qrBase64 ? 'No se generó QR. Pulsa «Renovar QR».' : undefined,
  });
};

export const setupGetQr = async (req: AuthRequest, res: Response) => {
  const instanceName = String(req.query.instanceName || getDefaultInstanceName() || '').trim();
  if (!instanceName) {
    return res.status(400).json({ error: 'Nombre de instancia requerido' });
  }

  const statusOnly = req.query.statusOnly === 'true' || req.query.statusOnly === '1';
  const status = await getInstanceStatus(instanceName);
  if (status.connected) {
    return res.json({ connected: true, instanceName, owner: status.owner, state: status.state });
  }

  if (statusOnly) {
    const view = await getEvolutionQrCode(instanceName);
    return res.json({
      connected: status.connected,
      instanceName,
      owner: status.owner,
      state: status.state,
      pairing: status.state === 'connecting' || status.state === 'pairing' || view.pairingCode,
      pairingCode: view.pairingCode || null,
    });
  }

  const qr = await getEvolutionQrCode(instanceName);
  if (qr.connected) {
    return res.json({ connected: true, instanceName, owner: qr.owner, state: 'connected' });
  }
  if (!qr.success) {
    return res.json({
      connected: false,
      instanceName,
      state: status.state,
      error: qr.error,
    });
  }
  res.json({
    connected: false,
    instanceName,
    base64: qr.base64,
    pairingCode: qr.pairingCode,
    state: status.state,
  });
};

export const setupRestartInstance = async (req: AuthRequest, res: Response) => {
  const instanceName = (req.body.instanceName || getDefaultInstanceName() || '').trim();
  if (!instanceName) {
    return res.status(400).json({ error: 'Nombre de instancia requerido' });
  }
  const result = await restartEvolutionInstance(instanceName);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  const data = result.data;
  res.json({
    message: 'Instancia reiniciada',
    connected: data?.connected,
    phone: data?.phone,
    qr: data?.qrBase64 ? { base64: data.qrBase64 } : null,
    pairingCode: data?.pairingCode || null,
  });
};

export const setupPairingCode = async (req: AuthRequest, res: Response) => {
  try {
    const instanceName = (req.body.instanceName || getDefaultInstanceName() || 'caperucitas').trim();
    const rawPhone = String(req.body.phone || getDefaultSenderPhone() || '').trim();
    const forceReset = Boolean(req.body.forceReset);
    const useQr = Boolean(req.body.useQr);

    if (!useQr && !rawPhone) {
      return res.status(400).json({ error: 'Introduce el número de WhatsApp emisor (ej. 34612345678)' });
    }

    const phone = rawPhone ? normalizePhone(rawPhone) : null;
    if (!useQr && !phone) {
      return res.status(400).json({ error: 'Número inválido. Usa formato internacional sin + (ej. 34612345678)' });
    }

    const result = await beginWhatsAppPairing(instanceName, {
      pairingPhone: phone || undefined,
      forceReset,
      useQr,
    });
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    const data = result.data;
    if (data?.connected) {
      return res.json({
        message: 'WhatsApp conectado',
        instanceName,
        connected: true,
        phone: data.phone,
      });
    }

    if (data?.qrBase64) {
      return res.json({
        message: 'Escanea el QR con WhatsApp → Dispositivos vinculados → Vincular dispositivo',
        instanceName,
        qr: { base64: data.qrBase64 },
        connected: false,
      });
    }

    res.json({
      message: 'Introduce este código en tu móvil: WhatsApp → Dispositivos vinculados → Vincular con número de teléfono',
      instanceName,
      pairingCode: data?.pairingCode,
      phone,
      connected: false,
    });
  } catch (error) {
    console.error('Error setupPairingCode:', error);
    res.status(500).json({ error: 'Error al vincular WhatsApp' });
  }
};

/** Reconecta sesión guardada sin borrar credenciales (no abre segunda vinculación). */
export const reconnectWhatsAppSession = async (req: AuthRequest, res: Response) => {
  try {
    const instanceName = (req.body.instanceName || getDefaultInstanceName() || '').trim();
    if (!instanceName) {
      return res.status(400).json({ error: 'Instancia no definida' });
    }

    const { requestReconnectOnce, isBuiltinConnected, isBuiltinConnecting, getLastDisconnectInfo } =
      await import('../services/whatsapp-baileys.service');

    requestReconnectOnce(instanceName);

    for (let i = 0; i < 12; i++) {
      await sleep(2000);
      if (isBuiltinConnected(instanceName)) break;
      if (!isBuiltinConnecting(instanceName) && i > 2) break;
    }

    const status = await getInstanceStatus(instanceName);
    whatsappStatsCache = null;

    res.json({
      ...status,
      lastDisconnect: getLastDisconnectInfo(instanceName),
      message: status.connected
        ? 'WhatsApp reconectado'
        : 'Reconectando… Espera 10–20 s y pulsa Actualizar. Si sigue rojo, vincula de nuevo.',
    });
  } catch (error) {
    console.error('reconnectWhatsAppSession:', error);
    res.status(500).json({ error: 'Error al reconectar WhatsApp' });
  }
};

export const setupConnect = async (req: AuthRequest, res: Response) => {
  req.body.instanceName = req.body.instanceName || getDefaultInstanceName();
  return setupPairingCode(req, res);
};

export const getWhatsAppDiagnosticsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const instanceName = String(req.query.instanceName || getDefaultInstanceName() || '').trim();
    const data = await getWhatsAppDiagnostics(instanceName);
    res.json({ provider: getWhatsAppProvider(), ...data });
  } catch (error) {
    console.error('Error getWhatsAppDiagnostics:', error);
    res.status(500).json({ error: 'Error al obtener diagnóstico WhatsApp' });
  }
};

export const getWhatsAppQuotaHandler = async (_req: AuthRequest, res: Response) => {
  try {
    const quota = await getWhatsAppQuota();
    res.json({ quota, quotaExhaustedMessage: QUOTA_EXHAUSTED_MESSAGE });
  } catch (error) {
    console.error('Error getWhatsAppQuota:', error);
    res.status(500).json({ error: 'Error al obtener cuota de mensajes' });
  }
};

export const rechargeWhatsAppQuota = async (req: AuthRequest, res: Response) => {
  try {
    const { messageLimit, dailyMessageLimit } = req.body as {
      messageLimit?: number;
      dailyMessageLimit?: number;
    };

    const update: { messageLimit?: number; dailyMessageLimit?: number } = {};
    if (messageLimit !== undefined) {
      const limit = Number(messageLimit);
      if (!Number.isFinite(limit) || limit < 1) {
        return res.status(400).json({ error: 'Indica un límite total válido (entero > 0)' });
      }
      update.messageLimit = Math.floor(limit);
    }
    if (dailyMessageLimit !== undefined) {
      const daily = Number(dailyMessageLimit);
      if (!Number.isFinite(daily) || daily < 1) {
        return res.status(400).json({ error: 'Indica un límite diario válido (entero > 0)' });
      }
      update.dailyMessageLimit = Math.floor(daily);
    }
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: 'Indica messageLimit y/o dailyMessageLimit' });
    }

    await prisma.whatsAppSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', messageLimit: update.messageLimit ?? 30_000, dailyMessageLimit: update.dailyMessageLimit ?? 1000 },
      update,
    });
    whatsappStatsCache = null;

    const quota = await getWhatsAppQuota();
    const dailyQuota = await getWhatsAppDailyQuota();
    res.json({
      message: 'Cuota actualizada',
      quota,
      dailyQuota,
    });
  } catch (error) {
    console.error('Error rechargeWhatsAppQuota:', error);
    res.status(500).json({ error: 'Error al recargar cuota' });
  }
};

/** Elimina el historial de mensajes enviados (resetea contador de cuota) */
export const resetWhatsAppMessages = async (_req: AuthRequest, res: Response) => {
  try {
    await ensureWhatsAppSchemaOnce();
    const { clearWhatsAppMessageHistory } = await import('../utils/whatsapp-db.utils');
    const deletedCount = await clearWhatsAppMessageHistory();
    whatsappStatsCache = null;

    let quota = { limit: 30_000, used: 0, remaining: 30_000, exhausted: false, percentUsed: 0 };
    let dailyQuota = {
      limit: 150,
      usedToday: 0,
      remainingToday: 150,
      exhausted: false,
      percentUsedToday: 0,
    };
    try {
      quota = await getWhatsAppQuota();
      dailyQuota = await getWhatsAppDailyQuota();
    } catch {
      /* ignore */
    }

    res.json({
      message: `Eliminados ${deletedCount} registros. Cuota restaurada a ${quota.remaining.toLocaleString('es-ES')} mensajes.`,
      deletedCount,
      quota,
      dailyQuota,
    });
  } catch (error) {
    console.error('Error resetWhatsAppMessages:', error);
    res.status(500).json({ error: 'Error al resetear mensajes' });
  }
};
