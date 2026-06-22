import prisma from '../lib/prisma';

const BATCH_SIZE = 500;

export async function upsertWhatsAppContactsBatch(
  parsed: { phone: string; name?: string }[],
  source: string,
  options?: { skipUpdates?: boolean }
): Promise<{ imported: number; updated: number; total: number; skipped: number }> {
  let imported = 0;
  let updated = 0;
  let skipped = 0;
  const skipUpdates = options?.skipUpdates ?? false;

  for (let i = 0; i < parsed.length; i += BATCH_SIZE) {
    const chunk = parsed.slice(i, i + BATCH_SIZE);

    if (skipUpdates) {
      const result = await prisma.whatsAppContact.createMany({
        data: chunk.map((c) => ({ phone: c.phone, name: c.name, source })),
        skipDuplicates: true,
      });
      imported += result.count;
      continue;
    }

    const phones = chunk.map((c) => c.phone);
    const existing = await prisma.whatsAppContact.findMany({
      where: { phone: { in: phones } },
      select: { phone: true },
    });
    const existingSet = new Set(existing.map((e) => e.phone));

    const toCreate = chunk.filter((c) => !existingSet.has(c.phone));
    const toUpdate = chunk.filter((c) => existingSet.has(c.phone));

    if (toCreate.length > 0) {
      const result = await prisma.whatsAppContact.createMany({
        data: toCreate.map((c) => ({ phone: c.phone, name: c.name, source })),
        skipDuplicates: true,
      });
      imported += result.count;
    }

    skipped += toUpdate.length;
    if (toUpdate.length > 0 && !skipUpdates) {
      await prisma.$transaction(
        toUpdate.map((item) =>
          prisma.whatsAppContact.update({
            where: { phone: item.phone },
            data: { source, ...(item.name ? { name: item.name } : {}) },
          })
        )
      );
      updated += toUpdate.length;
    }
  }

  return { imported, updated, total: parsed.length, skipped };
}
