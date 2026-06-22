import prisma from '../lib/prisma';
import { WHATSAPP_MESSAGE_COST_EUR } from '../services/whatsapp.service';

const LEGACY_COST_EUR = 0.0035;

/** Corrige logs y campañas guardados con el coste antiguo (0,0035 € → 0,035 €) */
export async function syncWhatsAppStoredCosts(): Promise<void> {
  try {
    await prisma.whatsAppMessageLog.updateMany({
      where: {
        status: 'sent',
        costEur: { gt: 0, lt: WHATSAPP_MESSAGE_COST_EUR * 0.5 },
      },
      data: { costEur: WHATSAPP_MESSAGE_COST_EUR },
    });

    const campaigns = await prisma.whatsAppCampaign.findMany({
      select: { id: true, sentCount: true, totalCostEur: true },
    });

    for (const campaign of campaigns) {
      const expected = campaign.sentCount * WHATSAPP_MESSAGE_COST_EUR;
      if (Math.abs(campaign.totalCostEur - expected) > 0.0001) {
        await prisma.whatsAppCampaign.update({
          where: { id: campaign.id },
          data: { totalCostEur: expected },
        });
      }
    }
  } catch (err) {
    console.warn('syncWhatsAppStoredCosts:', err);
  }
}

export function computeWhatsAppCost(sentCount: number): number {
  return sentCount * WHATSAPP_MESSAGE_COST_EUR;
}

export { LEGACY_COST_EUR };
