import prisma from '../lib/prisma';

/** Asegura columnas y tablas nuevas de perfiles / contacto / freemium. */
export async function ensureProfileSchema(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "profiles"
    ADD COLUMN IF NOT EXISTS "acceptMessages" BOOLEAN NOT NULL DEFAULT false
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "profiles"
    ADD COLUMN IF NOT EXISTS "listingExpiresAt" TIMESTAMP(3)
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "profiles"
    ADD COLUMN IF NOT EXISTS "premiumUntil" TIMESTAMP(3)
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS guest_contact_messages (
      id TEXT PRIMARY KEY,
      "toProfileId" TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      text TEXT NOT NULL,
      "isRead" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT guest_contact_messages_toProfileId_fkey
        FOREIGN KEY ("toProfileId") REFERENCES profiles(id) ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS guest_contact_messages_toProfileId_idx
    ON guest_contact_messages("toProfileId")
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS guest_contact_messages_createdAt_idx
    ON guest_contact_messages("createdAt")
  `);

  console.log('✅ schema perfiles freemium / guest messages listo');
}
