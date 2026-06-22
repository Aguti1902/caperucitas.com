import prisma from '../lib/prisma';
import {
  WHATSAPP_MESSAGE_COST_EUR,
  DEFAULT_DELAY_MS,
  sendWhatsAppMessage,
  sleep,
} from './whatsapp.service';
import {
  assertQuotaForSend,
  assertDailyQuotaForSend,
  DAILY_QUOTA_EXHAUSTED_MESSAGE,
  QUOTA_EXHAUSTED_MESSAGE,
} from '../utils/whatsapp-quota.utils';
import { isBuiltinConnected, isBuiltinConnecting } from './whatsapp-baileys.service';
import {
  isWhatsAppRestrictionError,
  jitterDelayMs,
  WHATSAPP_RESTRICTION_PAUSE_MESSAGE,
  WHATSAPP_BURST_PAUSE_MESSAGE,
  getBurstSize,
  getBurstPauseMs,
  isBurstPauseReason,
  burstPauseRemainingMs,
} from '../utils/whatsapp-safe-limits.utils';

const runningCampaigns = new Set<string>();
const resumeTimers = new Map<string, ReturnType<typeof setTimeout>>();
const burstResumeTimers = new Map<string, ReturnType<typeof setTimeout>>();

let onStatsChange: (() => void) | undefined;

export function setCampaignStatsHook(fn: () => void): void {
  onStatsChange = fn;
}

function touchStats(): void {
  onStatsChange?.();
}

function clearBurstTimer(campaignId: string) {
  const t = burstResumeTimers.get(campaignId);
  if (t) {
    clearTimeout(t);
    burstResumeTimers.delete(campaignId);
  }
}

function scheduleBurstResume(campaignId: string, delayMs: number): void {
  clearBurstTimer(campaignId);
  const mins = Math.ceil(delayMs / 60_000);
  console.log(`[WhatsApp] Campaña ${campaignId}: pausa anti-spam ${mins} min antes de continuar`);
  const timer = setTimeout(() => {
    burstResumeTimers.delete(campaignId);
    enqueueCampaign(campaignId);
  }, delayMs);
  burstResumeTimers.set(campaignId, timer);
}

async function pauseForBurst(campaignId: string): Promise<void> {
  const pauseMs = getBurstPauseMs();
  const mins = Math.ceil(pauseMs / 60_000);
  await pauseCampaign(
    campaignId,
    `${PAUSE_REASON_BURST} Espera ${mins} min (continúa sola).`
  );
  scheduleBurstResume(campaignId, pauseMs);
}

export const MAX_SEND_RETRIES = 3;
export const RETRY_BASE_MS = 3000;
export const AUTO_RESUME_DELAY_MS = 8000;
export const CAMPAIGN_WARMUP_MS = 8000;

export const PAUSE_REASON_DISCONNECT =
  'WhatsApp desconectado (WhatsApp puede haber cerrado la sesión por envío masivo). Vincula de nuevo y pulsa Reanudar.';
export const PAUSE_REASON_DAILY = DAILY_QUOTA_EXHAUSTED_MESSAGE;
export const PAUSE_REASON_RESTRICTION = WHATSAPP_RESTRICTION_PAUSE_MESSAGE;
export const PAUSE_REASON_BURST = WHATSAPP_BURST_PAUSE_MESSAGE;

type SendOutcome =
  | { type: 'sent' }
  | { type: 'failed'; error: string }
  | { type: 'pause'; reason: string };

function isDisconnectError(error?: string): boolean {
  if (!error) return false;
  const lower = error.toLowerCase();
  return (
    lower.includes('no conectado') ||
    lower.includes('sin conexión') ||
    lower.includes('vincula') ||
    lower.includes('connection closed') ||
    lower.includes('disconnected') ||
    lower.includes('logged out') ||
    lower.includes('stream errored')
  );
}

function isRetryableError(error?: string): boolean {
  if (!error) return false;
  if (isDisconnectError(error)) return false;
  const lower = error.toLowerCase();
  return (
    lower.includes('timeout') ||
    lower.includes('timed out') ||
    lower.includes('econnreset') ||
    lower.includes('rate') ||
    lower.includes('429') ||
    lower.includes('503') ||
    lower.includes('temporarily') ||
    lower.includes('try again')
  );
}

async function isInstanceReady(instanceName: string | null | undefined): Promise<boolean> {
  const name = instanceName?.trim();
  if (!name) return false;
  if (isBuiltinConnected(name)) return true;

  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (isBuiltinConnected(name)) return true;
    if (!isBuiltinConnecting(name)) break;
    await sleep(1500);
  }
  return isBuiltinConnected(name);
}

export async function pauseCampaign(campaignId: string, reason: string): Promise<void> {
  await prisma.whatsAppCampaign.updateMany({
    where: { id: campaignId, status: { in: ['running', 'pending'] } },
    data: {
      status: 'paused',
      pauseReason: reason.slice(0, 1000),
      pausedAt: new Date(),
    },
  });
}

export async function pauseActiveCampaignsForInstance(instanceName: string, reason: string): Promise<void> {
  const name = instanceName.trim().toLowerCase();
  const campaigns = await prisma.whatsAppCampaign.findMany({
    where: {
      status: 'running',
      OR: [{ instanceName: name }, { instanceName: instanceName.trim() }],
    },
    select: { id: true },
  });

  if (campaigns.length === 0) return;

  await prisma.whatsAppCampaign.updateMany({
    where: { id: { in: campaigns.map((c) => c.id) } },
    data: {
      status: 'paused',
      pauseReason: reason.slice(0, 1000),
      pausedAt: new Date(),
    },
  });

  console.log(`[WhatsApp] ${campaigns.length} campaña(s) pausada(s) por desconexión (${name})`);
}

async function syncCampaignCountsFromLogs(campaignId: string): Promise<void> {
  const [sent, failed] = await Promise.all([
    prisma.whatsAppMessageLog.count({ where: { campaignId, status: 'sent' } }),
    prisma.whatsAppMessageLog.count({ where: { campaignId, status: 'failed' } }),
  ]);
  await prisma.whatsAppCampaign.update({
    where: { id: campaignId },
    data: {
      sentCount: sent,
      failedCount: failed,
      totalCostEur: sent * WHATSAPP_MESSAGE_COST_EUR,
    },
  });
}

async function sendWithRetry(
  instanceName: string | undefined,
  phone: string,
  message: string,
  imageUrl: string | null
): Promise<SendOutcome> {
  for (let attempt = 0; attempt <= MAX_SEND_RETRIES; attempt++) {
    if (!(await isInstanceReady(instanceName))) {
      return { type: 'pause', reason: PAUSE_REASON_DISCONNECT };
    }

    const result = await sendWhatsAppMessage(phone, message, instanceName, imageUrl || undefined);

    if (result.success) {
      return { type: 'sent' };
    }

    const error = result.error || 'Error desconocido';

    if (isDisconnectError(error)) {
      return { type: 'pause', reason: PAUSE_REASON_DISCONNECT };
    }

    if (isWhatsAppRestrictionError(error)) {
      return { type: 'pause', reason: PAUSE_REASON_RESTRICTION };
    }

    if (isRetryableError(error) && attempt < MAX_SEND_RETRIES) {
      const backoff = RETRY_BASE_MS * Math.pow(2, attempt);
      console.log(`[WhatsApp] Reintento ${attempt + 1}/${MAX_SEND_RETRIES} para ${phone} en ${backoff}ms: ${error}`);
      await sleep(backoff);
      continue;
    }

    return { type: 'failed', error };
  }

  return { type: 'failed', error: 'Máximo de reintentos alcanzado' };
}

async function finalizeCampaignIfDone(campaignId: string): Promise<void> {
  const pending = await prisma.whatsAppMessageLog.count({
    where: { campaignId, status: 'pending' },
  });
  if (pending > 0) return;

  await prisma.whatsAppCampaign.updateMany({
    where: { id: campaignId, status: { in: ['running', 'paused'] } },
    data: { status: 'completed', completedAt: new Date(), pauseReason: null },
  });
}

export async function processCampaign(campaignId: string): Promise<void> {
  if (runningCampaigns.has(campaignId)) return;
  runningCampaigns.add(campaignId);

  try {
    const campaign = await prisma.whatsAppCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.status === 'cancelled' || campaign.status === 'completed') return;

    if (!(await isInstanceReady(campaign.instanceName))) {
      await pauseCampaign(campaignId, PAUSE_REASON_DISCONNECT);
      return;
    }

    await prisma.whatsAppCampaign.update({
      where: { id: campaignId },
      data: {
        status: 'running',
        startedAt: campaign.startedAt || new Date(),
        pauseReason: null,
        pausedAt: null,
      },
    });

    // Pequeña pausa antes del primer envío para no chocar con la conexión activa
    await sleep(CAMPAIGN_WARMUP_MS);

    const pending = await prisma.whatsAppMessageLog.findMany({
      where: { campaignId, status: 'pending' },
      orderBy: { createdAt: 'asc' },
    });

    let burstCount = 0;
    const burstLimit = getBurstSize();

    for (const log of pending) {
      const current = await prisma.whatsAppCampaign.findUnique({ where: { id: campaignId } });
      if (!current || current.status === 'cancelled' || current.status === 'paused') break;

      if (!(await isInstanceReady(campaign.instanceName))) {
        await pauseCampaign(campaignId, PAUSE_REASON_DISCONNECT);
        break;
      }

      const quotaCheck = await assertQuotaForSend(1);
      if (quotaCheck.ok === false) {
        const remainingPending = await prisma.whatsAppMessageLog.count({
          where: { campaignId, status: 'pending' },
        });
        await prisma.whatsAppMessageLog.updateMany({
          where: { campaignId, status: 'pending' },
          data: { status: 'failed', error: QUOTA_EXHAUSTED_MESSAGE.slice(0, 500) },
        });
        await prisma.whatsAppCampaign.update({
          where: { id: campaignId },
          data: {
            status: 'completed',
            completedAt: new Date(),
            failedCount: { increment: remainingPending },
          },
        });
        break;
      }

      const dailyCheck = await assertDailyQuotaForSend(1);
      if (dailyCheck.ok === false) {
        await pauseCampaign(campaignId, PAUSE_REASON_DAILY);
        break;
      }

      const outcome = await sendWithRetry(
        campaign.instanceName || undefined,
        log.phone,
        campaign.message,
        campaign.imageUrl
      );

      if (outcome.type === 'sent') {
        await prisma.whatsAppMessageLog.update({
          where: { id: log.id },
          data: {
            status: 'sent',
            sentAt: new Date(),
            costEur: WHATSAPP_MESSAGE_COST_EUR,
            error: null,
          },
        });
        await syncCampaignCountsFromLogs(campaignId);
        touchStats();
        burstCount += 1;
        if (burstCount >= burstLimit) {
          await pauseForBurst(campaignId);
          break;
        }
      } else if (outcome.type === 'pause') {
        await pauseCampaign(campaignId, outcome.reason);
        break;
      } else {
        await prisma.whatsAppMessageLog.update({
          where: { id: log.id },
          data: { status: 'failed', error: outcome.error.slice(0, 500) },
        });
        await syncCampaignCountsFromLogs(campaignId);
      }

      await sleep(jitterDelayMs(campaign.delayMs || DEFAULT_DELAY_MS));
    }

    await finalizeCampaignIfDone(campaignId);
  } catch (err) {
    console.error('Error procesando campaña WhatsApp:', err);
    await prisma.whatsAppCampaign.update({
      where: { id: campaignId },
      data: {
        status: 'paused',
        pauseReason: 'Error interno del servidor. Puedes reanudar la campaña.',
        pausedAt: new Date(),
      },
    });
  } finally {
    runningCampaigns.delete(campaignId);
  }
}

export function enqueueCampaign(campaignId: string): void {
  setImmediate(() => {
    processCampaign(campaignId).catch((err) => console.error('processCampaign:', err));
  });
}

export async function resumeCampaign(campaignId: string): Promise<{ ok: boolean; error?: string }> {
  const campaign = await prisma.whatsAppCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) return { ok: false, error: 'Campaña no encontrada' };
  if (campaign.status === 'cancelled' || campaign.status === 'completed') {
    return { ok: false, error: 'Esta campaña ya terminó' };
  }

  const pending = await prisma.whatsAppMessageLog.count({
    where: { campaignId, status: 'pending' },
  });
  if (pending === 0) {
    return { ok: false, error: 'No hay mensajes pendientes' };
  }

  if (!(await isInstanceReady(campaign.instanceName))) {
    return { ok: false, error: 'WhatsApp no conectado. Vincula tu número antes de reanudar.' };
  }

  const quotaCheck = await assertQuotaForSend(pending);
  if (quotaCheck.ok === false) {
    return { ok: false, error: quotaCheck.error };
  }

  const dailyCheck = await assertDailyQuotaForSend(1);
  if (dailyCheck.ok === false) {
    return { ok: false, error: dailyCheck.error };
  }

  enqueueCampaign(campaignId);
  return { ok: true };
}

function clearResumeTimer(key: string) {
  const t = resumeTimers.get(key);
  if (t) {
    clearTimeout(t);
    resumeTimers.delete(key);
  }
}

export async function resumePausedCampaignsForInstance(instanceName: string): Promise<void> {
  const name = instanceName.trim();
  clearResumeTimer(name);

  const timer = setTimeout(async () => {
    resumeTimers.delete(name);
    try {
      if (!(await isInstanceReady(name))) return;

      const campaigns = await prisma.whatsAppCampaign.findMany({
        where: {
          status: 'paused',
          OR: [{ instanceName: name.toLowerCase() }, { instanceName: name }],
        },
        orderBy: { pausedAt: 'asc' },
      });

      for (const c of campaigns) {
        const pending = await prisma.whatsAppMessageLog.count({
          where: { campaignId: c.id, status: 'pending' },
        });
        if (pending === 0) continue;

        if (c.pauseReason === PAUSE_REASON_DAILY) {
          const daily = await assertDailyQuotaForSend(1);
          if (daily.ok === false) continue;
        }
        if (c.pauseReason === PAUSE_REASON_RESTRICTION) {
          continue;
        }
        if (isBurstPauseReason(c.pauseReason)) {
          const remaining = burstPauseRemainingMs(c.pausedAt);
          if (remaining > 0) {
            scheduleBurstResume(c.id, remaining);
          } else {
            enqueueCampaign(c.id);
          }
          continue;
        }

        console.log(`[WhatsApp] Reanudando campaña ${c.id} (${c.name})`);
        enqueueCampaign(c.id);
        break;
      }
    } catch (err) {
      console.warn('resumePausedCampaignsForInstance:', err);
    }
  }, AUTO_RESUME_DELAY_MS);

  resumeTimers.set(name, timer);
}

export async function resumeDailyPausedCampaigns(): Promise<void> {
  const campaigns = await prisma.whatsAppCampaign.findMany({
    where: { status: 'paused', pauseReason: PAUSE_REASON_DAILY },
  });

  for (const c of campaigns) {
    if (!(await isInstanceReady(c.instanceName))) continue;
    const daily = await assertDailyQuotaForSend(1);
    if (daily.ok === false) continue;
    enqueueCampaign(c.id);
  }
}

export async function recoverInterruptedCampaigns(): Promise<void> {
  const stuck = await prisma.whatsAppCampaign.findMany({
    where: { status: { in: ['running', 'paused'] } },
  });

  for (const c of stuck) {
    const pending = await prisma.whatsAppMessageLog.count({
      where: { campaignId: c.id, status: 'pending' },
    });
    if (pending === 0) {
      await prisma.whatsAppCampaign.update({
        where: { id: c.id },
        data: { status: 'completed', completedAt: new Date() },
      });
      continue;
    }

    if (c.status === 'running') {
      await pauseCampaign(
        c.id,
        'El servidor se reinició durante el envío. Reanudando automáticamente si WhatsApp está conectado.'
      );
    }

    if (await isInstanceReady(c.instanceName)) {
      enqueueCampaign(c.id);
    }
  }
}

export function onWhatsAppConnected(instanceName: string): void {
  resumePausedCampaignsForInstance(instanceName).catch(console.warn);
}

export function onWhatsAppDisconnected(instanceName: string, reason?: string): void {
  pauseActiveCampaignsForInstance(
    instanceName,
    reason || PAUSE_REASON_DISCONNECT
  ).catch(console.warn);
}
