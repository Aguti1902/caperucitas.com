import { isBuiltinConnected, isBuiltinConnecting, isWhatsAppSendReady } from './whatsapp-baileys.service';
import { getInstanceStatus } from './whatsapp.service';
import { assertInstanceDailyQuota } from '../utils/whatsapp-quota.utils';
import {
  getPerInstanceBurstSize,
  getInstanceBurstPauseMs,
  getInstanceSwitchDelayMs,
  getPerInstanceDailyLimit,
} from '../utils/whatsapp-safe-limits.utils';
import { normalizeInstanceName } from '../utils/whatsapp-pool.utils';
import { sleep } from './whatsapp.service';

const rotationIndex = new Map<string, number>();
const instanceBurstCount = new Map<string, number>();
const instanceBurstPausedUntil = new Map<string, number>();

function burstKey(instanceName: string): string {
  return normalizeInstanceName(instanceName);
}

export function resetCampaignPoolState(campaignId: string): void {
  rotationIndex.delete(campaignId);
}

export function recordInstanceSend(instanceName: string, poolSize: number): void {
  const key = burstKey(instanceName);
  const limit = getPerInstanceBurstSize(poolSize);
  const next = (instanceBurstCount.get(key) || 0) + 1;
  instanceBurstCount.set(key, next);
  if (next >= limit) {
    instanceBurstPausedUntil.set(key, Date.now() + getInstanceBurstPauseMs());
    instanceBurstCount.set(key, 0);
    const mins = Math.ceil(getInstanceBurstPauseMs() / 60_000);
    console.log(`[WhatsApp:${key}] Pausa anti-spam por instancia (${mins} min)`);
  }
}

function isInstanceInBurstPause(instanceName: string): boolean {
  const until = instanceBurstPausedUntil.get(burstKey(instanceName));
  if (!until) return false;
  if (Date.now() >= until) {
    instanceBurstPausedUntil.delete(burstKey(instanceName));
    return false;
  }
  return true;
}

async function isInstanceSendReady(instanceName: string): Promise<{ ok: boolean; reason?: string }> {
  const name = burstKey(instanceName);
  if (isInstanceInBurstPause(name)) {
    return { ok: false, reason: 'pausa anti-spam de instancia' };
  }

  const sendReady = isWhatsAppSendReady(name);
  if (!sendReady.ready) {
    return { ok: false, reason: sendReady.reason || 'sincronizando' };
  }

  if (isBuiltinConnected(name)) return { ok: true };

  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (isBuiltinConnected(name)) return { ok: true };
    if (!isBuiltinConnecting(name)) break;
    await sleep(1000);
  }

  const status = await getInstanceStatus(name);
  if (status.connected) return { ok: true };

  return { ok: false, reason: status.error || 'desconectado' };
}

export async function selectInstanceForSend(
  campaignId: string,
  pool: string[]
): Promise<
  | { ok: true; instanceName: string; switchDelayMs: number; previousInstance?: string }
  | { ok: false; reason: string; allDailyExhausted?: boolean; allDisconnected?: boolean }
> {
  const normalizedPool = pool.map(normalizeInstanceName).filter(Boolean);
  if (normalizedPool.length === 0) {
    return { ok: false, reason: 'No hay móviles en el pool de envío' };
  }

  const start = rotationIndex.get(campaignId) || 0;
  const previousInstance = rotationIndex.has(campaignId)
    ? normalizedPool[(start - 1 + normalizedPool.length) % normalizedPool.length]
    : undefined;

  let dailyBlocked = 0;
  let disconnected = 0;
  let burstBlocked = 0;

  for (let offset = 0; offset < normalizedPool.length; offset++) {
    const idx = (start + offset) % normalizedPool.length;
    const instanceName = normalizedPool[idx];

    const ready = await isInstanceSendReady(instanceName);
    if (!ready.ok) {
      if (ready.reason?.includes('pausa anti-spam')) burstBlocked++;
      else disconnected++;
      continue;
    }

    const daily = await assertInstanceDailyQuota(instanceName);
    if (daily.ok === false) {
      dailyBlocked++;
      continue;
    }

    rotationIndex.set(campaignId, idx + 1);
    const switchDelayMs =
      previousInstance && previousInstance !== instanceName ? getInstanceSwitchDelayMs() : 0;

    return { ok: true, instanceName, switchDelayMs, previousInstance };
  }

  if (dailyBlocked === normalizedPool.length) {
    return {
      ok: false,
      reason: `Todos los móviles alcanzaron el límite diario (${getPerInstanceDailyLimit()}/móvil).`,
      allDailyExhausted: true,
    };
  }

  if (burstBlocked > 0 && disconnected === 0) {
    return {
      ok: false,
      reason: 'Todos los móviles en pausa anti-spam. La campaña continuará sola en unos minutos.',
    };
  }

  return {
    ok: false,
    reason: 'Ningún móvil del pool está conectado y listo para enviar.',
    allDisconnected: true,
  };
}

export async function isPoolReadyForSend(pool: string[]): Promise<boolean> {
  for (const raw of pool) {
    const instanceName = normalizeInstanceName(raw);
    const ready = await isInstanceSendReady(instanceName);
    if (!ready.ok) continue;
    const daily = await assertInstanceDailyQuota(instanceName);
    if (daily.ok) return true;
  }
  return false;
}

export function getInstancePoolStats(pool: string[]): {
  instanceName: string;
  burstPaused: boolean;
  burstCount: number;
  connected: boolean;
}[] {
  return pool.map((raw) => {
    const instanceName = normalizeInstanceName(raw);
    return {
      instanceName,
      burstPaused: isInstanceInBurstPause(instanceName),
      burstCount: instanceBurstCount.get(instanceName) || 0,
      connected: isBuiltinConnected(instanceName),
    };
  });
}
