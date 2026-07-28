import prisma from '../lib/prisma';

/** Asegura columnas nuevas de perfiles (p. ej. acceptMessages) sin depender de npx. */
export async function ensureProfileSchema(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "profiles"
    ADD COLUMN IF NOT EXISTS "acceptMessages" BOOLEAN NOT NULL DEFAULT false
  `);
  console.log('✅ profiles.acceptMessages listo');
}
