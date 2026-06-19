/** Coste por mensaje WhatsApp enviado (EUR) */
export const WHATSAPP_MESSAGE_COST_EUR = 0.0035;

const DEFAULT_DELAY_MS = 2000;

export interface EvolutionInstance {
  name: string;
  connected: boolean;
  state: string;
  owner?: string;
  profileName?: string;
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
  return getEvolutionConfig().instance;
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
}> {
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
}> {
  const { baseUrl, apiKey } = getEvolutionConfig();
  const instance = resolveInstanceName(instanceName);

  if (!isEvolutionConfigured() || !instance) {
    return { configured: false, connected: false, error: 'Evolution API no configurada' };
  }

  try {
    const res = await fetch(`${baseUrl}/instance/connectionState/${instance}`, {
      headers: { apikey: apiKey },
    });
    if (!res.ok) {
      const text = await res.text();
      return { configured: true, connected: false, instanceName: instance, error: text || res.statusText };
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
    };
  } catch (err: any) {
    return { configured: true, connected: false, instanceName: instance, error: err.message };
  }
}

export async function sendTextMessage(
  phone: string,
  text: string,
  instanceName?: string
): Promise<{ success: boolean; error?: string }> {
  const { baseUrl, apiKey } = getEvolutionConfig();
  const instance = resolveInstanceName(instanceName);

  if (!isEvolutionConfigured() || !instance) {
    return { success: false, error: 'Evolution API no configurada (EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE_NAME)' };
  }

  const normalized = normalizePhone(phone);
  if (!normalized) {
    return { success: false, error: `Número inválido: ${phone}` };
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
