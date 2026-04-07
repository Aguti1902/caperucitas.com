import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';


// Bloquear usuario
export const blockProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { profileId } = req.params;

    if (profileId === req.profileId) {
      return res.status(400).json({ error: 'No puedes bloquearte a ti mismo' });
    }

    const block = await prisma.block.upsert({
      where: {
        blockerProfileId_blockedProfileId: {
          blockerProfileId: req.profileId!,
          blockedProfileId: profileId,
        },
      },
      update: {},
      create: {
        blockerProfileId: req.profileId!,
        blockedProfileId: profileId,
      },
    });

    res.status(201).json({
      message: 'Usuario bloqueado',
      block,
    });
  } catch (error) {
    console.error('Error al bloquear:', error);
    res.status(500).json({ error: 'Error al bloquear usuario' });
  }
};

// Desbloquear usuario
export const unblockProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { profileId } = req.params;

    await prisma.block.deleteMany({
      where: {
        blockerProfileId: req.profileId!,
        blockedProfileId: profileId,
      },
    });

    res.json({ message: 'Usuario desbloqueado' });
  } catch (error) {
    console.error('Error al desbloquear:', error);
    res.status(500).json({ error: 'Error al desbloquear usuario' });
  }
};

// Obtener usuarios bloqueados
export const getBlockedProfiles = async (req: AuthRequest, res: Response) => {
  try {
    const blocks = await prisma.block.findMany({
      where: { blockerProfileId: req.profileId! },
      include: {
        blockedProfile: {
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

    res.json({ blocks });
  } catch (error) {
    console.error('Error al obtener bloqueados:', error);
    res.status(500).json({ error: 'Error al obtener bloqueados' });
  }
};

