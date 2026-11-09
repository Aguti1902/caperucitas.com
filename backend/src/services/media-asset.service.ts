import { randomUUID } from 'crypto'
import fs from 'fs'
import type { Request } from 'express'
import prisma from '../lib/prisma'
import { ensureMediaAssetsSchema } from '../utils/media-assets-migrate.utils'
import { getPublicBaseUrl } from '../config/local-upload'

export function mediaPublicUrl(req: Request | undefined, mediaId: string): string {
  return `${getPublicBaseUrl(req)}/api/media/${mediaId}`
}

export async function saveMediaBuffer(opts: {
  buffer: Buffer
  mimeType?: string
  publicId?: string | null
  sourceUrl?: string | null
}): Promise<{ id: string }> {
  await ensureMediaAssetsSchema()
  const id = randomUUID()
  const mime = opts.mimeType || 'image/jpeg'
  const publicId = opts.publicId || null
  const sourceUrl = opts.sourceUrl || null

  if (publicId) {
    // upsert by publicId
    const existing = (await prisma.$queryRawUnsafe(
      `SELECT id FROM media_assets WHERE "publicId" = $1 LIMIT 1`,
      publicId
    )) as Array<{ id: string }>
    if (existing[0]) {
      await prisma.$executeRawUnsafe(
        `UPDATE media_assets SET "mimeType" = $1, bytes = $2, data = $3, "sourceUrl" = COALESCE($4, "sourceUrl")
         WHERE id = $5`,
        mime,
        opts.buffer.length,
        opts.buffer,
        sourceUrl,
        existing[0].id
      )
      return { id: existing[0].id }
    }
  }

  await prisma.$executeRawUnsafe(
    `INSERT INTO media_assets (id, "publicId", "mimeType", bytes, data, "sourceUrl", "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
    id,
    publicId,
    mime,
    opts.buffer.length,
    opts.buffer,
    sourceUrl
  )
  return { id }
}

export async function saveMediaFromDiskFile(opts: {
  filePath: string
  mimeType?: string
  publicId?: string | null
  sourceUrl?: string | null
}) {
  const buffer = fs.readFileSync(opts.filePath)
  return saveMediaBuffer({
    buffer,
    mimeType: opts.mimeType,
    publicId: opts.publicId,
    sourceUrl: opts.sourceUrl,
  })
}

export async function deleteMediaByUrl(url: string | null | undefined) {
  if (!url) return
  const m = url.match(/\/api\/media\/([a-zA-Z0-9_-]+)/)
  if (!m) return
  try {
    await prisma.$executeRawUnsafe(`DELETE FROM media_assets WHERE id = $1`, m[1])
  } catch {
    /* ignore */
  }
}
