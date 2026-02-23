import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { normalizeProfilePhotos } from '../utils/photo.utils';

const prisma = new PrismaClient();

interface AuthenticatedSocket extends Socket {
  userId?: string;
  profileId?: string;
}

export const setupSocketHandlers = (io: Server) => {
  // Middleware de autenticación para Socket.IO
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Token requerido'));
      }

      const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
      if (!secret) {
        console.error('❌ JWT_ACCESS_SECRET o JWT_SECRET no está configurado');
        return next(new Error('Configuración del servidor incorrecta'));
      }

      const decoded = jwt.verify(token, secret) as {
        userId: string;
      };

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { profile: true },
      });

      if (!user) {
        return next(new Error('Usuario no encontrado'));
      }

      socket.userId = user.id;
      socket.profileId = user.profile?.id;

      next();
    } catch (error) {
      next(new Error('Token inválido'));
    }
  });

  // Handlers de conexión
  io.on('connection', async (socket: AuthenticatedSocket) => {
    console.log(`Usuario conectado: ${socket.userId}`);

    // Marcar como online
    if (socket.profileId) {
      try {
        await prisma.profile.update({
          where: { id: socket.profileId },
          data: {
            isOnline: true,
            lastSeenAt: new Date(),
          },
        });
      } catch (error) {
        // Si el perfil no existe, solo logear el error sin crashear
        console.warn(`⚠️ No se pudo actualizar estado online del perfil ${socket.profileId}:`, error.code);
      }

      // Unirse a sala personal
      socket.join(`profile:${socket.profileId}`);
    }

    // Handler: Enviar mensaje
    socket.on('send_message', async (data) => {
      try {
        const { toProfileId, text, photoId, location } = data;

        if (!socket.profileId) return;

        const message = await prisma.message.create({
          data: {
            fromProfileId: socket.profileId,
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

        // Normalizar fotos del mensaje antes de emitir
        const normalizedMessage = {
          ...message,
          fromProfile: message.fromProfile ? normalizeProfilePhotos(message.fromProfile) : message.fromProfile,
        };

        // Enviar mensaje al destinatario
        io.to(`profile:${toProfileId}`).emit('new_message', normalizedMessage);

        // Confirmar al remitente
        socket.emit('message_sent', normalizedMessage);
      } catch (error) {
        console.error('Error al enviar mensaje:', error);
        socket.emit('error', { message: 'Error al enviar mensaje' });
      }
    });

    // Handler: Usuario escribiendo
    socket.on('typing', (data) => {
      const { toProfileId } = data;
      io.to(`profile:${toProfileId}`).emit('user_typing', {
        fromProfileId: socket.profileId,
      });
    });

    // Handler: Usuario dejó de escribir
    socket.on('stop_typing', (data) => {
      const { toProfileId } = data;
      io.to(`profile:${toProfileId}`).emit('user_stop_typing', {
        fromProfileId: socket.profileId,
      });
    });

    // Handler: Marcar mensajes como leídos
    socket.on('mark_as_read', async (data) => {
      try {
        const { fromProfileId } = data;

        if (!socket.profileId) return;

        await prisma.message.updateMany({
          where: {
            fromProfileId,
            toProfileId: socket.profileId,
            isRead: false,
          },
          data: {
            isRead: true,
          },
        });

        // Notificar al remitente
        io.to(`profile:${fromProfileId}`).emit('messages_read', {
          byProfileId: socket.profileId,
        });
      } catch (error) {
        console.error('Error al marcar mensajes:', error);
      }
    });

    // Handler: Desconexión
    socket.on('disconnect', async () => {
      console.log(`Usuario desconectado: ${socket.userId}`);

      // Marcar como offline
      if (socket.profileId) {
        try {
          await prisma.profile.update({
            where: { id: socket.profileId },
            data: {
              isOnline: false,
              lastSeenAt: new Date(),
            },
          });
        } catch (error) {
          // Si el perfil no existe, solo logear el error sin crashear
          console.warn(`⚠️ No se pudo actualizar estado del perfil ${socket.profileId}:`, error.code);
        }
      }
    });
  });
};

