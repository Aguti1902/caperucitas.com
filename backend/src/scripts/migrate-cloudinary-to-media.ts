/**
 * Descarga TODO Cloudinary → media_assets (Postgres) y remapea photos.url
 *
 * DATABASE_URL=... CLOUDINARY_*=... npx tsx src/scripts/migrate-cloudinary-to-media.ts
 */
import { createHash, randomUUID } from 'crypto'
import { PrismaClient } from '@prisma/client'

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dmrdydsjv'
const API_KEY = process.env.CLOUDINARY_API_KEY || '957942125576369'
const API_SECRET = process.env.CLOUDINARY_API_SECRET || 'kJWwXcg0x0MTfNq3ux4nXE_RMVw'
const PUBLIC_BASE =
  (process.env.PUBLIC_BASE_URL || 'https://caperucitascom-production.up.railway.app').replace(
    /\/$/,
    ''
  )

const prisma = new PrismaClient()
const auth = Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64')

type CloudRes = {
  public_id: string
  secure_url: string
  bytes?: number
  format?: string
  resource_type?: string
}

async function ensureSchema() {
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
}

async function listAll(): Promise<CloudRes[]> {
  const out: CloudRes[] = []
  let cursor: string | undefined
  do {
    const u = new URL(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/image`)
    u.searchParams.set('max_results', '500')
    if (cursor) u.searchParams.set('next_cursor', cursor)
    const res = await fetch(u, { headers: { Authorization: `Basic ${auth}` } })
    if (!res.ok) throw new Error(`List failed: ${res.status} ${await res.text()}`)
    const data = (await res.json()) as { resources: CloudRes[]; next_cursor?: string }
    out.push(...(data.resources || []))
    cursor = data.next_cursor
    console.log(`Listados: ${out.length}`)
  } while (cursor)
  return out
}

function mimeFromFormat(fmt?: string) {
  const f = (fmt || 'jpg').toLowerCase()
  if (f === 'png') return 'image/png'
  if (f === 'webp') return 'image/webp'
  if (f === 'gif') return 'image/gif'
  return 'image/jpeg'
}

function publicIdFromUrl(url: string): string | null {
  // https://res.cloudinary.com/xxx/image/upload/v123/9citas/profiles/abc.jpg
  const m = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.(jpe?g|png|webp|gif)(?:\?|$)/i)
  if (m) return m[1]
  const m2 = url.match(/\/upload\/(?:v\d+\/)?([^.?]+)/)
  return m2 ? m2[1] : null
}

async function download(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download ${res.status} ${url}`)
  return Buffer.from(await res.arrayBuffer())
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

async function main() {
  console.log('Cloud:', CLOUD_NAME)
  console.log('Public base:', PUBLIC_BASE)
  await ensureSchema()

  const resources = await listAll()
  console.log(`Total Cloudinary: ${resources.length}`)

  // Prefer profile + chat folders first
  const sorted = [...resources].sort((a, b) => {
    const score = (p: string) =>
      p.startsWith('9citas/profiles') ? 0 : p.startsWith('caperucitas/') ? 1 : 2
    return score(a.public_id) - score(b.public_id)
  })

  let ok = 0
  let fail = 0
  const idByPublic = new Map<string, string>()

  // concurrency limited
  const CONCURRENCY = 8
  let i = 0
  async function worker() {
    while (i < sorted.length) {
      const idx = i++
      const r = sorted[idx]
      try {
        // Skip tiny sample placeholders if desired? User asked for EVERYTHING — keep all.
        const buf = await download(r.secure_url)
        const mime = mimeFromFormat(r.format)
        const id = await upsertAsset(r.public_id, r.secure_url, buf, mime)
        idByPublic.set(r.public_id, id)
        ok++
        if (ok % 25 === 0 || idx < 5) {
          console.log(`✓ ${ok}/${sorted.length} ${r.public_id} (${buf.length}b)`)
        }
      } catch (e: any) {
        fail++
        console.error(`✗ ${r.public_id}:`, e.message || e)
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()))
  console.log(`Descarga terminada. ok=${ok} fail=${fail}`)

  // Remap photos table
  const photos = await prisma.photo.findMany()
  let mapped = 0
  let unmapped = 0
  for (const photo of photos) {
    const pid = publicIdFromUrl(photo.url)
    if (!pid) {
      unmapped++
      continue
    }
    let mediaId = idByPublic.get(pid)
    if (!mediaId) {
      const row = (await prisma.$queryRawUnsafe(
        `SELECT id FROM media_assets WHERE "publicId" = $1 LIMIT 1`,
        pid
      )) as Array<{ id: string }>
      mediaId = row[0]?.id
    }
    if (!mediaId) {
      console.warn(`Sin media para photo ${photo.id} pid=${pid}`)
      unmapped++
      continue
    }
    const newUrl = `${PUBLIC_BASE}/api/media/${mediaId}`
    if (photo.url !== newUrl) {
      await prisma.photo.update({ where: { id: photo.id }, data: { url: newUrl } })
    }
    mapped++
  }
  console.log(`Photos remapeadas: ${mapped}, sin mapear: ${unmapped}`)

  // Remap chat image urls if any
  for (const table of ['global_chat_messages', 'global_chat_dms'] as const) {
    try {
      const rows = (await prisma.$queryRawUnsafe(
        `SELECT id, "imageUrl" FROM ${table} WHERE "imageUrl" LIKE '%cloudinary%'`
      )) as Array<{ id: string; imageUrl: string }>
      for (const row of rows) {
        const pid = publicIdFromUrl(row.imageUrl)
        if (!pid) continue
        const mediaId =
          idByPublic.get(pid) ||
          (
            (await prisma.$queryRawUnsafe(
              `SELECT id FROM media_assets WHERE "publicId" = $1 LIMIT 1`,
              pid
            )) as Array<{ id: string }>
          )[0]?.id
        if (!mediaId) continue
        await prisma.$executeRawUnsafe(
          `UPDATE ${table} SET "imageUrl" = $1 WHERE id = $2`,
          `${PUBLIC_BASE}/api/media/${mediaId}`,
          row.id
        )
      }
      console.log(`Chat remap ${table}: ${rows.length} candidatas`)
    } catch (e: any) {
      console.log(`Skip ${table}:`, e.message)
    }
  }

  const count = (await prisma.$queryRawUnsafe(
    `SELECT COUNT(*)::int AS c, COALESCE(SUM(bytes),0)::bigint AS b FROM media_assets`
  )) as Array<{ c: number; b: bigint }>
  console.log('media_assets:', count[0])
  console.log('hash check sample', createHash('md5').update(String(count[0]?.c)).digest('hex'))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
