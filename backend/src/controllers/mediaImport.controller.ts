import { Request, Response } from 'express'
import { randomUUID } from 'crypto'
import prisma from '../lib/prisma'
import { ensureMediaAssetsSchema } from '../utils/media-assets-migrate.utils'
import { getPublicBaseUrl } from '../config/local-upload'

type CloudRes = {
  public_id: string
  secure_url: string
  format?: string
}

let importRunning = false
let importStatus: {
  running: boolean
  listed?: number
  ok?: number
  fail?: number
  mappedPhotos?: number
  error?: string
  finishedAt?: string
} = { running: false }

function mimeFromFormat(fmt?: string) {
  const f = (fmt || 'jpg').toLowerCase()
  if (f === 'png') return 'image/png'
  if (f === 'webp') return 'image/webp'
  if (f === 'gif') return 'image/gif'
  return 'image/jpeg'
}

function publicIdFromUrl(url: string): string | null {
  const m = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.(jpe?g|png|webp|gif)(?:\?|$)/i)
  if (m) return m[1]
  const m2 = url.match(/\/upload\/(?:v\d+\/)?([^.?]+)/)
  return m2 ? m2[1] : null
}

function authorize(req: Request): boolean {
  const secret =
    process.env.MIGRATE_SECRET ||
    process.env.ADMIN_PASSWORD ||
    process.env.JWT_SECRET ||
    ''
  if (!secret) return false
  const hdr = String(req.headers['x-migrate-secret'] || '')
  const q = String(req.query.secret || '')
  return hdr === secret || q === secret
}

async function listAllCloudinary(cloud: string, key: string, secret: string): Promise<CloudRes[]> {
  const auth = Buffer.from(`${key}:${secret}`).toString('base64')
  const out: CloudRes[] = []
  let cursor: string | undefined
  do {
    const u = new URL(`https://api.cloudinary.com/v1_1/${cloud}/resources/image`)
    u.searchParams.set('max_results', '500')
    if (cursor) u.searchParams.set('next_cursor', cursor)
    const res = await fetch(u.toString(), { headers: { Authorization: `Basic ${auth}` } })
    if (!res.ok) throw new Error(`Cloudinary list ${res.status}`)
    const data = (await res.json()) as { resources: CloudRes[]; next_cursor?: string }
    out.push(...(data.resources || []))
    cursor = data.next_cursor
  } while (cursor)
  return out
}

async function upsertAsset(publicId: string, sourceUrl: string, buf: Buffer, mime: string) {
  const existing = (await prisma.$queryRawUnsafe(
    `SELECT id FROM media_assets WHERE "publicId" = $1 LIMIT 1`,
    publicId
  )) as Array<{ id: string }>
  if (existing[0]) {
    await prisma.$executeRawUnsafe(
      `UPDATE media_assets SET "mimeType" = $1, bytes = $2, data = $3, "sourceUrl" = $4 WHERE id = $5`,
      mime,
      buf.length,
      buf,
      sourceUrl,
      existing[0].id
    )
    return existing[0].id
  }
  const id = randomUUID()
  await prisma.$executeRawUnsafe(
    `INSERT INTO media_assets (id, "publicId", "mimeType", bytes, data, "sourceUrl", "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
    id,
    publicId,
    mime,
    buf.length,
    buf,
    sourceUrl
  )
  return id
}

async function runImport(publicBase: string) {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME || ''
  const key = process.env.CLOUDINARY_API_KEY || ''
  const secret = process.env.CLOUDINARY_API_SECRET || ''
  if (!cloud || !key || !secret) throw new Error('Faltan CLOUDINARY_* en el servidor')

  await ensureMediaAssetsSchema()
  const resources = await listAllCloudinary(cloud, key, secret)
  importStatus.listed = resources.length

  const sorted = [...resources].sort((a, b) => {
    const score = (p: string) =>
      p.startsWith('9citas/profiles') ? 0 : p.startsWith('caperucitas/') ? 1 : 2
    return score(a.public_id) - score(b.public_id)
  })

  let ok = 0
  let fail = 0
  const idByPublic = new Map<string, string>()
  const CONCURRENCY = 6
  let i = 0

  async function worker() {
    while (i < sorted.length) {
      const idx = i++
      const r = sorted[idx]
      try {
        const res = await fetch(r.secure_url)
        if (!res.ok) throw new Error(`dl ${res.status}`)
        const buf = Buffer.from(await res.arrayBuffer())
        const id = await upsertAsset(r.public_id, r.secure_url, buf, mimeFromFormat(r.format))
        idByPublic.set(r.public_id, id)
        ok++
        importStatus.ok = ok
        importStatus.fail = fail
      } catch (e) {
        fail++
        importStatus.fail = fail
        console.error('import fail', r.public_id, e)
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()))

  const photos = await prisma.photo.findMany()
  let mapped = 0
  for (const photo of photos) {
    if (!photo.url.includes('cloudinary.com') && photo.url.includes('/api/media/')) {
      mapped++
      continue
    }
    const pid = publicIdFromUrl(photo.url)
    if (!pid) continue
    let mediaId = idByPublic.get(pid)
    if (!mediaId) {
      const row = (await prisma.$queryRawUnsafe(
        `SELECT id FROM media_assets WHERE "publicId" = $1 LIMIT 1`,
        pid
      )) as Array<{ id: string }>
      mediaId = row[0]?.id
    }
    if (!mediaId) continue
    await prisma.photo.update({
      where: { id: photo.id },
      data: { url: `${publicBase}/api/media/${mediaId}` },
    })
    mapped++
  }
  importStatus.mappedPhotos = mapped
  importStatus.ok = ok
  importStatus.fail = fail
}

export const startCloudinaryImport = async (req: Request, res: Response) => {
  if (!authorize(req)) return res.status(401).json({ error: 'No autorizado' })
  if (importRunning) return res.status(409).json({ error: 'Importación ya en curso', status: importStatus })

  importRunning = true
  importStatus = { running: true, ok: 0, fail: 0 }
  const publicBase = getPublicBaseUrl(req)

  // Responder al momento; el trabajo sigue en background
  res.status(202).json({
    message: 'Importación Cloudinary iniciada en el servidor',
    statusUrl: '/api/media/import/status',
  })

  runImport(publicBase)
    .then(() => {
      importStatus.running = false
      importStatus.finishedAt = new Date().toISOString()
      console.log('✅ Cloudinary import finished', importStatus)
    })
    .catch((e) => {
      importStatus.running = false
      importStatus.error = e?.message || String(e)
      importStatus.finishedAt = new Date().toISOString()
      console.error('❌ Cloudinary import failed', e)
    })
    .finally(() => {
      importRunning = false
    })
}

export const cloudinaryImportStatus = async (req: Request, res: Response) => {
  if (!authorize(req)) return res.status(401).json({ error: 'No autorizado' })
  res.json(importStatus)
}
