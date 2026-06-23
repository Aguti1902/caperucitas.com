import prisma from '../lib/prisma';

let schemaReady = false;

/** Crea tablas WhatsApp si no existen y añade columnas nuevas en tablas existentes. */
export async function ensureWhatsAppSchema(): Promise<void> {
  if (schemaReady) return;

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS whatsapp_contacts (
      id TEXT PRIMARY KEY,
      phone TEXT NOT NULL UNIQUE,
      name TEXT,
      source TEXT NOT NULL DEFAULT 'import',
      "profileId" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS whatsapp_contacts_phone_idx ON whatsapp_contacts(phone);
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS whatsapp_campaigns (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      message TEXT NOT NULL,
      "imageUrl" TEXT,
      "instanceName" TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      source TEXT NOT NULL,
      "totalCount" INTEGER NOT NULL DEFAULT 0,
      "sentCount" INTEGER NOT NULL DEFAULT 0,
      "failedCount" INTEGER NOT NULL DEFAULT 0,
      "skippedCount" INTEGER NOT NULL DEFAULT 0,
      "totalCostEur" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "delayMs" INTEGER NOT NULL DEFAULT 2000,
      "pauseReason" TEXT,
      "pausedAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "startedAt" TIMESTAMP(3),
      "completedAt" TIMESTAMP(3)
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS whatsapp_campaigns_status_idx ON whatsapp_campaigns(status);
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS whatsapp_campaigns_createdAt_idx ON whatsapp_campaigns("createdAt");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS whatsapp_message_logs (
      id TEXT PRIMARY KEY,
      "campaignId" TEXT,
      phone TEXT NOT NULL,
      name TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      error TEXT,
      "costEur" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "sentAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS whatsapp_message_logs_campaignId_idx ON whatsapp_message_logs("campaignId");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS whatsapp_message_logs_status_idx ON whatsapp_message_logs(status);
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS whatsapp_message_logs_sentAt_idx ON whatsapp_message_logs("sentAt");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS whatsapp_sessions (
      "instanceName" TEXT PRIMARY KEY,
      "authState" JSONB,
      status TEXT NOT NULL DEFAULT 'disconnected',
      phone TEXT,
      "lastQr" TEXT,
      "lastPairingCode" TEXT,
      "pairingPhone" TEXT,
      "lastLinkAttemptAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS whatsapp_settings (
      id TEXT PRIMARY KEY,
      "messageLimit" INTEGER NOT NULL DEFAULT 30000,
      "dailyMessageLimit" INTEGER NOT NULL DEFAULT 1000,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Columnas nuevas en tablas que ya existían sin ellas
  await prisma.$executeRawUnsafe(`
    ALTER TABLE whatsapp_campaigns ADD COLUMN IF NOT EXISTS "pauseReason" TEXT;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE whatsapp_campaigns ADD COLUMN IF NOT EXISTS "pausedAt" TIMESTAMP(3);
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE whatsapp_settings ADD COLUMN IF NOT EXISTS "dailyMessageLimit" INTEGER NOT NULL DEFAULT 1000;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE whatsapp_campaigns ADD COLUMN IF NOT EXISTS "instanceNames" JSONB;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE whatsapp_campaigns ADD COLUMN IF NOT EXISTS "messageVariants" JSONB;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE whatsapp_message_logs ADD COLUMN IF NOT EXISTS "instanceName" TEXT;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE whatsapp_message_logs ADD COLUMN IF NOT EXISTS "messageText" TEXT;
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS whatsapp_message_logs_instanceName_idx ON whatsapp_message_logs("instanceName");
  `);

  // Fila default de settings
  await prisma.$executeRawUnsafe(`
    INSERT INTO whatsapp_settings (id, "messageLimit", "dailyMessageLimit", "updatedAt")
    VALUES ('default', 30000, 150, NOW())
    ON CONFLICT (id) DO NOTHING;
  `);

  // Aplicar límite seguro si estaba demasiado alto (evita repetir bloqueo de WhatsApp)
  await prisma.$executeRawUnsafe(`
    UPDATE whatsapp_settings
    SET "dailyMessageLimit" = 150
    WHERE "dailyMessageLimit" > 150;
  `);

  schemaReady = true;
  console.log('✅ WhatsApp: tablas y columnas verificadas');
}

/** @deprecated Usar ensureWhatsAppSchema */
export async function ensureWhatsAppSchemaColumns(): Promise<void> {
  await ensureWhatsAppSchema();
}
