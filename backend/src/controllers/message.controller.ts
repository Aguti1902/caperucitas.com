import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { generateChatbotResponse } from '../services/chatbot.service';
import { normalizeProfilePhotos } from '../utils/photo.utils';
import { getIO } from '../services/socket.io';


// Enviar mensaje
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { toProfileId, text, photoId, location } = req.body;

    if (!toProfileId) {
      return res.status(400).json({ error: 'Destinatario requerido' });
    }

    if (!text && !photoId && !location) {
      return res.status(400).json({ error: 'El mensaje debe tener contenido' });
    }

    // Verificar que el destinatario existe
    const toProfile = await prisma.profile.findUnique({
      where: { id: toProfileId },
    });

    if (!toProfile) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    // Verificar misma orientación
    const myProfile = await prisma.profile.findUnique({
      where: { id: req.profileId },
      include: {
        user: {
          include: {
            subscription: true,
          },
        },
      },
    });

    if (toProfile.orientation !== myProfile?.orientation) {
      return res.status(403).json({ error: 'No puedes enviar mensajes a este perfil' });
    }

    // Verificar que no esté bloqueado
    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerProfileId: req.profileId!, blockedProfileId: toProfileId },
          { blockerProfileId: toProfileId, blockedProfileId: req.profileId! },
        ],
      },
    });

    if (block) {
      return res.status(403).json({ error: 'No puedes enviar mensajes a este perfil' });
    }

    // NO HAY RESTRICCIONES: Cualquier usuario puede chatear con cualquiera
    // Sin importar ciudad, match o suscripción

    // Crear mensaje
    const message = await prisma.message.create({
      data: {
        fromProfileId: req.profileId!,
        toProfileId,
        text: text || null,
        photoId: photoId || null,
        location: location || null,
      },
      include: {
        fromProfile: {
          include: {
            photos: {
              where: { type: 'cover' },
              take: 1,
            },
          },
        },
        photo: true,
      },
    });

    // Emitir evento de Socket.IO para enviar mensaje en tiempo real
    const io = getIO();
    io.to(`profile:${toProfileId}`).emit('new_message', message);

    // Si el destinatario tiene personalidad (perfil automático), generar respuesta automática
    if (toProfile.personality && text) {
      setTimeout(async () => {
        try {
          // Obtener historial de conversación
          const previousMessages = await prisma.message.findMany({
            where: {
              OR: [
                { fromProfileId: req.profileId!, toProfileId },
                { fromProfileId: toProfileId, toProfileId: req.profileId! },
              ],
            },
            orderBy: { createdAt: 'asc' },
            take: 10, // Últimos 10 mensajes
          });

          const conversationHistory = previousMessages.map(msg => ({
            role: (msg.fromProfileId === req.profileId! ? 'user' : 'assistant') as 'user' | 'assistant',
            content: msg.text || '',
          }));

          // Generar respuesta con IA
          const botResponse = await generateChatbotResponse({
            profileName: toProfile.title,
            profileAge: toProfile.age,
            profilePersonality: toProfile.personality || 'divertida',
            profileBio: toProfile.aboutMe,
            userMessage: text,
            conversationHistory,
          });

          // Crear mensaje de respuesta
          await prisma.message.create({
            data: {
              fromProfileId: toProfileId,
              toProfileId: req.profileId!,
              text: botResponse,
            },
          });
        } catch (error) {
          console.error('Error al generar respuesta del bot:', error);
        }
      }, Math.floor(Math.random() * 15000) + 5000); // Responder entre 5-20 segundos
    }

    res.status(201).json({
      message: 'Mensaje enviado',
      data: message,
    });
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    res.status(500).json({ error: 'Error al enviar mensaje' });
  }
};

// Obtener conversaciones
export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    // Obtener últimos mensajes de cada conversación
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { fromProfileId: req.profileId! },
          { toProfileId: req.profileId! },
        ],
      },
      include: {
        fromProfile: {
          include: {
            photos: {
              where: { type: 'cover' },
              take: 1,
            },
          },
        },
        toProfile: {
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

    // Agrupar por conversación
    const conversationsMap = new Map();

    messages.forEach((message) => {
      const otherProfileId =
        message.fromProfileId === req.profileId
          ? message.toProfileId
          : message.fromProfileId;

      if (!conversationsMap.has(otherProfileId)) {
        const otherProfile =
          message.fromProfileId === req.profileId
            ? message.toProfile
            : message.fromProfile;

        // EXCLUIR perfiles falsos de las conversaciones
        if (otherProfile && !otherProfile.isFake) {
          conversationsMap.set(otherProfileId, {
            profile: otherProfile,
            lastMessage: message,
            unreadCount: 0,
          });
        }
      }
    });

    // Contar mensajes no leídos
    for (const [profileId, conversation] of conversationsMap.entries()) {
      const unreadCount = await prisma.message.count({
        where: {
          fromProfileId: profileId,
          toProfileId: req.profileId!,
          isRead: false,
        },
      });
      conversation.unreadCount = unreadCount;
    }

    const conversations = Array.from(conversationsMap.values());

    // Normalizar URLs de fotos antes de enviar
    const normalizedConversations = conversations.map(conv => ({
      ...conv,
      profile: conv.profile ? normalizeProfilePhotos(conv.profile) : conv.profile,
    }));

    res.json({ conversations: normalizedConversations });
  } catch (error) {
    console.error('Error al obtener conversaciones:', error);
    res.status(500).json({ error: 'Error al obtener conversaciones' });
  }
};

// Obtener mensajes con un usuario
export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { profileId } = req.params;
    const { limit = 50, before } = req.query;

    const whereClause: any = {
      OR: [
        { fromProfileId: req.profileId!, toProfileId: profileId },
        { fromProfileId: profileId, toProfileId: req.profileId! },
      ],
    };

    if (before) {
      whereClause.createdAt = { lt: new Date(before as string) };
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        fromProfile: {
          include: {
            photos: {
              where: { type: 'cover' },
              take: 1,
            },
          },
        },
        photo: true,
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
    });

    res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
};

// Marcar mensajes como leídos
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { profileId } = req.params;

    await prisma.message.updateMany({
      where: {
        fromProfileId: profileId,
        toProfileId: req.profileId!,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    res.json({ message: 'Mensajes marcados como leídos' });
  } catch (error) {
    console.error('Error al marcar mensajes:', error);
    res.status(500).json({ error: 'Error al marcar mensajes' });
  }
};

// Eliminar conversación
export const deleteConversation = async (req: AuthRequest, res: Response) => {
  try {
    const { profileId } = req.params;

    // Eliminar todos los mensajes de la conversación
    await prisma.message.deleteMany({
      where: {
        OR: [
          { fromProfileId: req.profileId!, toProfileId: profileId },
          { fromProfileId: profileId, toProfileId: req.profileId! },
        ],
      },
    });

    res.json({ message: 'Conversación eliminada' });
  } catch (error) {
    console.error('Error al eliminar conversación:', error);
    res.status(500).json({ error: 'Error al eliminar conversación' });
  }
};

