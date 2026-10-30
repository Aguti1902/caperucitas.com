import { Request, Response } from 'express'
import { randomUUID } from 'crypto'
import prisma from '../lib/prisma'
import { ensureGlobalChatSchema } from '../utils/global-chat-migrate.utils'

const MAX_NICK = 24
const MAX_BODY = 400
const MAX_FETCH = 100
const ONLINE_MS = 45_000
const ALLOWED_REACT = new Set(['❤️', '🔥', '😂', '👍', '💋', '😮', '😢'])

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

function sanitizeImageUrl(raw: unknown): string | null {
  const s = String(raw || '').trim()
  if (!s) return null
  if (s.startsWith('https://res.cloudinary.com/') || s.startsWith('https://')) {
    return s.slice(0, 500)
  }
  return null
}

function sanitizeReplyId(raw: unknown): string | null {
  const s = String(raw || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64)
  return s || null
}

async function loadReactions(channel: 'public' | 'dm', ids: string[]) {
  if (ids.length === 0) return {} as Record<string, Array<{ emoji: string; count: number; mine?: boolean }>>
  const rows = (await prisma.$queryRawUnsafe(
    `SELECT "messageId", emoji, COUNT(*)::int AS count
     FROM global_chat_reactions
     WHERE channel = $1 AND "messageId" = ANY($2::text[])
     GROUP BY "messageId", emoji`,
    channel,
    ids
  )) as Array<{ messageId: string; emoji: string; count: number }>

  const map: Record<string, Array<{ emoji: string; count: number }>> = {}
  for (const r of rows) {
    if (!map[r.messageId]) map[r.messageId] = []
    map[r.messageId].push({ emoji: r.emoji, count: r.count })
  }
  return map
}

async function bumpPresence(guestId: string, nickname: string) {
  await prisma.$executeRawUnsafe(
    `INSERT INTO global_chat_presence ("guestId", nickname, "lastSeenAt", typing, "typingTo")
     VALUES ($1, $2, NOW(), false, NULL)
     ON CONFLICT ("guestId") DO UPDATE SET nickname = $2, "lastSeenAt" = NOW(), typing = false, "typingTo" = NULL`,
    guestId,
    nickname
  )
}

export const listGlobalChat = async (req: Request, res: Response) => {
  try {
    await ensureGlobalChatSchema()
    const guestId = req.query?.guestId ? sanitizeGuestId(req.query.guestId) : null
    const rows = (await prisma.$queryRawUnsafe(
      `SELECT id, nickname, body, "guestId", "imageUrl", "replyToId", "deletedAt", "createdAt"
       FROM global_chat_messages
       WHERE "deletedAt" IS NULL
       ORDER BY "createdAt" DESC
       LIMIT $1`,
      MAX_FETCH
    )) as Array<{
      id: string
      nickname: string
      body: string
      guestId: string | null
      imageUrl: string | null
      replyToId: string | null
      deletedAt: Date | null
      createdAt: Date
    }>

    const ordered = rows.reverse()
    const reactions = await loadReactions(
      'public',
      ordered.map((r) => r.id)
    )

    // reply snippets
    const replyIds = ordered.map((r) => r.replyToId).filter(Boolean) as string[]
    let replyMap: Record<string, { id: string; nickname: string; body: string }> = {}
    if (replyIds.length) {
      const replies = (await prisma.$queryRawUnsafe(
        `SELECT id, nickname, body FROM global_chat_messages WHERE id = ANY($1::text[])`,
        replyIds
      )) as Array<{ id: string; nickname: string; body: string }>
      replyMap = Object.fromEntries(replies.map((r) => [r.id, r]))
    }

    res.json({
      messages: ordered.map((r) => ({
        id: r.id,
        nickname: r.nickname,
        body: r.body,
        guestId: r.guestId,
        imageUrl: r.imageUrl,
        replyToId: r.replyToId,
        replyTo: r.replyToId ? replyMap[r.replyToId] || null : null,
        reactions: reactions[r.id] || [],
        createdAt: r.createdAt,
        mine: guestId ? r.guestId === guestId : false,
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
    const imageUrl = sanitizeImageUrl(req.body?.imageUrl)
    const replyToId = sanitizeReplyId(req.body?.replyToId)

    if (!body && !imageUrl) {
      return res.status(400).json({ error: 'Escribe un mensaje o envía una foto' })
    }

    const id = randomUUID()
    await prisma.$executeRawUnsafe(
      `INSERT INTO global_chat_messages
        (id, nickname, body, "guestId", "imageUrl", "replyToId", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      id,
      nickname,
      body || (imageUrl ? '📷 Foto' : ''),
      guestId,
      imageUrl,
      replyToId
    )
    await bumpPresence(guestId, nickname)

    res.status(201).json({
      message: {
        id,
        nickname,
        body: body || (imageUrl ? '📷 Foto' : ''),
        guestId,
        imageUrl,
        replyToId,
        reactions: [],
        createdAt: new Date().toISOString(),
        mine: true,
      },
    })
  } catch (error) {
    console.error('postGlobalChat:', error)
    res.status(500).json({ error: 'Error al enviar el mensaje' })
  }
}

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
         nickname = $2, "lastSeenAt" = NOW(), typing = $3, "typingTo" = $4`,
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

    const unreadRows = (await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS c FROM global_chat_dms
       WHERE "toGuestId" = $1 AND "readAt" IS NULL AND "deletedAt" IS NULL`,
      guestId
    )) as Array<{ c: number }>

    const now = Date.now()
    res.json({
      guestId,
      unreadDms: unreadRows[0]?.c || 0,
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
    if (!me || !other) return res.status(400).json({ error: 'Faltan participantes' })

    const rows = (await prisma.$queryRawUnsafe(
      `SELECT id, "fromGuestId", "toGuestId", "fromNickname", body, "imageUrl", "replyToId",
              "createdAt", "readAt", "deletedAt"
       FROM global_chat_dms
       WHERE (("fromGuestId" = $1 AND "toGuestId" = $2)
          OR ("fromGuestId" = $2 AND "toGuestId" = $1))
         AND "deletedAt" IS NULL
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
      imageUrl: string | null
      replyToId: string | null
      createdAt: Date
      readAt: Date | null
    }>

    await prisma.$executeRawUnsafe(
      `UPDATE global_chat_dms SET "readAt" = NOW()
       WHERE "toGuestId" = $1 AND "fromGuestId" = $2 AND "readAt" IS NULL AND "deletedAt" IS NULL`,
      me,
      other
    )

    const reactions = await loadReactions(
      'dm',
      rows.map((r) => r.id)
    )
    const replyIds = rows.map((r) => r.replyToId).filter(Boolean) as string[]
    let replyMap: Record<string, { id: string; fromNickname: string; body: string }> = {}
    if (replyIds.length) {
      const replies = (await prisma.$queryRawUnsafe(
        `SELECT id, "fromNickname", body FROM global_chat_dms WHERE id = ANY($1::text[])`,
        replyIds
      )) as Array<{ id: string; fromNickname: string; body: string }>
      replyMap = Object.fromEntries(replies.map((r) => [r.id, r]))
    }

    res.json({
      messages: rows.map((r) => ({
        id: r.id,
        fromGuestId: r.fromGuestId,
        toGuestId: r.toGuestId,
        fromNickname: r.fromNickname,
        body: r.body,
        imageUrl: r.imageUrl,
        replyToId: r.replyToId,
        replyTo: r.replyToId
          ? {
              id: replyMap[r.replyToId]?.id,
              nickname: replyMap[r.replyToId]?.fromNickname,
              body: replyMap[r.replyToId]?.body,
            }
          : null,
        reactions: reactions[r.id] || [],
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
    const imageUrl = sanitizeImageUrl(req.body?.imageUrl)
    const replyToId = sanitizeReplyId(req.body?.replyToId)

    if (!body && !imageUrl) return res.status(400).json({ error: 'Escribe un mensaje o envía una foto' })
    if (fromGuestId === toGuestId) {
      return res.status(400).json({ error: 'No puedes enviarte un privado a ti mismo' })
    }

    const id = randomUUID()
    const finalBody = body || (imageUrl ? '📷 Foto' : '')
    await prisma.$executeRawUnsafe(
      `INSERT INTO global_chat_dms
        (id, "fromGuestId", "toGuestId", "fromNickname", body, "imageUrl", "replyToId", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      id,
      fromGuestId,
      toGuestId,
      fromNickname,
      finalBody,
      imageUrl,
      replyToId
    )
    await bumpPresence(fromGuestId, fromNickname)

    res.status(201).json({
      message: {
        id,
        fromGuestId,
        toGuestId,
        fromNickname,
        body: finalBody,
        imageUrl,
        replyToId,
        reactions: [],
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

export const reactMessage = async (req: Request, res: Response) => {
  try {
    await ensureGlobalChatSchema()
    const guestId = sanitizeGuestId(req.body?.guestId)
    const messageId = sanitizeReplyId(req.body?.messageId)
    const channel = req.body?.channel === 'dm' ? 'dm' : 'public'
    const emoji = String(req.body?.emoji || '')
    if (!messageId || !ALLOWED_REACT.has(emoji)) {
      return res.status(400).json({ error: 'Reacción no válida' })
    }

    // toggle: if exists delete, else insert
    const existing = (await prisma.$queryRawUnsafe(
      `SELECT id FROM global_chat_reactions
       WHERE "messageId" = $1 AND channel = $2 AND "guestId" = $3 AND emoji = $4
       LIMIT 1`,
      messageId,
      channel,
      guestId,
      emoji
    )) as Array<{ id: string }>

    if (existing[0]) {
      await prisma.$executeRawUnsafe(`DELETE FROM global_chat_reactions WHERE id = $1`, existing[0].id)
    } else {
      await prisma.$executeRawUnsafe(
        `INSERT INTO global_chat_reactions (id, "messageId", channel, "guestId", emoji, "createdAt")
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT DO NOTHING`,
        randomUUID(),
        messageId,
        channel,
        guestId,
        emoji
      )
    }

    const reactions = await loadReactions(channel, [messageId])
    res.json({ reactions: reactions[messageId] || [] })
  } catch (error) {
    console.error('reactMessage:', error)
    res.status(500).json({ error: 'Error al reaccionar' })
  }
}

export const deleteMessage = async (req: Request, res: Response) => {
  try {
    await ensureGlobalChatSchema()
    const guestId = sanitizeGuestId(req.body?.guestId)
    const messageId = sanitizeReplyId(req.body?.messageId || req.params?.id)
    const channel = req.body?.channel === 'dm' ? 'dm' : 'public'
    if (!messageId) return res.status(400).json({ error: 'Mensaje no válido' })

    if (channel === 'dm') {
      const rows = (await prisma.$queryRawUnsafe(
        `SELECT id FROM global_chat_dms WHERE id = $1 AND "fromGuestId" = $2 LIMIT 1`,
        messageId,
        guestId
      )) as Array<{ id: string }>
      if (!rows[0]) return res.status(403).json({ error: 'Solo puedes borrar tus mensajes' })
      await prisma.$executeRawUnsafe(
        `UPDATE global_chat_dms SET "deletedAt" = NOW() WHERE id = $1`,
        messageId
      )
    } else {
      const rows = (await prisma.$queryRawUnsafe(
        `SELECT id FROM global_chat_messages WHERE id = $1 AND "guestId" = $2 LIMIT 1`,
        messageId,
        guestId
      )) as Array<{ id: string }>
      if (!rows[0]) return res.status(403).json({ error: 'Solo puedes borrar tus mensajes' })
      await prisma.$executeRawUnsafe(
        `UPDATE global_chat_messages SET "deletedAt" = NOW() WHERE id = $1`,
        messageId
      )
    }

    res.json({ ok: true })
  } catch (error) {
    console.error('deleteMessage:', error)
    res.status(500).json({ error: 'Error al borrar' })
  }
}

export const uploadChatImage = async (req: Request, res: Response) => {
  try {
    const file = req.file as Express.Multer.File & { path?: string }
    if (!file) return res.status(400).json({ error: 'No se recibió imagen' })
    const url = (file as any).path || (file as any).secure_url || (file as any).url
    if (!url) return res.status(500).json({ error: 'No se pudo subir la imagen' })
    res.status(201).json({ imageUrl: url })
  } catch (error) {
    console.error('uploadChatImage:', error)
    res.status(500).json({ error: 'Error al subir imagen' })
  }
}

export const unreadCount = async (req: Request, res: Response) => {
  try {
    await ensureGlobalChatSchema()
    const guestId = sanitizeGuestId(req.query?.guestId)
    const rows = (await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS c FROM global_chat_dms
       WHERE "toGuestId" = $1 AND "readAt" IS NULL AND "deletedAt" IS NULL`,
      guestId
    )) as Array<{ c: number }>
    res.json({ unread: rows[0]?.c || 0 })
  } catch (error) {
    res.status(500).json({ error: 'Error' })
  }
}
