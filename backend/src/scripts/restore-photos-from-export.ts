/**
 * Restaurar fotos desde un export local de Cloudinary (sin pagar el plan).
 *
 * Cómo usarlo:
 * 1) Pide a Cloudinary (soporte) un export/ZIP de la Media Library
 *    o descarga manual de la carpeta 9citas/profiles.
 * 2) Descomprime en una carpeta, p.ej. ./cloudinary-export
 * 3) DATABASE_URL=... npx tsx src/scripts/restore-photos-from-export.ts ./cloudinary-export
 *
 * El script busca ficheros cuyo nombre coincida con el public_id
 * de cada URL en la tabla photos, los copia a uploads/profiles
 * y actualiza la URL a la del backend Railway.
 */
import * as fs from 'fs'
import * as path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function publicIdFromCloudinaryUrl(url: string): string | null {
  // .../upload/v123/9citas/profiles/abcdef.jpg  → abcdef
  // .../upload/9citas/profiles/abcdef.jpg
  const m = url.match(/\/(?:v\d+\/)?(?:[\w-]+\/)*([^.\/]+)\.(jpe?g|png|webp|gif)(?:\?|$)/i)
  return m ? m[1] : null
}

function walkFiles(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    const st = fs.statSync(full)
    if (st.isDirectory()) walkFiles(full, out)
    else if (/\.(jpe?g|png|webp|gif)$/i.test(name)) out.push(full)
  }
  return out
}

async function main() {
  const exportDir = process.argv[2] || path.join(process.cwd(), 'cloudinary-export')
  const publicBase =
    process.env.PUBLIC_BASE_URL ||
    process.env.BACKEND_PUBLIC_URL ||
    'https://caperucitascom-production.up.railway.app'

  const destDir = path.join(process.cwd(), 'uploads', 'profiles')
  fs.mkdirSync(destDir, { recursive: true })

  const files = walkFiles(exportDir)
  if (files.length === 0) {
    console.error(`No hay imágenes en ${exportDir}`)
    process.exit(1)
  }

  // index by basename without extension
  const byStem = new Map<string, string>()
  for (const f of files) {
    const stem = path.basename(f).replace(/\.[^.]+$/, '').toLowerCase()
    byStem.set(stem, f)
  }
  console.log(`Ficheros en export: ${files.length}`)

  const photos = await prisma.photo.findMany({
    where: { url: { contains: 'res.cloudinary.com' } },
  })
  console.log(`Fotos Cloudinary en DB: ${photos.length}`)

  let ok = 0
  let miss = 0
  for (const photo of photos) {
    const pid = publicIdFromCloudinaryUrl(photo.url)
    if (!pid) {
      miss++
      continue
    }
    const src = byStem.get(pid.toLowerCase())
    if (!src) {
      console.warn(`✗ Sin fichero para ${pid}`)
      miss++
      continue
    }
    const ext = path.extname(src).toLowerCase() || '.jpg'
    const filename = `${pid}${ext}`
    const dest = path.join(destDir, filename)
    fs.copyFileSync(src, dest)
    const newUrl = `${publicBase.replace(/\/$/, '')}/uploads/profiles/${filename}`
    await prisma.photo.update({ where: { id: photo.id }, data: { url: newUrl } })
    ok++
    console.log(`✓ ${photo.id} → ${newUrl}`)
  }

  console.log(`\nRestauradas: ${ok} | Sin coincidencia: ${miss}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
