/** Coste por mensaje WhatsApp enviado (EUR) */
import * as baileys from './whatsapp-baileys.service';

export const WHATSAPP_MESSAGE_COST_EUR = 0.0035;

const DEFAULT_DELAY_MS = 2000;

export interface EvolutionInstance {
  name: string;
  connected: boolean;
  state: string;
  owner?: string;
  profileName?: string;
}

export type WhatsAppProvider = 'builtin' | 'evolution';

export function getWhatsAppProvider(): WhatsAppProvider {
  const forced = process.env.WHATSAPP_PROVIDER;
  if (forced === 'evolution') return 'evolution';
  if (forced === 'builtin') return 'builtin';
  return isEvolutionConfigured() ? 'evolution' : 'builtin';
}

export function isWhatsAppConfigured(): boolean {
  return getWhatsAppProvider() === 'builtin' || isEvolutionConfigured();
}

function getEvolutionConfig() {
  const baseUrl = (process.env.EVOLUTION_API_URL || '').replace(/\/$/, '');
  const apiKey = process.env.EVOLUTION_API_KEY || '';
  const instance = process.env.EVOLUTION_INSTANCE_NAME || '';
  return { baseUrl, apiKey, instance };
}

export function isEvolutionConfigured(): boolean {
  const { baseUrl, apiKey } = getEvolutionConfig();
  return Boolean(baseUrl && apiKey);
}

export function getDefaultInstanceName(): string {
  return (
    getEvolutionConfig().instance ||
    process.env.WHATSAPP_INSTANCE_NAME ||
    'caperucitas'
  );
}

/** Normaliza teléfono a formato internacional sin + (España por defecto) */
export function normalizePhone(raw: string, defaultCountry = '34'): string | null {
  let digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 9 && /^[67]/.test(digits)) digits = defaultCountry + digits;
  if (digits.length < 10) return null;
  return digits;
}

function resolveInstanceName(instanceName?: string): string | null {
  const name = (instanceName || getDefaultInstanceName()).trim();
  return name || null;
}

export async function listInstances(): Promise<{
  configured: boolean;
  instances: EvolutionInstance[];
  error?: string;
  provider?: WhatsAppProvider;
}> {
  if (getWhatsAppProvider() === 'builtin') {
    const instances = await baileys.listBuiltinInstances();
    return { configured: true, instances, provider: 'builtin' };
  }

  const { baseUrl, apiKey } = getEvolutionConfig();
  if (!isEvolutionConfigured()) {
    return { configured: false, instances: [], error: 'Evolution API no configurada' };
  }

  try {
    const res = await fetch(`${baseUrl}/instance/fetchInstances`, {
      headers: { apikey: apiKey },
    });

    if (!res.ok) {
      const text = await res.text();
      return { configured: true, instances: [], error: text || res.statusText };
    }

    const data = (await res.json()) as any;
    const rawList = Array.isArray(data) ? data : data?.instances || [];

    const instances: EvolutionInstance[] = rawList.map((item: any) => {
      const inst = item?.instance || item;
      const name = inst?.instanceName || inst?.name || '';
      const state = inst?.status || inst?.state || inst?.connectionStatus || 'unknown';
      const connected = state === 'open' || state === 'connected';
      return {
        name,
        connected,
        state: String(state),
        owner: inst?.owner ? String(inst.owner) : undefined,
        profileName: inst?.profileName || inst?.profile?.name || undefined,
      };
    }).filter((i: EvolutionInstance) => i.name);

    // Si fetchInstances falla o está vacío pero hay instancia por defecto en env
    const defaultName = getDefaultInstanceName();
    if (instances.length === 0 && defaultName) {
      const status = await getInstanceStatus(defaultName);
      instances.push({
        name: defaultName,
        connected: status.connected,
        state: status.state || 'unknown',
      });
    }

    return { configured: true, instances };
  } catch (err: any) {
    const defaultName = getDefaultInstanceName();
    if (defaultName) {
      const status = await getInstanceStatus(defaultName);
      return {
        configured: true,
        instances: [{ name: defaultName, connected: status.connected, state: status.state || 'unknown' }],
        error: err.message,
      };
    }
    return { configured: true, instances: [], error: err.message };
  }
}

export async function getInstanceStatus(instanceName?: string): Promise<{
  configured: boolean;
  connected: boolean;
  instanceName?: string;
  state?: string;
  owner?: string;
  error?: string;
  provider?: WhatsAppProvider;
}> {
  const instance = resolveInstanceName(instanceName);
  if (!instance) {
    return { configured: false, connected: false, error: 'Instancia no definida' };
  }

  if (getWhatsAppProvider() === 'builtin') {
    const status = await baileys.getBuiltinStatus(instance);
    return { ...status, provider: 'builtin' };
  }

  const { baseUrl, apiKey } = getEvolutionConfig();
  if (!isEvolutionConfigured()) {
    return { configured: false, connected: false, instanceName: instance, error: 'Evolution API no configurada' };
  }

  try {
    const res = await fetch(`${baseUrl}/instance/connectionState/${instance}`, {
      headers: { apikey: apiKey },
    });
    if (!res.ok) {
      const text = await res.text();
      return { configured: true, connected: false, instanceName: instance, error: text || res.statusText, provider: 'evolution' };
    }
    const data = (await res.json()) as any;
    const state = data?.instance?.state || data?.state || data?.connectionStatus;
    const connected = state === 'open' || state === 'connected';
    const owner = data?.instance?.owner || data?.owner;
    return {
      configured: true,
      connected,
      instanceName: instance,
      state: String(state),
      owner: owner ? String(owner) : undefined,
      provider: 'evolution',
    };
  } catch (err: any) {
    return { configured: true, connected: false, instanceName: instance, error: err.message, provider: 'evolution' };
  }
}

export async function checkEvolutionHealth(): Promise<{ ok: boolean; error?: string; provider?: WhatsAppProvider }> {
  if (getWhatsAppProvider() === 'builtin') {
    return { ok: true, provider: 'builtin' };
  }
  const { baseUrl, apiKey } = getEvolutionConfig();
  if (!baseUrl || !apiKey) {
    return { ok: false, error: 'EVOLUTION_API_URL o EVOLUTION_API_KEY no configuradas' };
  }
  try {
    const res = await fetch(`${baseUrl}/`, { headers: { apikey: apiKey } });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

export async function createEvolutionInstance(instanceName: string): Promise<{ success: boolean; error?: string; data?: unknown }> {
  const name = instanceName.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
  if (!name) return { success: false, error: 'Nombre de instancia inválido' };

  if (getWhatsAppProvider() === 'builtin') {
    const result = await baileys.startBuiltinInstance(name);
    if (result.error && !result.qrBase64 && !result.connected) {
      return { success: false, error: result.error };
    }
    return {
      success: true,
      data: { instanceName: name, qrBase64: result.qrBase64, connected: result.connected, phone: result.phone },
    };
  }

  const { baseUrl, apiKey } = getEvolutionConfig();
  if (!isEvolutionConfigured()) {
    return { success: false, error: 'Evolution API no configurada' };
  }

  try {
    const res = await fetch(`${baseUrl}/instance/create`, {
      method: 'POST',
      headers: { apikey: apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instanceName: name,
        integration: 'WHATSAPP-BAILEYS',
        qrcode: true,
      }),
    });
    const text = await res.text();
    if (!res.ok) {
      if (text.includes('already exists') || text.includes('already in use')) {
        return { success: true, data: { instanceName: name, existed: true } };
      }
      return { success: false, error: text || res.statusText };
    }
    let data: unknown = {};
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    return { success: true, data: { instanceName: name, ...(data as object) } };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getEvolutionQrCode(instanceName: string): Promise<{
  success: boolean;
  base64?: string;
  pairingCode?: string;
  connected?: boolean;
  owner?: string;
  error?: string;
}> {
  const name = instanceName.trim();

  if (getWhatsAppProvider() === 'builtin') {
    const result = await baileys.getBuiltinQr(name);
    if (result.connected) {
      return { success: true, connected: true, owner: result.owner };
    }
    if (result.base64) {
      return { success: true, base64: result.base64 };
    }
    return { success: false, error: result.error };
  }

  const { baseUrl, apiKey } = getEvolutionConfig();
  if (!isEvolutionConfigured()) {
    return { success: false, error: 'Evolution API no configurada' };
  }

  try {
    const res = await fetch(`${baseUrl}/instance/connect/${name}`, {
      headers: { apikey: apiKey },
    });
    const text = await res.text();
    if (!res.ok) return { success: false, error: text || res.statusText };

    const data = JSON.parse(text) as any;
    const base64 =
      data?.base64 ||
      data?.qrcode?.base64 ||
      data?.code ||
      (typeof data === 'string' && data.startsWith('data:image') ? data : undefined);

    const rawBase64 = base64?.replace(/^data:image\/[a-z]+;base64,/, '');

    return {
      success: true,
      base64: rawBase64,
      pairingCode: data?.pairingCode || data?.code,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function restartEvolutionInstance(instanceName: string): Promise<{ success: boolean; error?: string }> {
  const name = instanceName.trim();

  if (getWhatsAppProvider() === 'builtin') {
    try {
      await baileys.restartBuiltinInstance(name);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  const { baseUrl, apiKey } = getEvolutionConfig();
  if (!isEvolutionConfigured()) {
    return { success: false, error: 'Evolution API no configurada' };
  }

  try {
    const res = await fetch(`${baseUrl}/instance/restart/${name}`, {
      method: 'PUT',
      headers: { apikey: apiKey },
    });
    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: text || res.statusText };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function sendTextMessage(
  phone: string,
  text: string,
  instanceName?: string
): Promise<{ success: boolean; error?: string }> {
  const instance = resolveInstanceName(instanceName);
  const normalized = normalizePhone(phone);
  if (!normalized) {
    return { success: false, error: `Número inválido: ${phone}` };
  }

  if (getWhatsAppProvider() === 'builtin') {
    if (!instance) {
      return { success: false, error: 'Instancia no definida' };
    }
    return baileys.sendBuiltinMessage(instance, normalized, text);
  }

  const { baseUrl, apiKey } = getEvolutionConfig();

  if (!isEvolutionConfigured() || !instance) {
    return { success: false, error: 'Evolution API no configurada (EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE_NAME)' };
  }

  try {
    const res = await fetch(`${baseUrl}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: apiKey,
      },
      body: JSON.stringify({ number: normalized, text }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { success: false, error: body || `HTTP ${res.status}` };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export { DEFAULT_DELAY_MS };
