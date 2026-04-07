import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';


// Agregar a favoritos
export const addFavorite = async (req: AuthRequest, res: Response) => {
  try {
    const { profileId } = req.params;

    if (profileId === req.profileId) {
      return res.status(400).json({ error: 'No puedes agregarte a ti mismo a favoritos' });
    }

    const favorite = await prisma.favorite.upsert({
      where: {
        ownerProfileId_targetProfileId: {
          ownerProfileId: req.profileId!,
          targetProfileId: profileId,
        },
      },
      update: {},
      create: {
        ownerProfileId: req.profileId!,
        targetProfileId: profileId,
      },
    });

    res.status(201).json({
      message: 'Agregado a favoritos',
      favorite,
    });
  } catch (error) {
    console.error('Error al agregar favorito:', error);
    res.status(500).json({ error: 'Error al agregar favorito' });
  }
};

// Quitar de favoritos
export const removeFavorite = async (req: AuthRequest, res: Response) => {
  try {
    const { profileId } = req.params;

    await prisma.favorite.deleteMany({
      where: {
        ownerProfileId: req.profileId!,
        targetProfileId: profileId,
      },
    });

    res.json({ message: 'Eliminado de favoritos' });
  } catch (error) {
    console.error('Error al quitar favorito:', error);
    res.status(500).json({ error: 'Error al quitar favorito' });
  }
};

// Obtener favoritos - solo perfiles con conversación activa (mensajes)
export const getFavorites = async (req: AuthRequest, res: Response) => {
  try {
    // Obtener todos los favoritos del usuario
    const allFavorites = await prisma.favorite.findMany({
      where: { ownerProfileId: req.profileId! },
      include: {
        targetProfile: {
          include: {
            photos: {
              where: { type: 'cover' },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filtrar solo los que tienen mensajes (conversación activa)
    const favoritesWithMessages = await Promise.all(
      allFavorites.map(async (favorite) => {
        // Verificar si hay mensajes entre el usuario y este perfil
        const messageCount = await prisma.message.count({
          where: {
            OR: [
              {
                fromProfileId: req.profileId!,
                toProfileId: favorite.targetProfileId,
              },
              {
                fromProfileId: favorite.targetProfileId,
                toProfileId: req.profileId!,
              },
            ],
          },
        });

        // Solo incluir si hay al menos 1 mensaje (conversación activa)
        if (messageCount > 0) {
          return favorite;
        }
        return null;
      })
    );

    // Filtrar los nulls
    const favorites = favoritesWithMessages.filter((f) => f !== null);

    res.json({ favorites });
  } catch (error) {
    console.error('Error al obtener favoritos:', error);
    res.status(500).json({ error: 'Error al obtener favoritos' });
  }
};

