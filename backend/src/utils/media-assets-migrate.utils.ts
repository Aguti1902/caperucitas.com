import prisma from '../lib/prisma'

let ensured = false

export async function ensureMediaAssetsSchema() {
  if (ensured) return
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS media_assets (
      id TEXT PRIMARY KEY,
      "publicId" TEXT UNIQUE,
      "mimeType" TEXT NOT NULL DEFAULT 'image/jpeg',
      bytes INTEGER NOT NULL DEFAULT 0,
      data BYTEA NOT NULL,
      "sourceUrl" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS media_assets_publicId_idx ON media_assets ("publicId")
  `)
  ensured = true
}
