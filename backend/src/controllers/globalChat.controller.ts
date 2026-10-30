import { Request, Response } from 'express'
import { randomUUID } from 'crypto'
import prisma from '../lib/prisma'
import { ensureGlobalChatSchema } from '../utils/global-chat-migrate.utils'

const MAX_NICK = 24
const MAX_BODY = 400
const MAX_FETCH = 80
const ONLINE_MS = 45_000

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

function sanitizeGuestId(raw: unknown): string {
  const s = String(raw || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64)
  return s || randomUUID()
}

export const listGlobalChat = async (_req: Request, res: Response) => {
  try {
    await ensureGlobalChatSchema()
    const rows = (await prisma.$queryRawUnsafe(
      `SELECT id, nickname, body, "guestId", "createdAt"
       FROM global_chat_messages
       ORDER BY "createdAt" DESC
       LIMIT $1`,
      MAX_FETCH
    )) as Array<{
      id: string
      nickname: string
      body: string
      guestId: string | null
      createdAt: Date
    }>

    res.json({
      messages: rows.reverse().map((r) => ({
        id: r.id,
        nickname: r.nickname,
        body: r.body,
        guestId: r.guestId,
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
    const guestId = sanitizeGuestId(req.body?.guestId)

    if (!body) {
      return res.status(400).json({ error: 'Escribe un mensaje' })
    }

    const id = randomUUID()
    await prisma.$executeRawUnsafe(
      `INSERT INTO global_chat_messages (id, nickname, body, "guestId", "createdAt")
       VALUES ($1, $2, $3, $4, NOW())`,
      id,
      nickname,
      body,
      guestId
    )

    // heartbeat presence
    await prisma.$executeRawUnsafe(
      `INSERT INTO global_chat_presence ("guestId", nickname, "lastSeenAt", typing, "typingTo")
       VALUES ($1, $2, NOW(), false, NULL)
       ON CONFLICT ("guestId") DO UPDATE SET nickname = $2, "lastSeenAt" = NOW()`,
      guestId,
      nickname
    )

    res.status(201).json({
      message: {
        id,
        nickname,
        body,
        guestId,
        createdAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('postGlobalChat:', error)
    res.status(500).json({ error: 'Error al enviar el mensaje' })
  }
}

/** Heartbeat + lista de conectados / última conexión */
export const presenceGlobalChat = async (req: Request, res: Response) => {
  try {
    await ensureGlobalChatSchema()
    const guestId = sanitizeGuestId(req.body?.guestId || req.query?.guestId)
    const nickname = sanitizeNick(req.body?.nickname || req.query?.nickname)
    const typing = Boolean(req.body?.typing)
    const typingTo = req.body?.typingTo ? sanitizeGuestId(req.body.typingTo) : null

    await prisma.$executeRawUnsafe(
      `INSERT INTO global_chat_presence ("guestId", nickname, "lastSeenAt", typing, "typingTo")
       VALUES ($1, $2, NOW(), $3, $4)
       ON CONFLICT ("guestId") DO UPDATE SET
         nickname = $2,
         "lastSeenAt" = NOW(),
         typing = $3,
         "typingTo" = $4`,
      guestId,
      nickname,
      typing,
      typingTo
    )

    const rows = (await prisma.$queryRawUnsafe(
      `SELECT "guestId", nickname, "lastSeenAt", typing, "typingTo"
       FROM global_chat_presence
       WHERE "lastSeenAt" > NOW() - INTERVAL '10 minutes'
       ORDER BY "lastSeenAt" DESC
       LIMIT 100`
    )) as Array<{
      guestId: string
      nickname: string
      lastSeenAt: Date
      typing: boolean
      typingTo: string | null
    }>

    const now = Date.now()
    res.json({
      guestId,
      users: rows.map((r) => ({
        guestId: r.guestId,
        nickname: r.nickname,
        lastSeenAt: r.lastSeenAt,
        isOnline: now - new Date(r.lastSeenAt).getTime() < ONLINE_MS,
        typing: r.typing,
        typingTo: r.typingTo,
      })),
    })
  } catch (error) {
    console.error('presenceGlobalChat:', error)
    res.status(500).json({ error: 'Error de presencia' })
  }
}

export const listDms = async (req: Request, res: Response) => {
  try {
    await ensureGlobalChatSchema()
    const me = sanitizeGuestId(req.query?.guestId)
    const other = sanitizeGuestId(req.query?.with)
    if (!me || !other) {
      return res.status(400).json({ error: 'Faltan participantes' })
    }

    const rows = (await prisma.$queryRawUnsafe(
      `SELECT id, "fromGuestId", "toGuestId", "fromNickname", body, "createdAt", "readAt"
       FROM global_chat_dms
       WHERE ("fromGuestId" = $1 AND "toGuestId" = $2)
          OR ("fromGuestId" = $2 AND "toGuestId" = $1)
       ORDER BY "createdAt" ASC
       LIMIT 200`,
      me,
      other
    )) as Array<{
      id: string
      fromGuestId: string
      toGuestId: string
      fromNickname: string
      body: string
      createdAt: Date
      readAt: Date | null
    }>

    // Marcar como leídos los recibidos
    await prisma.$executeRawUnsafe(
      `UPDATE global_chat_dms SET "readAt" = NOW()
       WHERE "toGuestId" = $1 AND "fromGuestId" = $2 AND "readAt" IS NULL`,
      me,
      other
    )

    res.json({
      messages: rows.map((r) => ({
        id: r.id,
        fromGuestId: r.fromGuestId,
        toGuestId: r.toGuestId,
        fromNickname: r.fromNickname,
        body: r.body,
        createdAt: r.createdAt,
        readAt: r.readAt,
        mine: r.fromGuestId === me,
      })),
    })
  } catch (error) {
    console.error('listDms:', error)
    res.status(500).json({ error: 'Error al cargar privados' })
  }
}

export const postDm = async (req: Request, res: Response) => {
  try {
    await ensureGlobalChatSchema()
    const fromGuestId = sanitizeGuestId(req.body?.guestId)
    const toGuestId = sanitizeGuestId(req.body?.toGuestId)
    const fromNickname = sanitizeNick(req.body?.nickname)
    const body = sanitizeBody(req.body?.body)

    if (!body) return res.status(400).json({ error: 'Escribe un mensaje' })
    if (fromGuestId === toGuestId) {
      return res.status(400).json({ error: 'No puedes enviarte un privado a ti mismo' })
    }

    const id = randomUUID()
    await prisma.$executeRawUnsafe(
      `INSERT INTO global_chat_dms
        (id, "fromGuestId", "toGuestId", "fromNickname", body, "createdAt")
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      id,
      fromGuestId,
      toGuestId,
      fromNickname,
      body
    )

    await prisma.$executeRawUnsafe(
      `INSERT INTO global_chat_presence ("guestId", nickname, "lastSeenAt", typing, "typingTo")
       VALUES ($1, $2, NOW(), false, NULL)
       ON CONFLICT ("guestId") DO UPDATE SET nickname = $2, "lastSeenAt" = NOW(), typing = false, "typingTo" = NULL`,
      fromGuestId,
      fromNickname
    )

    res.status(201).json({
      message: {
        id,
        fromGuestId,
        toGuestId,
        fromNickname,
        body,
        createdAt: new Date().toISOString(),
        readAt: null,
        mine: true,
      },
    })
  } catch (error) {
    console.error('postDm:', error)
    res.status(500).json({ error: 'Error al enviar privado' })
  }
}
