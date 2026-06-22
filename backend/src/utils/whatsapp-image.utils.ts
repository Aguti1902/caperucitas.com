import fs from 'fs';
import path from 'path';
import { getWhatsAppCampaignImagePath } from '../config/whatsapp-upload';

export async function resolveWhatsAppImagePayload(
  imageUrl: string
): Promise<{ url?: string; buffer?: Buffer; mimetype?: string }> {
  const trimmed = imageUrl.trim();
  if (!trimmed) {
    throw new Error('URL de imagen vacía');
  }

  const uploadsMarker = '/uploads/whatsapp-campaigns/';
  const markerIndex = trimmed.indexOf(uploadsMarker);
  if (markerIndex !== -1) {
    const filename = trimmed.slice(markerIndex + uploadsMarker.length).split('?')[0];
    const localPath = getWhatsAppCampaignImagePath(filename);
    if (fs.existsSync(localPath)) {
      const ext = path.extname(localPath).toLowerCase();
      const mimetype =
        ext === '.png'
          ? 'image/png'
          : ext === '.webp'
            ? 'image/webp'
            : ext === '.gif'
              ? 'image/gif'
              : 'image/jpeg';
      return { buffer: fs.readFileSync(localPath), mimetype };
    }
  }

  return { url: trimmed };
}

export function buildPublicUploadUrl(req: { protocol: string; get(name: string): string | undefined }, filename: string): string {
  const configured = process.env.BACKEND_URL || process.env.API_URL || process.env.RAILWAY_PUBLIC_DOMAIN;
  if (configured) {
    const base = configured.startsWith('http') ? configured : `https://${configured}`;
    return `${base.replace(/\/$/, '')}/uploads/whatsapp-campaigns/${filename}`;
  }
  const host = req.get('host');
  return `${req.protocol}://${host}/uploads/whatsapp-campaigns/${filename}`;
}
