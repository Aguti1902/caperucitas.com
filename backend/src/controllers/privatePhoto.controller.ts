import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';


// Solicitar acceso a fotos privadas
export const requestPrivatePhotoAccess = async (req: AuthRequest, res: Response) => {
  try {
    const { profileId } = req.params;

    // Verificar que el perfil existe
    const targetProfile = await prisma.profile.findUnique({
      where: { id: profileId },
    });

    if (!targetProfile) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    // No puedes solicitar acceso a tus propias fotos
    if (profileId === req.profileId) {
      return res.status(400).json({ error: 'No puedes solicitar acceso a tus propias fotos' });
    }

    // Verificar si ya existe una solicitud
    const existingRequest = await prisma.privatePhotoAccess.findUnique({
      where: {
        ownerProfileId_viewerProfileId: {
          ownerProfileId: profileId,
          viewerProfileId: req.profileId!,
        },
      },
    });

    if (existingRequest) {
      return res.status(400).json({ 
        error: 'Ya has solicitado acceso a estas fotos',
        status: existingRequest.status,
      });
    }

    // Crear solicitud
    const request = await prisma.privatePhotoAccess.create({
      data: {
        ownerProfileId: profileId,
        viewerProfileId: req.profileId!,
        status: 'pending',
      },
      include: {
        viewerProfile: {
          include: {
            photos: {
              where: { type: 'cover' },
              take: 1,
            },
          },
        },
      },
    });

    res.status(201).json({
      message: 'Solicitud enviada',
      request,
    });
  } catch (error) {
    console.error('Error al solicitar acceso:', error);
    res.status(500).json({ error: 'Error al solicitar acceso' });
  }
};

// Obtener solicitudes recibidas
export const getAccessRequests = async (req: AuthRequest, res: Response) => {
  try {
    const requests = await prisma.privatePhotoAccess.findMany({
      where: {
        ownerProfileId: req.profileId!,
        status: 'pending',
      },
      include: {
        viewerProfile: {
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

    res.json({ requests });
  } catch (error) {
    console.error('Error al obtener solicitudes:', error);
    res.status(500).json({ error: 'Error al obtener solicitudes' });
  }
};

// Responder a una solicitud
export const respondToAccessRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { requestId, action } = req.params;

    if (!['grant', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Acción inválida' });
    }

    // Verificar que la solicitud existe y te pertenece
    const request = await prisma.privatePhotoAccess.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    if (request.ownerProfileId !== req.profileId) {
      return res.status(403).json({ error: 'No tienes permiso para responder esta solicitud' });
    }

    // Actualizar estado
    const updatedRequest = await prisma.privatePhotoAccess.update({
      where: { id: requestId },
      data: {
        status: action === 'grant' ? 'granted' : 'rejected',
      },
    });

    res.json({
      message: action === 'grant' ? 'Acceso concedido' : 'Acceso rechazado',
      request: updatedRequest,
    });
  } catch (error) {
    console.error('Error al responder solicitud:', error);
    res.status(500).json({ error: 'Error al responder solicitud' });
  }
};

// Verificar estado de acceso
export const checkAccessStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { profileId } = req.params;

    const access = await prisma.privatePhotoAccess.findUnique({
      where: {
        ownerProfileId_viewerProfileId: {
          ownerProfileId: profileId,
          viewerProfileId: req.profileId!,
        },
      },
    });

    res.json({
      hasAccess: access?.status === 'granted',
      status: access?.status || 'none',
    });
  } catch (error) {
    console.error('Error al verificar acceso:', error);
    res.status(500).json({ error: 'Error al verificar acceso' });
  }
};

