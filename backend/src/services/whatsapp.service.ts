/** Coste por mensaje WhatsApp enviado (EUR) */
export const WHATSAPP_MESSAGE_COST_EUR = 0.0035;

const DEFAULT_DELAY_MS = 2000;

function getEvolutionConfig() {
  const baseUrl = (process.env.EVOLUTION_API_URL || '').replace(/\/$/, '');
  const apiKey = process.env.EVOLUTION_API_KEY || '';
  const instance = process.env.EVOLUTION_INSTANCE_NAME || '';
  return { baseUrl, apiKey, instance };
}

export function isEvolutionConfigured(): boolean {
  const { baseUrl, apiKey, instance } = getEvolutionConfig();
  return Boolean(baseUrl && apiKey && instance);
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

export async function getInstanceStatus(): Promise<{
  configured: boolean;
  connected: boolean;
  state?: string;
  error?: string;
}> {
  const { baseUrl, apiKey, instance } = getEvolutionConfig();
  if (!isEvolutionConfigured()) {
    return { configured: false, connected: false, error: 'Evolution API no configurada' };
  }

  try {
    const res = await fetch(`${baseUrl}/instance/connectionState/${instance}`, {
      headers: { apikey: apiKey },
    });
    if (!res.ok) {
      const text = await res.text();
      return { configured: true, connected: false, error: text || res.statusText };
    }
    const data = (await res.json()) as any;
    const state = data?.instance?.state || data?.state || data?.connectionStatus;
    const connected = state === 'open' || state === 'connected';
    return { configured: true, connected, state: String(state) };
  } catch (err: any) {
    return { configured: true, connected: false, error: err.message };
  }
}

export async function sendTextMessage(phone: string, text: string): Promise<{ success: boolean; error?: string }> {
  const { baseUrl, apiKey, instance } = getEvolutionConfig();
  if (!isEvolutionConfigured()) {
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
