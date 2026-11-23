import prisma from '../lib/prisma'

let ensured = false

/** Columnas ubicación fija / móvil (sexo gratis) */
export async function ensureProfileLocationColumns() {
  if (ensured) return
  await prisma.$executeRawUnsafe(`
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "mobileLocationEnabled" BOOLEAN NOT NULL DEFAULT false
  `)
  await prisma.$executeRawUnsafe(`
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "fixedCity" TEXT
  `)
  await prisma.$executeRawUnsafe(`
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "fixedLatitude" DOUBLE PRECISION
  `)
  await prisma.$executeRawUnsafe(`
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "fixedLongitude" DOUBLE PRECISION
  `)
  // Rellenar fija desde ubicación actual si está vacía
  await prisma.$executeRawUnsafe(`
    UPDATE profiles
    SET "fixedCity" = city,
        "fixedLatitude" = latitude,
        "fixedLongitude" = longitude
    WHERE "fixedCity" IS NULL AND city IS NOT NULL
  `)
  ensured = true
}
