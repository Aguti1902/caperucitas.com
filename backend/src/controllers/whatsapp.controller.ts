import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  WHATSAPP_MESSAGE_COST_EUR,
  DEFAULT_DELAY_MS,
  getInstanceStatus,
  sendTextMessage,
  normalizePhone,
  sleep,
  isEvolutionConfigured,
  listInstances,
  getDefaultInstanceName,
} from '../services/whatsapp.service';

const runningCampaigns = new Set<string>();

async function processCampaign(campaignId: string) {
  if (runningCampaigns.has(campaignId)) return;
  runningCampaigns.add(campaignId);

  try {
    const campaign = await prisma.whatsAppCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.status === 'cancelled') return;

    await prisma.whatsAppCampaign.update({
      where: { id: campaignId },
      data: { status: 'running', startedAt: campaign.startedAt || new Date() },
    });

    const pending = await prisma.whatsAppMessageLog.findMany({
      where: { campaignId, status: 'pending' },
      orderBy: { createdAt: 'asc' },
    });

    for (const log of pending) {
      const current = await prisma.whatsAppCampaign.findUnique({ where: { id: campaignId } });
      if (!current || current.status === 'cancelled') break;

      const result = await sendTextMessage(log.phone, campaign.message, campaign.instanceName || undefined);

      if (result.success) {
        await prisma.whatsAppMessageLog.update({
          where: { id: log.id },
          data: {
            status: 'sent',
            sentAt: new Date(),
            costEur: WHATSAPP_MESSAGE_COST_EUR,
          },
        });
        await prisma.whatsAppCampaign.update({
          where: { id: campaignId },
          data: {
            sentCount: { increment: 1 },
            totalCostEur: { increment: WHATSAPP_MESSAGE_COST_EUR },
          },
        });
      } else {
        await prisma.whatsAppMessageLog.update({
          where: { id: log.id },
          data: { status: 'failed', error: result.error?.slice(0, 500) },
        });
        await prisma.whatsAppCampaign.update({
          where: { id: campaignId },
          data: { failedCount: { increment: 1 } },
        });
      }

      await sleep(campaign.delayMs || DEFAULT_DELAY_MS);
    }

    const final = await prisma.whatsAppCampaign.findUnique({ where: { id: campaignId } });
    if (final && final.status !== 'cancelled') {
      await prisma.whatsAppCampaign.update({
        where: { id: campaignId },
        data: { status: 'completed', completedAt: new Date() },
      });
    }
  } catch (err) {
    console.error('Error procesando campaña WhatsApp:', err);
    await prisma.whatsAppCampaign.update({
      where: { id: campaignId },
      data: { status: 'failed', completedAt: new Date() },
    });
  } finally {
    runningCampaigns.delete(campaignId);
  }
}

function parsePhoneLines(raw: string): { phone: string; name?: string }[] {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const results: { phone: string; name?: string }[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    let phone = line;
    let name: string | undefined;

    if (line.includes(';')) {
      const [a, b] = line.split(';');
      name = a.trim();
      phone = b.trim();
    } else if (line.includes(',')) {
      const parts = line.split(',');
      if (parts.length >= 2 && parts[0].replace(/\D/g, '').length < 6) {
        name = parts[0].trim();
        phone = parts.slice(1).join(',').trim();
      } else {
        phone = line;
      }
    } else if (line.includes('\t')) {
      const [a, b] = line.split('\t');
      name = a?.trim();
      phone = b?.trim() || line;
    }

    const normalized = normalizePhone(phone);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      results.push({ phone: normalized, name });
    }
  }
  return results;
}

async function countProfilePhones(): Promise<number> {
  const profiles = await prisma.profile.findMany({
    where: {
      isFake: false,
      OR: [{ whatsapp: { not: null } }, { phone: { not: null } }],
    },
    select: { whatsapp: true, phone: true },
  });
  const seen = new Set<string>();
  for (const p of profiles) {
    const n = normalizePhone(p.whatsapp || p.phone || '');
    if (n) seen.add(n);
  }
  return seen.size;
}

export const getWhatsAppInstances = async (_req: AuthRequest, res: Response) => {
  const data = await listInstances();
  res.json({ ...data, defaultInstance: getDefaultInstanceName(), costPerMessage: WHATSAPP_MESSAGE_COST_EUR });
};

export const getWhatsAppStats = async (_req: AuthRequest, res: Response) => {
  try {
    const profilePhoneCount = await countProfilePhones();

    let totals: { status: string; _count: { id: number }; _sum: { costEur: number | null } }[] = [];
    let todaySent = 0;
    let contactCount = 0;
    let campaigns = 0;

    try {
      [totals, todaySent, contactCount, campaigns] = await Promise.all([
        prisma.whatsAppMessageLog.groupBy({
          by: ['status'],
          _count: { id: true },
          _sum: { costEur: true },
        }),
        prisma.whatsAppMessageLog.count({
          where: {
            status: 'sent',
            sentAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
        }),
        prisma.whatsAppContact.count(),
        prisma.whatsAppCampaign.count(),
      ]);
    } catch (dbErr) {
      console.warn('Tablas WhatsApp no disponibles aún:', dbErr);
    }

    const sent = totals.find((t) => t.status === 'sent')?._count.id || 0;
    const failed = totals.find((t) => t.status === 'failed')?._count.id || 0;
    const pending = totals.find((t) => t.status === 'pending')?._count.id || 0;
    const totalCostEur = totals.reduce((acc, t) => acc + (t._sum.costEur || 0), 0);

    const instancesData = await listInstances();
    const selectedInstance = getDefaultInstanceName();
    const instance = selectedInstance
      ? await getInstanceStatus(selectedInstance)
      : instancesData.instances[0]
        ? await getInstanceStatus(instancesData.instances[0].name)
        : await getInstanceStatus();

    res.json({
      costPerMessage: WHATSAPP_MESSAGE_COST_EUR,
      totals: {
        sent,
        failed,
        pending,
        totalCostEur,
        contactCount,
        profilePhoneCount,
        campaigns,
        reachableTotal: contactCount + profilePhoneCount,
      },
      todaySent,
      todayCostEur: todaySent * WHATSAPP_MESSAGE_COST_EUR,
      instance,
      instances: instancesData.instances,
      evolutionConfigured: isEvolutionConfigured(),
    });
  } catch (error) {
    console.error('Error getWhatsAppStats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas WhatsApp' });
  }
};

export const getInstanceConnection = async (_req: AuthRequest, res: Response) => {
  const status = await getInstanceStatus();
  res.json({ ...status, costPerMessage: WHATSAPP_MESSAGE_COST_EUR });
};

export const importContacts = async (req: AuthRequest, res: Response) => {
  try {
    const { phones, source = 'import' } = req.body as { phones: string; source?: string };
    if (!phones?.trim()) {
      return res.status(400).json({ error: 'Debes pegar al menos un número de teléfono' });
    }

    const parsed = parsePhoneLines(phones);
    if (parsed.length === 0) {
      return res.status(400).json({ error: 'No se encontraron números válidos' });
    }

    let imported = 0;
    let updated = 0;
    for (const item of parsed) {
      const existing = await prisma.whatsAppContact.findUnique({ where: { phone: item.phone } });
      if (existing) {
        await prisma.whatsAppContact.update({
          where: { phone: item.phone },
          data: { name: item.name || existing.name, source },
        });
        updated++;
      } else {
        await prisma.whatsAppContact.create({
          data: { phone: item.phone, name: item.name, source },
        });
        imported++;
      }
    }

    res.json({ imported, updated, total: parsed.length, contactCount: await prisma.whatsAppContact.count() });
  } catch (error) {
    console.error('Error importContacts:', error);
    res.status(500).json({ error: 'Error al importar contactos' });
  }
};

export const getContacts = async (req: AuthRequest, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const skip = (page - 1) * limit;

    const [contacts, total] = await Promise.all([
      prisma.whatsAppContact.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.whatsAppContact.count(),
    ]);

    res.json({ contacts, total, page, limit });
  } catch (error) {
    res.status(500).json({ error: 'Error al listar contactos' });
  }
};

export const syncProfileContacts = async (_req: AuthRequest, res: Response) => {
  try {
    const profiles = await prisma.profile.findMany({
      where: {
        isFake: false,
        OR: [{ whatsapp: { not: null } }, { phone: { not: null } }],
      },
      select: { id: true, title: true, whatsapp: true, phone: true },
    });

    let synced = 0;
    for (const p of profiles) {
      const raw = p.whatsapp || p.phone;
      if (!raw) continue;
      const phone = normalizePhone(raw);
      if (!phone) continue;

      await prisma.whatsAppContact.upsert({
        where: { phone },
        create: { phone, name: p.title, source: 'profile', profileId: p.id },
        update: { name: p.title, profileId: p.id, source: 'profile' },
      });
      synced++;
    }

    res.json({ synced, contactCount: await prisma.whatsAppContact.count() });
  } catch (error) {
    console.error('Error syncProfileContacts:', error);
    res.status(500).json({ error: 'Error al sincronizar contactos de perfiles' });
  }
};

export const getCampaigns = async (_req: AuthRequest, res: Response) => {
  try {
    const campaigns = await prisma.whatsAppCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ campaigns, costPerMessage: WHATSAPP_MESSAGE_COST_EUR });
  } catch (error) {
    res.status(500).json({ error: 'Error al listar campañas' });
  }
};

export const getCampaignById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const campaign = await prisma.whatsAppCampaign.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 500,
        },
      },
    });
    if (!campaign) return res.status(404).json({ error: 'Campaña no encontrada' });
    res.json({ campaign, costPerMessage: WHATSAPP_MESSAGE_COST_EUR });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener campaña' });
  }
};

async function resolveRecipients(source: string, manualPhones?: string): Promise<{ phone: string; name?: string }[]> {
  const recipients: { phone: string; name?: string }[] = [];
  const seen = new Set<string>();

  const add = (phone: string, name?: string) => {
    const n = normalizePhone(phone);
    if (n && !seen.has(n)) {
      seen.add(n);
      recipients.push({ phone: n, name });
    }
  };

  if (source === 'contacts_db' || source === 'mixed') {
    const contacts = await prisma.whatsAppContact.findMany();
    contacts.forEach((c) => add(c.phone, c.name || undefined));
  }

  if (source === 'profiles' || source === 'mixed') {
    const profiles = await prisma.profile.findMany({
      where: {
        isFake: false,
        isPaused: false,
        OR: [{ whatsapp: { not: null } }, { phone: { not: null } }],
      },
      select: { title: true, whatsapp: true, phone: true },
    });
    profiles.forEach((p) => add(p.whatsapp || p.phone || '', p.title));
  }

  if (source === 'manual' && manualPhones) {
    parsePhoneLines(manualPhones).forEach((r) => add(r.phone, r.name));
  }

  return recipients;
}

export const createCampaign = async (req: AuthRequest, res: Response) => {
  try {
    const { name, message, source = 'contacts_db', phones, delayMs = DEFAULT_DELAY_MS, instanceName } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ error: 'El mensaje es obligatorio' });
    }
    if (!isEvolutionConfigured()) {
      return res.status(400).json({ error: 'Evolution API no está configurada en el servidor' });
    }

    const resolvedInstance = (instanceName || getDefaultInstanceName()).trim();
    if (!resolvedInstance) {
      return res.status(400).json({ error: 'Selecciona el móvil/instancia desde el que enviar' });
    }

    const instance = await getInstanceStatus(resolvedInstance);
    if (!instance.connected) {
      return res.status(400).json({
        error: `WhatsApp "${resolvedInstance}" no conectado: ${instance.error || instance.state || 'desconocido'}`,
      });
    }

    const recipients = await resolveRecipients(source, phones);
    if (recipients.length === 0) {
      return res.status(400).json({ error: 'No hay destinatarios válidos para esta campaña' });
    }

    const campaign = await prisma.whatsAppCampaign.create({
      data: {
        name: name?.trim() || `Campaña ${new Date().toLocaleString('es-ES')}`,
        message: message.trim(),
        source,
        instanceName: resolvedInstance,
        totalCount: recipients.length,
        delayMs: Math.max(1000, Math.min(Number(delayMs) || DEFAULT_DELAY_MS, 10000)),
        messages: {
          create: recipients.map((r) => ({
            phone: r.phone,
            name: r.name,
            status: 'pending',
          })),
        },
      },
    });

    setImmediate(() => processCampaign(campaign.id));

    res.status(201).json({
      campaign,
      estimatedCostEur: recipients.length * WHATSAPP_MESSAGE_COST_EUR,
      costPerMessage: WHATSAPP_MESSAGE_COST_EUR,
    });
  } catch (error) {
    console.error('Error createCampaign:', error);
    res.status(500).json({ error: 'Error al crear campaña' });
  }
};

export const sendTestMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { phone, message, instanceName } = req.body;
    if (!phone || !message?.trim()) {
      return res.status(400).json({ error: 'Teléfono y mensaje son obligatorios' });
    }

    const resolvedInstance = (instanceName || getDefaultInstanceName()).trim();
    if (!resolvedInstance) {
      return res.status(400).json({ error: 'Selecciona el móvil/instancia emisor' });
    }

    const result = await sendTextMessage(phone, message.trim(), resolvedInstance);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      costEur: WHATSAPP_MESSAGE_COST_EUR,
      phone: normalizePhone(phone),
      instanceName: resolvedInstance,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al enviar mensaje de prueba' });
  }
};

export const cancelCampaign = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.whatsAppCampaign.update({
      where: { id },
      data: { status: 'cancelled', completedAt: new Date() },
    });
    res.json({ message: 'Campaña cancelada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al cancelar campaña' });
  }
};

export const getRecipientCount = async (req: AuthRequest, res: Response) => {
  try {
    const source = String(req.query.source || 'contacts_db');
    const phones = req.query.phones ? String(req.query.phones) : undefined;
    const recipients = await resolveRecipients(source, phones);
    res.json({
      count: recipients.length,
      estimatedCostEur: recipients.length * WHATSAPP_MESSAGE_COST_EUR,
      costPerMessage: WHATSAPP_MESSAGE_COST_EUR,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al calcular destinatarios' });
  }
};

export const deleteContact = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.whatsAppContact.delete({ where: { id: req.params.id } });
    res.json({ message: 'Contacto eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar contacto' });
  }
};
