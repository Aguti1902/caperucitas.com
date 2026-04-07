import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { getIO } from '../services/socket.io';
import { normalizeProfilePhotos } from '../utils/photo.utils';


// Dar like
export const likeProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { profileId } = req.params;

    if (profileId === req.profileId) {
      return res.status(400).json({ error: 'No puedes darte like a ti mismo' });
    }

    // Verificar que el perfil existe
    const targetProfile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: {
        photos: {
          where: { type: 'cover' },
          take: 1,
        },
      },
    });

    if (!targetProfile) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    // Verificar misma orientación
    const myProfile = await prisma.profile.findUnique({
      where: { id: req.profileId },
    });

    if (targetProfile.orientation !== myProfile?.orientation) {
      return res.status(403).json({ error: 'No puedes dar like a este perfil' });
    }

    // Verificar que no esté bloqueado
    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerProfileId: req.profileId!, blockedProfileId: profileId },
          { blockerProfileId: profileId, blockedProfileId: req.profileId! },
        ],
      },
    });

    if (block) {
      return res.status(403).json({ error: 'No puedes dar like a este perfil' });
    }

    // Verificar si el like ya existe
    const existingLike = await prisma.like.findUnique({
      where: {
        fromProfileId_toProfileId: {
          fromProfileId: req.profileId!,
          toProfileId: profileId,
        },
      },
    });

    // Crear like (o ignorar si ya existe)
    const like = existingLike || await prisma.like.create({
      data: {
        fromProfileId: req.profileId!,
        toProfileId: profileId,
      },
    });

    // Incrementar contador de likes si el perfil tiene Roam activo
    // Solo si es un like nuevo (no existía antes)
    if (!existingLike) {
      const { incrementProfileLike } = await import('../controllers/roam.controller')
      await incrementProfileLike(profileId)
    }

    // Verificar si hay MATCH (la otra persona ya me había dado like)
    const theirLike = await prisma.like.findFirst({
      where: {
        fromProfileId: profileId,
        toProfileId: req.profileId!,
      },
    });

    const isMatch = !!theirLike;

    // Emitir notificación de like recibido al perfil que recibió el like (si no es match)
    if (!isMatch) {
      const io = getIO();
      
      // Obtener perfil completo del usuario que dio like
      const myProfile = await prisma.profile.findUnique({
        where: { id: req.profileId! },
        include: {
          photos: {
            where: { type: 'cover' },
            take: 1,
          },
        },
      });

      // Emitir evento de like recibido al destinatario
      io.to(`profile:${profileId}`).emit('new_like', {
        fromProfile: {
          id: myProfile?.id,
          title: myProfile?.title,
          age: myProfile?.age,
          photos: myProfile?.photos || [],
        },
      });
    }

    // Si hay match, emitir notificación por Socket.IO
    if (isMatch) {
      const io = getIO();
      
      // Obtener perfil completo del usuario que hizo match
      const myProfile = await prisma.profile.findUnique({
        where: { id: req.profileId! },
        include: {
          photos: {
            where: { type: 'cover' },
            take: 1,
          },
        },
      });

      // Normalizar fotos antes de emitir
      const normalizedTargetPhotos = targetProfile.photos ? normalizeProfilePhotos(targetProfile).photos : [];
      const normalizedMyPhotos = myProfile?.photos ? normalizeProfilePhotos(myProfile).photos : [];

      console.log(`🎉 MATCH! ${myProfile?.title} ↔ ${targetProfile.title}`);
      console.log(`   Emitiendo new_match a profile:${req.profileId!} y profile:${profileId}`);
      console.log(`   Salas activas:`, Object.keys(io.sockets.adapter.rooms).filter(r => r.startsWith('profile:')));

      // Emitir evento de match a ambos usuarios
      // IMPORTANTE: Emitir tanto a la sala como directamente al socket si está conectado
      const socketsInRoom1 = await io.in(`profile:${req.profileId!}`).fetchSockets();
      const socketsInRoom2 = await io.in(`profile:${profileId}`).fetchSockets();
      console.log(`   Sockets en profile:${req.profileId!}: ${socketsInRoom1.length}`);
      console.log(`   Sockets en profile:${profileId}: ${socketsInRoom2.length}`);
      
      io.to(`profile:${req.profileId!}`).emit('new_match', {
        matchProfile: {
          id: targetProfile.id,
          title: targetProfile.title,
          age: targetProfile.age,
          city: targetProfile.city,
          photos: normalizedTargetPhotos,
        },
        myProfile: {
          id: myProfile?.id,
          title: myProfile?.title,
        },
      });

      io.to(`profile:${profileId}`).emit('new_match', {
        matchProfile: {
          id: myProfile?.id,
          title: myProfile?.title,
          age: myProfile?.age,
          city: myProfile?.city,
          photos: normalizedMyPhotos,
        },
        myProfile: {
          id: targetProfile.id,
          title: targetProfile.title,
        },
      });
    }

    // Si el perfil tiene personalidad (perfiles automáticos) y NO hay match aún, programar auto-like
    // Estos perfiles SIEMPRE devuelven el like automáticamente
    if (targetProfile.personality && !isMatch) {
      // Delay aleatorio entre 60-120 segundos (1-2 minutos) para simular respuesta real
      const delay = Math.floor(Math.random() * 60000) + 60000;
      
      console.log(`🤖 Perfil automático ${targetProfile.title} (${profileId}) devolverá like a ${req.profileId} en ${delay/1000}s`);
      
      setTimeout(async () => {
        try {
          // Verificar que aún no haya match (por si el usuario eliminó el like)
          const existingLike = await prisma.like.findFirst({
            where: {
              fromProfileId: req.profileId!,
              toProfileId: profileId,
            },
          });

          if (!existingLike) {
            // El usuario eliminó el like, no hacer nada
            console.log(`⚠️  Usuario ${req.profileId} eliminó el like, no se devuelve`);
            return;
          }

          // Verificar que no haya match ya
          const existingMatch = await prisma.like.findFirst({
            where: {
              fromProfileId: profileId,
              toProfileId: req.profileId!,
            },
          });

          if (existingMatch) {
            // Ya hay match, no hacer nada
            console.log(`✅ Ya existe match entre ${profileId} y ${req.profileId}`);
            return;
          }

          // Crear like del perfil falso hacia el usuario (SIEMPRE devuelve el like)
          await prisma.like.create({
            data: {
              fromProfileId: profileId,
              toProfileId: req.profileId!,
            },
          });
          
          console.log(`💚 Perfil automático ${targetProfile.title} devolvió el like - MATCH creado!`);

          // Obtener perfiles completos para la notificación
          const myProfile = await prisma.profile.findUnique({
            where: { id: req.profileId! },
            include: {
              photos: {
                where: { type: 'cover' },
                take: 1,
              },
            },
          });

          const fakeProfile = await prisma.profile.findUnique({
            where: { id: profileId },
            include: {
              photos: {
                where: { type: 'cover' },
                take: 1,
              },
            },
          });

          const io = getIO();
          
          // Emitir evento de match a la sala del usuario
          io.to(`profile:${req.profileId!}`).emit('new_match', {
            matchProfile: {
              id: fakeProfile?.id,
              title: fakeProfile?.title,
              age: fakeProfile?.age,
              photos: fakeProfile?.photos || [],
            },
            myProfile: {
              id: myProfile?.id,
              title: myProfile?.title,
            },
          });
          
          // También emitir a todas las salas por si acaso (para debugging)
          console.log(`📢 Emitiendo notificación de match a profile:${req.profileId!}`);

          console.log(`✅ Auto-like creado y match notificado: ${targetProfile.title} → ${myProfile?.title}`);
        } catch (error) {
          console.error('Error al crear auto-like:', error);
        }
      }, delay);
    }

    res.status(201).json({
      message: isMatch ? '¡MATCH! 💕' : 'Like enviado',
      like,
      isMatch,
      matchProfile: isMatch ? targetProfile : null,
    });
  } catch (error) {
    console.error('Error al dar like:', error);
    res.status(500).json({ error: 'Error al dar like' });
  }
};

// Quitar like
export const unlikeProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { profileId } = req.params;

    await prisma.like.deleteMany({
      where: {
        fromProfileId: req.profileId!,
        toProfileId: profileId,
      },
    });

    res.json({ message: 'Like eliminado' });
  } catch (error) {
    console.error('Error al quitar like:', error);
    res.status(500).json({ error: 'Error al quitar like' });
  }
};

// Obtener likes enviados
export const getSentLikes = async (req: AuthRequest, res: Response) => {
  try {
    const likes = await prisma.like.findMany({
      where: { 
        fromProfileId: req.profileId!,
        toProfile: {
          isFake: false, // EXCLUIR perfiles falsos
        },
      },
      include: {
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

    // Normalizar URLs de fotos antes de enviar
    const normalizedLikes = likes.map(like => ({
      ...like,
      toProfile: like.toProfile ? normalizeProfilePhotos(like.toProfile) : like.toProfile,
    }));

    res.json({ likes: normalizedLikes });
  } catch (error) {
    console.error('Error al obtener likes enviados:', error);
    res.status(500).json({ error: 'Error al obtener likes' });
  }
};

// Obtener likes recibidos
export const getReceivedLikes = async (req: AuthRequest, res: Response) => {
  try {
    // Verificar suscripción
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

    const isPlus = myProfile?.user?.subscription?.isActive || false;

    // Obtener likes (excluyendo perfiles falsos)
    const likesQuery = prisma.like.findMany({
      where: { 
        toProfileId: req.profileId!,
        fromProfile: {
          isFake: false, // EXCLUIR perfiles falsos
        },
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
      },
      orderBy: { createdAt: 'desc' },
    });

    let likes;
    let totalCount = 0;
    
    if (isPlus) {
      // 9Plus: ver todos los likes con perfiles completos
      likes = await likesQuery;
      totalCount = likes.length;
    } else {
      // Gratis: NO mostrar perfiles, solo el contador (excluyendo perfiles falsos)
      totalCount = await prisma.like.count({
        where: { 
          toProfileId: req.profileId!,
          fromProfile: {
            isFake: false, // EXCLUIR perfiles falsos
          },
        },
      });
      // Devolver array vacío para que el frontend muestre "bloqueado"
      likes = [];
    }

    // Normalizar URLs de fotos antes de enviar
    const normalizedLikes = likes.map(like => ({
      ...like,
      fromProfile: like.fromProfile ? normalizeProfilePhotos(like.fromProfile) : like.fromProfile,
    }));

    res.json({
      likes: normalizedLikes,
      isPlus,
      total: totalCount,
      // Para FREE: mostrar solo los últimos 5 (pero sin perfiles visibles)
      freeLimit: isPlus ? undefined : 5,
    });
  } catch (error) {
    console.error('Error al obtener likes recibidos:', error);
    res.status(500).json({ error: 'Error al obtener likes' });
  }
};

// Verificar si hay match mutuo (ambos se han dado like)
export const checkMatch = async (req: AuthRequest, res: Response) => {
  try {
    const { profileId } = req.params;

    // Verificar mi like hacia ellos
    const myLike = await prisma.like.findFirst({
      where: {
        fromProfileId: req.profileId!,
        toProfileId: profileId,
      },
    });

    // Verificar su like hacia mí
    const theirLike = await prisma.like.findFirst({
      where: {
        fromProfileId: profileId,
        toProfileId: req.profileId!,
      },
    });

    const hasMatch = !!(myLike && theirLike);

    res.json({
      hasMatch,
      iLikedThem: !!myLike,
      theyLikedMe: !!theirLike,
    });
  } catch (error) {
    console.error('Error al verificar match:', error);
    res.status(500).json({ error: 'Error al verificar match' });
  }
};

// Obtener matches (likes mutuos)
export const getMatches = async (req: AuthRequest, res: Response) => {
  try {
    // Obtener todos los likes que he enviado
    const sentLikes = await prisma.like.findMany({
      where: { 
        fromProfileId: req.profileId!,
        toProfile: {
          isFake: false, // EXCLUIR perfiles falsos
        },
      },
      select: { toProfileId: true },
    });

    const sentLikeIds = sentLikes.map(like => like.toProfileId);

    // De esos, encontrar cuáles me han dado like de vuelta (MATCH)
    const matches = await prisma.like.findMany({
      where: {
        fromProfileId: { in: sentLikeIds }, // De los que yo le di like
        toProfileId: req.profileId!, // Que me dieron like de vuelta
        fromProfile: {
          isFake: false, // EXCLUIR perfiles falsos
        },
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
      },
      orderBy: { createdAt: 'desc' },
    });

    // Normalizar URLs de fotos
    const normalizedMatches = matches.map(match => ({
      ...match,
      fromProfile: match.fromProfile ? normalizeProfilePhotos(match.fromProfile) : match.fromProfile,
    }));

    res.json({ 
      matches: normalizedMatches,
      total: normalizedMatches.length,
    });
  } catch (error) {
    console.error('Error al obtener matches:', error);
    res.status(500).json({ error: 'Error al obtener matches' });
  }
};

