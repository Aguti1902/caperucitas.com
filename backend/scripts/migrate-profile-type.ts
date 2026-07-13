import prisma from '../src/lib/prisma';

async function migrateProfileType() {
  console.log('🔄 Añadiendo columna profileType (default: escort)');

  await prisma.$executeRawUnsafe(`
    ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS "profileType" TEXT NOT NULL DEFAULT 'escort';
  `);

  const count = await prisma.profile.count();
  console.log(`✅ Listo. ${count} perfiles con profileType=escort por defecto`);
}

migrateProfileType()
  .catch((e) => {
    console.error('❌ Error en migración:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
