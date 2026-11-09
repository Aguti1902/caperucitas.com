import fs from 'fs'
import { Response } from 'express'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'
import { tryDeleteLocalUpload } from '../config/local-upload'
import {
  deleteMediaByUrl,
  mediaPublicUrl,
  saveMediaBuffer,
} from '../services/media-asset.service'

// Subir foto → media_assets (Postgres) para que sobreviva redeploys
export const uploadPhoto = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ningún archivo' })
    }

    const { type } = req.body // 'cover' | 'public' | 'private'

    console.log('📸 === SUBIR FOTO (media_assets) ===')
    console.log('Tipo recibido:', type)
    console.log('Archivo:', req.file?.originalname, req.file?.filename)

    if (!['cover', 'public', 'private'].includes(type)) {
      console.error(`❌ Tipo inválido recibido: "${type}"`)
      if (req.file.path) try {
        fs.unlinkSync(req.file.path)
      } catch { /* ignore */ }
      return res.status(400).json({ error: 'Tipo de foto inválido' })
    }

    const [existingOfType, visiblePhotos] = await Promise.all([
      prisma.photo.findMany({
        where: { profileId: req.profileId!, type },
      }),
      prisma.photo.findMany({
        where: { profileId: req.profileId!, type: { in: ['cover', 'public'] } },
      }),
    ])

    const limits: Record<string, number> = { cover: 1, public: 6, private: 4 }

    const cleanupTemp = () => {
      if (req.file?.path) {
        try {
          fs.unlinkSync(req.file.path)
        } catch { /* ignore */ }
      }
    }

    if (type !== 'private' && visiblePhotos.length >= 7) {
      cleanupTemp()
      return res.status(400).json({
        error: 'Has alcanzado el límite de 7 fotos (1 portada + 6 adicionales)',
      })
    }

    if (existingOfType.length >= limits[type]) {
      cleanupTemp()
      return res.status(400).json({
        error: `Ya has alcanzado el límite de ${limits[type]} foto(s) de tipo ${type}`,
      })
    }

    if (type === 'cover' && existingOfType.length > 0) {
      const oldPhoto = existingOfType[0]
      await deleteMediaByUrl(oldPhoto.url)
      tryDeleteLocalUpload(oldPhoto.url)
      await prisma.photo.delete({ where: { id: oldPhoto.id } })
    }

    const buffer = req.file.buffer || fs.readFileSync(req.file.path)
    const saved = await saveMediaBuffer({
      buffer,
      mimeType: req.file.mimetype || 'image/jpeg',
      publicId: null,
      sourceUrl: null,
    })
    cleanupTemp()

    const fileUrl = mediaPublicUrl(req, saved.id)

    const photo = await prisma.photo.create({
      data: {
        profileId: req.profileId!,
        url: fileUrl,
        type,
      },
    })

    console.log(`✅ Foto guardada:`, photo.id, fileUrl)

    res.status(201).json({
      message: 'Foto subida exitosamente',
      photo,
    })
  } catch (error: any) {
    console.error('Error al subir foto:', error)
    const msg = error?.message?.includes('cloud_name')
      ? 'Error de almacenamiento de imágenes. Inténtalo de nuevo.'
      : 'Error al subir foto'
    res.status(500).json({ error: msg })
  }
}

export const deletePhoto = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const photo = await prisma.photo.findUnique({
      where: { id },
    })

    if (!photo) {
      return res.status(404).json({ error: 'Foto no encontrada' })
    }

    if (photo.profileId !== req.profileId) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta foto' })
    }

    await deleteMediaByUrl(photo.url)
    tryDeleteLocalUpload(photo.url)
    await prisma.photo.delete({ where: { id } })

    res.json({ message: 'Foto eliminada exitosamente' })
  } catch (error) {
    console.error('Error al eliminar foto:', error)
    res.status(500).json({ error: 'Error al eliminar foto' })
  }
}

export const getProfilePhotos = async (req: AuthRequest, res: Response) => {
  try {
    const { profileId } = req.params
    const { includePrivate } = req.query

    const whereClause: any = {
      profileId,
    }

    if (!includePrivate || profileId !== req.profileId) {
      whereClause.type = {
        in: ['cover', 'public'],
      }
    }

    const photos = await prisma.photo.findMany({
      where: whereClause,
      orderBy: [{ type: 'asc' }, { createdAt: 'asc' }],
    })

    res.json({ photos })
  } catch (error) {
    console.error('Error al obtener fotos:', error)
    res.status(500).json({ error: 'Error al obtener fotos' })
  }
}
