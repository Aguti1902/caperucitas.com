import fs from 'fs'
import path from 'path'
import multer from 'multer'
import type { Request } from 'express'

/** URL pública del backend (sin /api), p.ej. https://caperucitascom-production.up.railway.app */
export function getPublicBaseUrl(req?: Request): string {
  const fromEnv =
    process.env.PUBLIC_BASE_URL ||
    process.env.BACKEND_PUBLIC_URL ||
    (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : '')
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  if (req) {
    const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https'
    const host = (req.headers['x-forwarded-host'] as string) || req.get('host')
    if (host) return `${proto}://${host}`.replace(/\/$/, '')
  }
  return 'https://caperucitascom-production.up.railway.app'
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function makeDiskStorage(subdir: string) {
  const uploadDir = path.join(process.cwd(), 'uploads', subdir)
  ensureDir(uploadDir)
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg'
      const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg'
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExt}`)
    },
  })
}

function imageFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (file.mimetype.startsWith('image/')) cb(null, true)
  else cb(new Error('Solo se permiten imágenes'))
}

/** Fotos de perfil — sustituye Cloudinary (cuenta deshabilitada) */
export const profileImageUpload = multer({
  storage: makeDiskStorage('profiles'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
})

/** Fotos del chat global */
export const chatImageUpload = multer({
  storage: makeDiskStorage('chat'),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: imageFilter,
})

export function localFilePublicUrl(req: Request, subdir: string, filename: string): string {
  return `${getPublicBaseUrl(req)}/uploads/${subdir}/${filename}`
}

export function tryDeleteLocalUpload(url: string | null | undefined) {
  if (!url) return
  try {
    // Solo borrar ficheros nuestros bajo /uploads/
    const marker = '/uploads/'
    const idx = url.indexOf(marker)
    if (idx === -1) return
    const rel = url.slice(idx + marker.length).split('?')[0]
    if (!rel || rel.includes('..')) return
    const full = path.join(process.cwd(), 'uploads', rel)
    if (fs.existsSync(full)) fs.unlinkSync(full)
  } catch {
    /* ignore */
  }
}
