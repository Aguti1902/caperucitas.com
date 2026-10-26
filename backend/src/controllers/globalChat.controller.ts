import { Request, Response } from 'express'
import { randomUUID } from 'crypto'
import prisma from '../lib/prisma'
import { ensureGlobalChatSchema } from '../utils/global-chat-migrate.utils'

const MAX_NICK = 24
const MAX_BODY = 400
const MAX_FETCH = 80

function sanitizeNick(raw: unknown): string {
  const s = String(raw || '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, MAX_NICK)
  return s || 'Anónimo'
}

function sanitizeBody(raw: unknown): string {
  return String(raw || '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, MAX_BODY)
}

export const listGlobalChat = async (_req: Request, res: Response) => {
  try {
    await ensureGlobalChatSchema()
    const rows = (await prisma.$queryRawUnsafe(
      `SELECT id, nickname, body, "createdAt"
       FROM global_chat_messages
       ORDER BY "createdAt" DESC
       LIMIT $1`,
      MAX_FETCH
    )) as Array<{ id: string; nickname: string; body: string; createdAt: Date }>

    res.json({
      messages: rows.reverse().map((r) => ({
        id: r.id,
        nickname: r.nickname,
        body: r.body,
        createdAt: r.createdAt,
      })),
    })
  } catch (error) {
    console.error('listGlobalChat:', error)
    res.status(500).json({ error: 'Error al cargar el chat' })
  }
}

export const postGlobalChat = async (req: Request, res: Response) => {
  try {
    await ensureGlobalChatSchema()
    const nickname = sanitizeNick(req.body?.nickname)
    const body = sanitizeBody(req.body?.body)

    if (!body) {
      return res.status(400).json({ error: 'Escribe un mensaje' })
    }

    const id = randomUUID()
    await prisma.$executeRawUnsafe(
      `INSERT INTO global_chat_messages (id, nickname, body, "createdAt")
       VALUES ($1, $2, $3, NOW())`,
      id,
      nickname,
      body
    )

    res.status(201).json({
      message: {
        id,
        nickname,
        body,
        createdAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('postGlobalChat:', error)
    res.status(500).json({ error: 'Error al enviar el mensaje' })
  }
}
