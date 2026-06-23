import fs from 'fs';
import path from 'path';
import { getWhatsAppCampaignImagePath } from '../config/whatsapp-upload';

export const WHATSAPP_CAMPAIGN_UPLOADS_MARKER = '/uploads/whatsapp-campaigns/';

export function getBackendBaseUrl(): string {
  let backendUrl = process.env.BACKEND_URL || process.env.RAILWAY_PUBLIC_DOMAIN || '';

  if (!backendUrl && process.env.API_URL) {
    backendUrl = process.env.API_URL.replace(/\/api\/?$/, '');
  }

  if (!backendUrl) {
    backendUrl =
      process.env.NODE_ENV === 'production'
        ? 'https://caperucitascom-production.up.railway.app'
        : 'http://localhost:4000';
  }

  if (!backendUrl.startsWith('http')) {
    backendUrl = `https://${backendUrl}`;
  }

  return backendUrl.replace(/\/$/, '').replace(/\/api$/, '');
}

export function extractCampaignImageFilename(imageUrl: string): string | null {
  const trimmed = imageUrl.trim();
  const markerIndex = trimmed.indexOf(WHATSAPP_CAMPAIGN_UPLOADS_MARKER);
  if (markerIndex !== -1) {
    const filename = trimmed.slice(markerIndex + WHATSAPP_CAMPAIGN_UPLOADS_MARKER.length).split('?')[0];
    return filename || null;
  }
  if (trimmed.startsWith(WHATSAPP_CAMPAIGN_UPLOADS_MARKER)) {
    const filename = trimmed.slice(WHATSAPP_CAMPAIGN_UPLOADS_MARKER.length).split('?')[0];
    return filename || null;
  }
  return null;
}

function mimetypeFromFilename(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  return 'image/jpeg';
}

function readLocalCampaignImage(filename: string): { buffer: Buffer; mimetype: string } | null {
  const localPath = getWhatsAppCampaignImagePath(filename);
  if (!fs.existsSync(localPath)) return null;
  return {
    buffer: fs.readFileSync(localPath),
    mimetype: mimetypeFromFilename(filename),
  };
}

async function fetchRemoteImage(url: string): Promise<{ buffer: Buffer; mimetype: string }> {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`No se pudo descargar la imagen (${res.status})`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const mimetype =
    res.headers.get('content-type')?.split(';')[0]?.trim() ||
    mimetypeFromFilename(new URL(url).pathname);
  return { buffer, mimetype };
}

/** Siempre devuelve buffer — nunca delega la descarga a Baileys (falla con URLs del frontend). */
export async function resolveWhatsAppImagePayload(
  imageUrl: string
): Promise<{ buffer: Buffer; mimetype: string }> {
  const trimmed = imageUrl.trim();
  if (!trimmed) {
    throw new Error('URL de imagen vacía');
  }

  const filename = extractCampaignImageFilename(trimmed);
  if (filename) {
    const local = readLocalCampaignImage(filename);
    if (local) return local;

    const backendUrl = `${getBackendBaseUrl()}${WHATSAPP_CAMPAIGN_UPLOADS_MARKER}${filename}`;
    try {
      return await fetchRemoteImage(backendUrl);
    } catch (backendErr: any) {
      if (trimmed.startsWith('http') && !trimmed.startsWith(getBackendBaseUrl())) {
        try {
          return await fetchRemoteImage(trimmed);
        } catch {
          // sigue al error claro de abajo
        }
      }
      throw new Error(
        `Imagen no encontrada en el servidor (puede haberse borrado tras un redeploy). Vuelve a subirla. ${backendErr.message || ''}`.trim()
      );
    }
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return fetchRemoteImage(trimmed);
  }

  throw new Error(`URL de imagen no válida: ${trimmed}`);
}

export function buildPublicUploadUrl(
  _req: { protocol: string; get(name: string): string | undefined },
  filename: string
): string {
  return `${getBackendBaseUrl()}${WHATSAPP_CAMPAIGN_UPLOADS_MARKER}${filename}`;
}

/** Path relativo para guardar en BD — resoluble siempre en el backend. */
export function buildCampaignImageStoragePath(filename: string): string {
  return `${WHATSAPP_CAMPAIGN_UPLOADS_MARKER}${filename}`;
}

/** Normaliza URL absoluta antigua → path relativo en disco del backend. */
export function normalizeStoredCampaignImageUrl(imageUrl: string): string {
  const filename = extractCampaignImageFilename(imageUrl);
  if (filename) return buildCampaignImageStoragePath(filename);
  return imageUrl.trim();
}

/** Convierte path relativo o URL antigua (caperucitas.com) a URL pública del backend. */
export function normalizeCampaignImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl?.trim()) return null;
  const trimmed = imageUrl.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const filename = extractCampaignImageFilename(trimmed);
    if (filename) {
      return `${getBackendBaseUrl()}${WHATSAPP_CAMPAIGN_UPLOADS_MARKER}${filename}`;
    }
    return trimmed;
  }
  if (trimmed.startsWith(WHATSAPP_CAMPAIGN_UPLOADS_MARKER)) {
    return `${getBackendBaseUrl()}${trimmed}`;
  }
  return trimmed;
}
