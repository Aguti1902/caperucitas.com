import { Response } from 'express'
import prisma from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'


// Activar Roam (DEPRECATED - Ahora se usa Stripe Checkout)
// Este endpoint se mantiene por compatibilidad, pero debería redirigir a Stripe
export const activateRoam = async (req: AuthRequest, res: Response) => {
  try {
    const profileId = req.profileId
    const { duration = 60 } = req.body // duración en minutos (default 1 hora)

    if (!profileId) {
      return res.status(401).json({ error: 'No autenticado' })
    }

    // Verificar que el usuario tiene 9Plus
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: {
        user: {
          include: {
            subscription: true,
          },
        },
      },
    })

    if (!profile) {
      return res.status(404).json({ error: 'Perfil no encontrado' })
    }

    const isPremium = profile.user?.subscription?.isActive || false
    if (!isPremium) {
      return res.status(403).json({ error: 'Necesitas 9Plus para usar Roam', requiresPremium: true })
    }

    // Verificar si ya tiene un Roam activo
    if (profile.isRoaming && profile.roamingUntil && new Date(profile.roamingUntil) > new Date()) {
      return res.status(400).json({ 
        error: 'Ya tienes un Roam activo',
        roamingUntil: profile.roamingUntil,
      })
    }

    // NOTA: Este endpoint ya no activa RoAM directamente
    // Debe usar /api/payments/roam/checkout para crear una sesión de Stripe
    return res.status(400).json({ 
      error: 'Este endpoint está deprecado. Usa /api/payments/roam/checkout para pagar con Stripe',
      useStripeCheckout: true,
    })

    const startTime = new Date()
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000)

    // Obtener métricas actuales (vistas y likes antes del Roam)
    // Para vistas: usar el contador de la sesión activa anterior si existe, o 0
    const previousSession = await prisma.roamSession.findFirst({
      where: {
        profileId,
        isActive: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    
    const currentViews = previousSession 
      ? (previousSession.viewsBeforeRoam + (previousSession.viewsDuringRoam || 0))
      : 0
    
    const currentLikes = await prisma.like.count({
      where: { toProfileId: profileId },
    })

    // Crear sesión de Roam
    const roamSession = await prisma.roamSession.create({
      data: {
        profileId,
        startTime,
        endTime,
        viewsBeforeRoam: currentViews,
        likesBeforeRoam: currentLikes,
        isActive: true,
      },
    })

    // Actualizar perfil
    await prisma.profile.update({
      where: { id: profileId },
      data: {
        isRoaming: true,
        roamingUntil: endTime,
      },
    })

    // Crear registro de compra (mock - en producción se integraría con pasarela de pago)
    await prisma.roamPurchase.create({
      data: {
        profileId,
        duration,
        price: 6.49,
        startTime,
        endTime,
      },
    })

    res.json({
      message: 'Roam activado correctamente',
      roamSession: {
        id: roamSession.id,
        startTime,
        endTime,
        duration,
      },
    })
  } catch (error) {
    console.error('Error al activar Roam:', error)
    res.status(500).json({ error: 'Error al activar Roam' })
  }
}

// Obtener estado del Roam actual
export const getRoamStatus = async (req: AuthRequest, res: Response) => {
  try {
    const profileId = req.profileId

    if (!profileId) {
      return res.status(401).json({ error: 'No autenticado' })
    }

    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: {
        isRoaming: true,
        roamingUntil: true,
      },
    })

    if (!profile) {
      return res.status(404).json({ error: 'Perfil no encontrado' })
    }

    // Verificar si el Roam sigue activo
    const isActive = profile.isRoaming && profile.roamingUntil && new Date(profile.roamingUntil) > new Date()

    if (!isActive && profile.isRoaming) {
      // El Roam ha expirado, actualizar estado
      await prisma.profile.update({
        where: { id: profileId },
        data: {
          isRoaming: false,
          roamingUntil: null,
        },
      })

      return res.json({
        isActive: false,
        roamingUntil: null,
      })
    }

    // Obtener sesión activa
    const activeSession = isActive
      ? await prisma.roamSession.findFirst({
          where: {
            profileId,
            isActive: true,
            endTime: {
              gte: new Date(),
            },
          },
        })
      : null

    res.json({
      isActive,
      roamingUntil: profile.roamingUntil,
      session: activeSession,
    })
  } catch (error) {
    console.error('Error al obtener estado de Roam:', error)
    res.status(500).json({ error: 'Error al obtener estado de Roam' })
  }
}

// Finalizar Roam y obtener resumen
export const finishRoam = async (req: AuthRequest, res: Response) => {
  try {
    const profileId = req.profileId

    if (!profileId) {
      return res.status(401).json({ error: 'No autenticado' })
    }

    // Buscar sesión activa
    const activeSession = await prisma.roamSession.findFirst({
      where: {
        profileId,
        isActive: true,
      },
    })

    if (!activeSession) {
      return res.status(404).json({ error: 'No hay sesión activa de Roam' })
    }

    // Obtener métricas actuales
    const currentLikes = await prisma.like.count({
      where: { toProfileId: profileId },
    })

    // Usar las vistas que ya se han trackeado durante el Roam
    const viewsDuringRoam = activeSession.viewsDuringRoam || 0
    const likesDuringRoam = Math.max(0, currentLikes - activeSession.likesBeforeRoam)

    // Actualizar sesión
    await prisma.roamSession.update({
      where: { id: activeSession.id },
      data: {
        viewsDuringRoam,
        likesDuringRoam,
        isActive: false,
      },
    })

    // Actualizar perfil
    await prisma.profile.update({
      where: { id: profileId },
      data: {
        isRoaming: false,
        roamingUntil: null,
      },
    })

    res.json({
      message: 'Roam finalizado',
      summary: {
        viewsExtra: viewsDuringRoam,
        likesExtra: likesDuringRoam,
        duration: Math.floor((new Date().getTime() - new Date(activeSession.startTime).getTime()) / 60000), // minutos
      },
    })
  } catch (error) {
    console.error('Error al finalizar Roam:', error)
    res.status(500).json({ error: 'Error al finalizar Roam' })
  }
}

// Incrementar contador de visualizaciones (llamar cuando alguien ve un perfil)
export const incrementProfileView = async (profileId: string) => {
  try {
    // Aquí podrías implementar un sistema de tracking más sofisticado
    // Por ahora, simplemente se cuenta en las métricas
    const activeSession = await prisma.roamSession.findFirst({
      where: {
        profileId,
        isActive: true,
        endTime: {
          gte: new Date(),
        },
      },
    })

    if (activeSession) {
      await prisma.roamSession.update({
        where: { id: activeSession.id },
        data: {
          viewsDuringRoam: {
            increment: 1,
          },
        },
      })
    }
  } catch (error) {
    console.error('Error al incrementar vista:', error)
  }
}

// Incrementar contador de likes (llamar cuando alguien da like)
export const incrementProfileLike = async (profileId: string) => {
  try {
    const activeSession = await prisma.roamSession.findFirst({
      where: {
        profileId,
        isActive: true,
        endTime: {
          gte: new Date(),
        },
      },
    })

    if (activeSession) {
      await prisma.roamSession.update({
        where: { id: activeSession.id },
        data: {
          likesDuringRoam: {
            increment: 1,
          },
        },
      })
    }
  } catch (error) {
    console.error('Error al incrementar like:', error)
  }
}
