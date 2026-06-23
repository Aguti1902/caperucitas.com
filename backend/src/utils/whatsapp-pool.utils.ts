/** Pool de móviles e intercalado de variantes de mensaje. */

export function normalizeInstanceName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
}

export function parseInstancePool(input: unknown, fallbackInstance?: string | null): string[] {
  let raw: unknown[] = [];

  if (Array.isArray(input)) {
    raw = input;
  } else if (typeof input === 'string' && input.trim()) {
    try {
      const parsed = JSON.parse(input);
      raw = Array.isArray(parsed) ? parsed : input.split(/[,;\n]+/);
    } catch {
      raw = input.split(/[,;\n]+/);
    }
  }

  const names = raw
    .map((v) => normalizeInstanceName(String(v)))
    .filter(Boolean);

  const unique = [...new Set(names)];
  if (unique.length > 0) return unique;

  const single = fallbackInstance?.trim();
  return single ? [normalizeInstanceName(single)] : [];
}

/** Separa variantes con una línea `---` entre bloques. */
export function splitMessageVariants(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const parts = trimmed
    .split(/\n---+\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return parts.length > 0 ? parts : [trimmed];
}

export function parseMessageVariants(
  message: string,
  variantsInput?: unknown
): string[] {
  if (Array.isArray(variantsInput)) {
    const fromArray = variantsInput.map((v) => String(v).trim()).filter(Boolean);
    if (fromArray.length > 0) return fromArray;
  }

  if (typeof variantsInput === 'string' && variantsInput.trim()) {
    try {
      const parsed = JSON.parse(variantsInput);
      if (Array.isArray(parsed)) {
        const fromJson = parsed.map((v) => String(v).trim()).filter(Boolean);
        if (fromJson.length > 0) return fromJson;
      }
    } catch {
      const fromSplit = splitMessageVariants(variantsInput);
      if (fromSplit.length > 0) return fromSplit;
    }
  }

  return splitMessageVariants(message);
}

export function personalizeMessage(
  template: string,
  contact?: { name?: string | null; phone?: string }
): string {
  const name = contact?.name?.trim() || 'hola';
  return template
    .replace(/\{nombre\}/gi, name)
    .replace(/\{name\}/gi, name)
    .replace(/\{telefono\}/gi, contact?.phone || '')
    .replace(/\{phone\}/gi, contact?.phone || '');
}

/** Rota variantes de forma determinista pero variada por contacto. */
export function pickMessageVariant(
  variants: string[],
  index: number,
  contact?: { name?: string | null; phone?: string }
): string {
  if (variants.length === 0) return '';
  const template = variants[index % variants.length];
  return personalizeMessage(template, contact);
}

export function campaignUsesPool(pool: string[]): boolean {
  return pool.length > 1;
}

export function parseCampaignPool(campaign: {
  instanceName?: string | null;
  instanceNames?: unknown;
}): string[] {
  return parseInstancePool(campaign.instanceNames, campaign.instanceName);
}

export function campaignUsesInstance(
  campaign: { instanceName?: string | null; instanceNames?: unknown },
  instanceName: string
): boolean {
  const target = normalizeInstanceName(instanceName);
  return parseCampaignPool(campaign).includes(target);
}
