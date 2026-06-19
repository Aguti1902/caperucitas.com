import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { generateFakeProfiles } from '../prisma/seedHelpers';
import jwt from 'jsonwebtoken';


// Login de admin
export const login = async (req: Request, res: Response) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Contraseña requerida' });
    }

    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // Generar token JWT para admin
    const token = jwt.sign(
      { role: 'admin' },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      message: 'Login exitoso',
    });
  } catch (error) {
    console.error('Error en login de admin:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

// Obtener todos los perfiles
export const getAllProfiles = async (req: Request, res: Response) => {
  try {
    const profiles = await prisma.profile.findMany({
      include: {
        photos: true,
        user: {
          select: {
            id: true,
            email: true,
            emailVerified: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            sentMessages: true,
            receivedMessages: true,
            sentLikes: true,
            receivedLikes: true,
            reportsReceived: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ profiles, total: profiles.length });
  } catch (error) {
    console.error('Error al obtener perfiles:', error);
    res.status(500).json({ error: 'Error al obtener perfiles' });
  }
};

// Obtener todas las denuncias
export const getAllReports = async (req: Request, res: Response) => {
  try {
    const reports = await prisma.report.findMany({
      select: {
        id: true,
        reason: true,
        createdAt: true,
        reporterIp: true,
        reporterProfile: {
          include: {
            photos: {
              where: { type: 'cover' },
              take: 1,
            },
            user: {
              select: { email: true },
            },
          },
        },
        reportedProfile: {
          include: {
            photos: {
              where: { type: 'cover' },
              take: 1,
            },
            user: {
              select: { id: true, email: true },
            },
            _count: {
              select: { reportsReceived: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ reports, total: reports.length });
  } catch (error) {
    console.error('Error al obtener denuncias:', error);
    res.status(500).json({ error: 'Error al obtener denuncias' });
  }
};

// Eliminar usuario y su perfil
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'ID de usuario requerido' });
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Eliminar usuario (CASCADE eliminará el perfil y todo lo relacionado)
    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente',
      deletedUser: {
        id: user.id,
        email: user.email,
        profileTitle: user.profile?.title,
      },
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};

// Eliminar denuncia
export const deleteReport = async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;

    if (!reportId) {
      return res.status(400).json({ error: 'ID de denuncia requerido' });
    }

    await prisma.report.delete({
      where: { id: reportId },
    });

    res.json({
      success: true,
      message: 'Denuncia eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error al eliminar denuncia:', error);
    res.status(500).json({ error: 'Error al eliminar denuncia' });
  }
};

// Regenerar perfiles falsos
export const regenerateFakeProfiles = async (req: Request, res: Response) => {
  try {
    // Eliminar perfiles falsos existentes
    await prisma.profile.deleteMany({
      where: { isFake: true },
    });

    // Generar nuevos perfiles falsos
    const count = Math.floor(Math.random() * 200) + 200; // 200-400 perfiles
    await generateFakeProfiles(count);

    res.json({ message: `${count} perfiles falsos generados exitosamente` });
  } catch (error) {
    console.error('Error al regenerar perfiles falsos:', error);
    res.status(500).json({ error: 'Error al regenerar perfiles falsos' });
  }
};

// Eliminar perfiles falsos
export const deleteFakeProfiles = async (req: Request, res: Response) => {
  try {
    const result = await prisma.profile.deleteMany({
      where: { isFake: true },
    });

    res.json({ message: `${result.count} perfiles falsos eliminados` });
  } catch (error) {
    console.error('Error al eliminar perfiles falsos:', error);
    res.status(500).json({ error: 'Error al eliminar perfiles falsos' });
  }
};

// Ejecuta promesas en lotes para no agotar el pool de Supabase (máx. ~15 conexiones)
async function runInBatches<T>(tasks: (() => Promise<T>)[], batchSize = 5): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);
    results.push(...(await Promise.all(batch.map((fn) => fn()))));
  }
  return results;
}

// Obtener estadísticas
export const getStats = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalProfiles,
      fakeProfiles,
      realProfiles,
      verifiedUsers,
      unverifiedUsers,
      heteroProfiles,
      gayProfiles,
      totalMessages,
      totalLikes,
      totalFavorites,
      totalReports,
      totalBlocks,
      activeSubscriptions,
      onlineUsers,
      usersLast24h,
      usersLast7days,
      usersLast30days,
      messagesLast24h,
      likesLast24h,
    ] = await runInBatches([
      () => prisma.user.count(),
      () => prisma.profile.count(),
      () => prisma.profile.count({ where: { isFake: true } }),
      () => prisma.profile.count({ where: { isFake: false } }),
      () => prisma.user.count({ where: { emailVerified: true } }),
      () => prisma.user.count({ where: { emailVerified: false } }),
      () => prisma.profile.count({ where: { orientation: 'hetero' } }),
      () => prisma.profile.count({ where: { orientation: 'gay' } }),
      () => prisma.message.count(),
      () => prisma.like.count(),
      () => prisma.favorite.count(),
      () => prisma.report.count(),
      () => prisma.block.count(),
      () => prisma.subscription.count({ where: { isActive: true } }),
      () => prisma.profile.count({ where: { isOnline: true } }),
      () => prisma.profile.count({ where: { lastSeenAt: { gte: oneDayAgo } } }),
      () => prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      () => prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      () => prisma.message.count({ where: { createdAt: { gte: oneDayAgo } } }),
      () => prisma.like.count({ where: { createdAt: { gte: oneDayAgo } } }),
    ]);

    // Matches mutuos (SQL eficiente, con fallback)
    let matches = 0;
    try {
      const mutualMatches = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint AS count FROM (
          SELECT l1."fromProfileId", l1."toProfileId"
          FROM likes l1
          INNER JOIN likes l2
            ON l1."fromProfileId" = l2."toProfileId"
           AND l1."toProfileId" = l2."fromProfileId"
           AND l1."fromProfileId" < l1."toProfileId"
        ) AS pairs
      `;
      matches = Number(mutualMatches[0]?.count || 0);
    } catch (matchErr) {
      console.warn('No se pudieron calcular matches:', matchErr);
    }

    // Conversaciones activas (SQL, sin cargar todos los mensajes)
    let activeConversations = 0;
    try {
      const convResult = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint AS count FROM (
          SELECT DISTINCT
            CASE WHEN "fromProfileId" < "toProfileId"
              THEN "fromProfileId" || '|' || "toProfileId"
              ELSE "toProfileId" || '|' || "fromProfileId"
            END AS pair
          FROM messages
          WHERE "createdAt" >= ${sevenDaysAgo}
        ) AS pairs
      `;
      activeConversations = Number(convResult[0]?.count || 0);
    } catch (convErr) {
      console.warn('No se pudieron calcular conversaciones activas:', convErr);
    }

    // Registros por día (una sola consulta)
    const sevenDaysStart = new Date(now);
    sevenDaysStart.setDate(sevenDaysStart.getDate() - 6);
    sevenDaysStart.setHours(0, 0, 0, 0);

    let registrationsByDay: { date: string; count: number }[] = [];
    try {
      const dailyRows = await prisma.$queryRaw<{ day: Date; count: bigint }[]>`
        SELECT DATE("createdAt") AS day, COUNT(*)::bigint AS count
        FROM users
        WHERE "createdAt" >= ${sevenDaysStart}
        GROUP BY DATE("createdAt")
        ORDER BY day ASC
      `;
      const countByDate = new Map(
        dailyRows.map((r) => [new Date(r.day).toISOString().split('T')[0], Number(r.count)])
      );
      registrationsByDay = Array.from({ length: 7 }).map((_, i) => {
        const dayStart = new Date(now);
        dayStart.setDate(dayStart.getDate() - (6 - i));
        dayStart.setHours(0, 0, 0, 0);
        const date = dayStart.toISOString().split('T')[0];
        return { date, count: countByDate.get(date) || 0 };
      });
    } catch (regErr) {
      console.warn('No se pudieron calcular registros por día:', regErr);
      registrationsByDay = Array.from({ length: 7 }).map((_, i) => {
        const dayStart = new Date(now);
        dayStart.setDate(dayStart.getDate() - (6 - i));
        return { date: dayStart.toISOString().split('T')[0], count: 0 };
      });
    }

    // Tasas de conversión
    const emailVerificationRate = totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 0;
    const profileCompletionRate = totalUsers > 0 ? (realProfiles / totalUsers) * 100 : 0;
    const subscriptionConversionRate = totalUsers > 0 ? (activeSubscriptions / totalUsers) * 100 : 0;

    // Calcular promedio de mensajes por usuario
    const avgMessagesPerUser = totalProfiles > 0 ? totalMessages / totalProfiles : 0;

    // Perfiles más reportados / activos (opcional, no bloquea stats principales)
    let mostReportedProfiles: Awaited<ReturnType<typeof prisma.profile.findMany>> = [];
    let mostActiveUsers: Awaited<ReturnType<typeof prisma.profile.findMany>> = [];
    try {
      mostReportedProfiles = await prisma.profile.findMany({
        include: {
          user: { select: { email: true } },
          photos: { where: { type: 'cover' }, take: 1 },
          _count: { select: { reportsReceived: true } },
        },
        orderBy: { reportsReceived: { _count: 'desc' } },
        take: 5,
        where: { reportsReceived: { some: {} } },
      });
    } catch (e) {
      console.warn('mostReportedProfiles:', e);
    }
    try {
      mostActiveUsers = await prisma.profile.findMany({
        include: {
          user: { select: { email: true } },
          photos: { where: { type: 'cover' }, take: 1 },
          _count: { select: { sentMessages: true, receivedMessages: true } },
        },
        orderBy: { sentMessages: { _count: 'desc' } },
        take: 5,
        where: { isFake: false },
      });
    } catch (e) {
      console.warn('mostActiveUsers:', e);
    }

    res.json({
      users: {
        total: totalUsers,
        verified: verifiedUsers,
        unverified: unverifiedUsers,
        online: onlineUsers,
        activeLast24h: usersLast24h,
        newLast7days: usersLast7days,
        newLast30days: usersLast30days,
      },
      profiles: {
        total: totalProfiles,
        real: realProfiles,
        fake: fakeProfiles,
        hetero: heteroProfiles,
        gay: gayProfiles,
      },
      activity: {
        messages: totalMessages,
        messagesLast24h,
        likes: totalLikes,
        likesLast24h,
        matches: Math.floor(matches),
        favorites: totalFavorites,
        reports: totalReports,
        blocks: totalBlocks,
        activeConversations: activeConversations,
        avgMessagesPerUser: avgMessagesPerUser.toFixed(2),
      },
      subscriptions: {
        active: activeSubscriptions,
        conversionRate: subscriptionConversionRate.toFixed(2),
      },
      conversion: {
        emailVerificationRate: emailVerificationRate.toFixed(2),
        profileCompletionRate: profileCompletionRate.toFixed(2),
      },
      registrationsByDay,
      mostReportedProfiles,
      mostActiveUsers,
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

// Exportar todos los emails de usuarios registrados
export const exportEmails = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { email: true, emailVerified: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    const emails = users.map(u => u.email).join('\n');
    const list = users.map(u => ({
      email: u.email,
      verified: u.emailVerified,
      createdAt: u.createdAt.toISOString().split('T')[0],
    }));
    res.json({ emails, list, total: users.length });
  } catch (error) {
    console.error('Error al exportar emails:', error);
    res.status(500).json({ error: 'Error al exportar emails' });
  }
};

// Verificar manualmente el email de un usuario (sin que el usuario tenga que clicar el link)
export const verifyUserEmail = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });

    // Eliminar tokens de verificación pendientes
    await prisma.emailVerificationToken.deleteMany({ where: { userId } });

    res.json({ success: true, message: `Email de ${user.email} verificado manualmente` });
  } catch (error) {
    console.error('Error al verificar usuario:', error);
    res.status(500).json({ error: 'Error al verificar usuario' });
  }
};

