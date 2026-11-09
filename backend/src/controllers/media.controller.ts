import { Request, Response } from 'express'
import prisma from '../lib/prisma'
import { ensureMediaAssetsSchema } from '../utils/media-assets-migrate.utils'

export const getMediaById = async (req: Request, res: Response) => {
  try {
    await ensureMediaAssetsSchema()
    const id = String(req.params.id || '').replace(/[^a-zA-Z0-9_-]/g, '')
    if (!id) return res.status(400).json({ error: 'id inválido' })

    const rows = (await prisma.$queryRawUnsafe(
      `SELECT "mimeType", data FROM media_assets WHERE id = $1 LIMIT 1`,
      id
    )) as Array<{ mimeType: string; data: Buffer }>

    if (!rows[0]) return res.status(404).json({ error: 'Media no encontrada' })

    res.setHeader('Content-Type', rows[0].mimeType || 'image/jpeg')
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    res.send(Buffer.from(rows[0].data))
  } catch (error) {
    console.error('getMediaById:', error)
    res.status(500).json({ error: 'Error al servir media' })
  }
}

export const getMediaByPublicId = async (req: Request, res: Response) => {
  try {
    await ensureMediaAssetsSchema()
    // publicId puede venir URL-encoded con slashes: 9citas/profiles/xyz
    const raw = decodeURIComponent(String(req.params[0] || req.params.publicId || ''))
    const publicId = raw.replace(/\.\./g, '').slice(0, 300)
    if (!publicId) return res.status(400).json({ error: 'publicId inválido' })

    const rows = (await prisma.$queryRawUnsafe(
      `SELECT "mimeType", data FROM media_assets WHERE "publicId" = $1 LIMIT 1`,
      publicId
    )) as Array<{ mimeType: string; data: Buffer }>

    if (!rows[0]) return res.status(404).json({ error: 'Media no encontrada' })

    res.setHeader('Content-Type', rows[0].mimeType || 'image/jpeg')
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    res.send(Buffer.from(rows[0].data))
  } catch (error) {
    console.error('getMediaByPublicId:', error)
    res.status(500).json({ error: 'Error al servir media' })
  }
}
