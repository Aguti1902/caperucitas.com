import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import cloudinary from '../config/cloudinary';


// Subir foto
export const uploadPhoto = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ningún archivo' });
    }

    const { type } = req.body; // 'cover' | 'public' | 'private'
    
    console.log('📸 === SUBIR FOTO ===');
    console.log('Tipo recibido:', type);
    console.log('Body completo:', req.body);
    console.log('Archivo:', req.file?.originalname);

    if (!['cover', 'public', 'private'].includes(type)) {
      console.error(`❌ Tipo inválido recibido: "${type}"`);
      return res.status(400).json({ error: 'Tipo de foto inválido' });
    }

    const [existingOfType, visiblePhotos] = await Promise.all([
      prisma.photo.findMany({
        where: { profileId: req.profileId!, type },
      }),
      prisma.photo.findMany({
        where: { profileId: req.profileId!, type: { in: ['cover', 'public'] } },
      }),
    ]);

    console.log(`Fotos existentes de tipo "${type}":`, existingOfType.length);
    console.log(`Fotos visibles (cover+public):`, visiblePhotos.length);

    // Límites: 1 cover, 6 public, 4 private (7 visibles + 4 privadas)
    const limits: Record<string, number> = { cover: 1, public: 6, private: 4 };

    if (type !== 'private' && visiblePhotos.length >= 7) {
      const publicId = (req.file as any).filename;
      if (publicId) await cloudinary.uploader.destroy(publicId);
      return res.status(400).json({
        error: 'Has alcanzado el límite de 7 fotos (1 portada + 6 adicionales)',
      });
    }

    if (existingOfType.length >= limits[type]) {
      // Eliminar de Cloudinary
      const publicId = (req.file as any).filename;
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
      return res.status(400).json({
        error: `Ya has alcanzado el límite de ${limits[type]} foto(s) de tipo ${type}`,
      });
    }

    // Si es cover y ya existe una, eliminar la anterior de Cloudinary
    if (type === 'cover' && existingOfType.length > 0) {
      const oldPhoto = existingOfType[0];
      // Extraer public_id de la URL de Cloudinary
      const urlParts = oldPhoto.url.split('/');
      const publicIdWithExt = urlParts[urlParts.length - 1];
      const publicId = `9citas/profiles/${publicIdWithExt.split('.')[0]}`;
      await cloudinary.uploader.destroy(publicId);
      await prisma.photo.delete({ where: { id: oldPhoto.id } });
    }

    // Guardar en base de datos (Cloudinary ya subió la foto)
    const photo = await prisma.photo.create({
      data: {
        profileId: req.profileId!,
        url: (req.file as any).path, // URL de Cloudinary
        type,
      },
    });

    console.log(`✅ Foto guardada correctamente como tipo "${type}":`, photo.id);

    res.status(201).json({
      message: 'Foto subida exitosamente',
      photo,
    });
  } catch (error) {
    console.error('Error al subir foto:', error);
    res.status(500).json({ error: 'Error al subir foto' });
  }
};

// Eliminar foto
export const deletePhoto = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const photo = await prisma.photo.findUnique({
      where: { id },
    });

    if (!photo) {
      return res.status(404).json({ error: 'Foto no encontrada' });
    }

    // Verificar que la foto pertenece al usuario
    if (photo.profileId !== req.profileId) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta foto' });
    }

    // Eliminar de Cloudinary
    const urlParts = photo.url.split('/');
    const publicIdWithExt = urlParts[urlParts.length - 1];
    const publicId = `9citas/profiles/${publicIdWithExt.split('.')[0]}`;
    await cloudinary.uploader.destroy(publicId);

    // Eliminar de base de datos
    await prisma.photo.delete({ where: { id } });

    res.json({ message: 'Foto eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar foto:', error);
    res.status(500).json({ error: 'Error al eliminar foto' });
  }
};

// Obtener fotos del perfil
export const getProfilePhotos = async (req: AuthRequest, res: Response) => {
  try {
    const { profileId } = req.params;
    const { includePrivate } = req.query;

    const whereClause: any = {
      profileId,
    };

    // Solo incluir fotos privadas si es el propio usuario
    if (!includePrivate || profileId !== req.profileId) {
      whereClause.type = {
        in: ['cover', 'public'],
      };
    }

    const photos = await prisma.photo.findMany({
      where: whereClause,
      orderBy: [
        { type: 'asc' }, // cover primero
        { createdAt: 'asc' },
      ],
    });

    res.json({ photos });
  } catch (error) {
    console.error('Error al obtener fotos:', error);
    res.status(500).json({ error: 'Error al obtener fotos' });
  }
};

