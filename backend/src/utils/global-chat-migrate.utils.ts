import prisma from '../lib/prisma'

let ensured = false

export async function ensureGlobalChatSchema() {
  if (ensured) return
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS global_chat_messages (
      id TEXT PRIMARY KEY,
      nickname TEXT NOT NULL,
      body TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS global_chat_messages_createdAt_idx
    ON global_chat_messages ("createdAt" DESC)
  `)
  ensured = true
}
