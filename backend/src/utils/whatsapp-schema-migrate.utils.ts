import prisma from '../lib/prisma';

/** Añade columnas nuevas sin borrar datos (seguro en producción). */
export async function ensureWhatsAppSchemaColumns(): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE whatsapp_settings
      ADD COLUMN IF NOT EXISTS "dailyMessageLimit" INTEGER NOT NULL DEFAULT 1000;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE whatsapp_campaigns
      ADD COLUMN IF NOT EXISTS "pauseReason" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE whatsapp_campaigns
      ADD COLUMN IF NOT EXISTS "pausedAt" TIMESTAMP(3);
    `);
    console.log('✅ WhatsApp: columnas de esquema verificadas');
  } catch (err) {
    console.warn('⚠️ ensureWhatsAppSchemaColumns:', err);
  }
}
