import prisma from '../lib/prisma';
import { ensureWhatsAppSchema } from './whatsapp-schema-migrate.utils';
import { computeWhatsAppCost } from './whatsapp-cost.utils';

export interface WhatsAppCampaignRow {
  id: string;
  name: string;
  message: string;
  imageUrl: string | null;
  instanceName: string | null;
  status: string;
  source: string;
  totalCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  totalCostEur: number;
  delayMs: number;
  pauseReason: string | null;
  pausedAt: Date | null;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
}

function mapCampaignRow(row: Record<string, unknown>): WhatsAppCampaignRow {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    message: String(row.message ?? ''),
    imageUrl: row.imageUrl != null ? String(row.imageUrl) : null,
    instanceName: row.instanceName != null ? String(row.instanceName) : null,
    status: String(row.status ?? 'pending'),
    source: String(row.source ?? ''),
    totalCount: Number(row.totalCount ?? 0),
    sentCount: Number(row.sentCount ?? 0),
    failedCount: Number(row.failedCount ?? 0),
    skippedCount: Number(row.skippedCount ?? 0),
    totalCostEur: Number(row.totalCostEur ?? 0),
    delayMs: Number(row.delayMs ?? 2000),
    pauseReason: row.pauseReason != null ? String(row.pauseReason) : null,
    pausedAt: row.pausedAt ? new Date(String(row.pausedAt)) : null,
    createdAt: new Date(String(row.createdAt)),
    startedAt: row.startedAt ? new Date(String(row.startedAt)) : null,
    completedAt: row.completedAt ? new Date(String(row.completedAt)) : null,
  };
}

/** Lista campañas con SQL directo (funciona aunque falten columnas nuevas en el ORM). */
export async function listWhatsAppCampaigns(limit = 50): Promise<WhatsAppCampaignRow[]> {
  await ensureWhatsAppSchema();

  try {
    const rows = await prisma.whatsAppCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map((r) => mapCampaignRow(r as unknown as Record<string, unknown>));
  } catch (prismaErr) {
    console.warn('listWhatsAppCampaigns prisma fallback:', prismaErr);
  }

  try {
    const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT
        id, name, message, "imageUrl", "instanceName", status, source,
        "totalCount", "sentCount", "failedCount", "skippedCount", "totalCostEur",
        "delayMs", "createdAt", "startedAt", "completedAt"
      FROM whatsapp_campaigns
      ORDER BY "createdAt" DESC
      LIMIT ${limit}
    `;
    return rows.map((r) => ({ ...mapCampaignRow(r), pauseReason: null, pausedAt: null }));
  } catch (sqlErr) {
    console.error('listWhatsAppCampaigns SQL error:', sqlErr);
    return [];
  }
}

/** Borra todos los logs de mensajes y resetea contadores de campañas. */
export async function clearWhatsAppMessageHistory(): Promise<number> {
  await ensureWhatsAppSchema();

  let deleted = 0;

  try {
    const result = await prisma.whatsAppMessageLog.deleteMany({});
    deleted = result.count;
  } catch {
    const raw = await prisma.$executeRawUnsafe(`DELETE FROM whatsapp_message_logs`);
    deleted = Number(raw) || 0;
  }

  try {
    await prisma.whatsAppCampaign.updateMany({
      data: {
        sentCount: 0,
        failedCount: 0,
        totalCostEur: 0,
        status: 'cancelled',
        completedAt: new Date(),
      },
    });
  } catch {
    await prisma.$executeRawUnsafe(`
      UPDATE whatsapp_campaigns
      SET "sentCount" = 0, "failedCount" = 0, "totalCostEur" = 0,
          status = 'cancelled', "completedAt" = NOW()
    `);
  }

  return deleted;
}

export function withCampaignCost<T extends { sentCount: number; totalCostEur?: number }>(
  campaign: T
): T & { totalCostEur: number } {
  return { ...campaign, totalCostEur: computeWhatsAppCost(campaign.sentCount) };
}
