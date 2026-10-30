import prisma from '../lib/prisma'

let ensured = false

export async function ensureGlobalChatSchema() {
  if (ensured) return
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS global_chat_messages (
      id TEXT PRIMARY KEY,
      nickname TEXT NOT NULL,
      body TEXT NOT NULL,
      "guestId" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS global_chat_messages_createdAt_idx
    ON global_chat_messages ("createdAt" DESC)
  `)
  // Column guestId may be missing on older tables
  await prisma.$executeRawUnsafe(`
    ALTER TABLE global_chat_messages ADD COLUMN IF NOT EXISTS "guestId" TEXT
  `)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS global_chat_presence (
      "guestId" TEXT PRIMARY KEY,
      nickname TEXT NOT NULL,
      "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      typing BOOLEAN NOT NULL DEFAULT false,
      "typingTo" TEXT
    )
  `)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS global_chat_dms (
      id TEXT PRIMARY KEY,
      "fromGuestId" TEXT NOT NULL,
      "toGuestId" TEXT NOT NULL,
      "fromNickname" TEXT NOT NULL,
      body TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "readAt" TIMESTAMP(3)
    )
  `)
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS global_chat_dms_pair_idx
    ON global_chat_dms ("fromGuestId", "toGuestId", "createdAt" DESC)
  `)

  ensured = true
}
