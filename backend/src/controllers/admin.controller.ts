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

// Caché en memoria para no saturar Supabase (pool máx. 15 conexiones en session mode)
let statsCache: { data: Record<string, unknown>; expiresAt: number } | null = null;
const STATS_CACHE_MS = 60_000;

interface AdminCountsRow {
  totalUsers: bigint;
  totalProfiles: bigint;
  fakeProfiles: bigint;
  realProfiles: bigint;
  verifiedUsers: bigint;
  unverifiedUsers: bigint;
  heteroProfiles: bigint;
  gayProfiles: bigint;
  totalMessages: bigint;
  totalLikes: bigint;
  totalFavorites: bigint;
  totalReports: bigint;
  totalBlocks: bigint;
  activeSubscriptions: bigint;
  onlineUsers: bigint;
  usersLast24h: bigint;
  usersLast7days: bigint;
  usersLast30days: bigint;
  messagesLast24h: bigint;
  likesLast24h: bigint;
}

// Obtener estadísticas — 1 sola conexión, consultas mínimas
export const getStats = async (req: Request, res: Response) => {
  try {
    if (statsCache && Date.now() < statsCache.expiresAt) {
      return res.json(statsCache.data);
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysStart = new Date(now);
    sevenDaysStart.setDate(sevenDaysStart.getDate() - 6);
    sevenDaysStart.setHours(0, 0, 0, 0);

    // Una única query para todos los contadores principales
    const [counts] = await prisma.$queryRaw<AdminCountsRow[]>`
      SELECT
        (SELECT COUNT(*)::bigint FROM users) AS "totalUsers",
        (SELECT COUNT(*)::bigint FROM profiles) AS "totalProfiles",
        (SELECT COUNT(*)::bigint FROM profiles WHERE "isFake" = true) AS "fakeProfiles",
        (SELECT COUNT(*)::bigint FROM profiles WHERE "isFake" = false) AS "realProfiles",
        (SELECT COUNT(*)::bigint FROM users WHERE "emailVerified" = true) AS "verifiedUsers",
        (SELECT COUNT(*)::bigint FROM users WHERE "emailVerified" = false) AS "unverifiedUsers",
        (SELECT COUNT(*)::bigint FROM profiles WHERE orientation = 'hetero') AS "heteroProfiles",
        (SELECT COUNT(*)::bigint FROM profiles WHERE orientation = 'gay') AS "gayProfiles",
        (SELECT COUNT(*)::bigint FROM messages) AS "totalMessages",
        (SELECT COUNT(*)::bigint FROM likes) AS "totalLikes",
        (SELECT COUNT(*)::bigint FROM favorites) AS "totalFavorites",
        (SELECT COUNT(*)::bigint FROM reports) AS "totalReports",
        (SELECT COUNT(*)::bigint FROM blocks) AS "totalBlocks",
        (SELECT COUNT(*)::bigint FROM subscriptions WHERE "isActive" = true) AS "activeSubscriptions",
        (SELECT COUNT(*)::bigint FROM profiles WHERE "isOnline" = true) AS "onlineUsers",
        (SELECT COUNT(*)::bigint FROM profiles WHERE "lastSeenAt" >= ${oneDayAgo}) AS "usersLast24h",
        (SELECT COUNT(*)::bigint FROM users WHERE "createdAt" >= ${sevenDaysAgo}) AS "usersLast7days",
        (SELECT COUNT(*)::bigint FROM users WHERE "createdAt" >= ${thirtyDaysAgo}) AS "usersLast30days",
        (SELECT COUNT(*)::bigint FROM messages WHERE "createdAt" >= ${oneDayAgo}) AS "messagesLast24h",
        (SELECT COUNT(*)::bigint FROM likes WHERE "createdAt" >= ${oneDayAgo}) AS "likesLast24h"
    `;

    const n = (v: bigint | undefined) => Number(v || 0);
    const totalUsers = n(counts.totalUsers);
    const totalProfiles = n(counts.totalProfiles);
    const fakeProfiles = n(counts.fakeProfiles);
    const realProfiles = n(counts.realProfiles);
    const verifiedUsers = n(counts.verifiedUsers);
    const unverifiedUsers = n(counts.unverifiedUsers);
    const heteroProfiles = n(counts.heteroProfiles);
    const gayProfiles = n(counts.gayProfiles);
    const totalMessages = n(counts.totalMessages);
    const totalLikes = n(counts.totalLikes);
    const totalFavorites = n(counts.totalFavorites);
    const totalReports = n(counts.totalReports);
    const totalBlocks = n(counts.totalBlocks);
    const activeSubscriptions = n(counts.activeSubscriptions);
    const onlineUsers = n(counts.onlineUsers);
    const usersLast24h = n(counts.usersLast24h);
    const usersLast7days = n(counts.usersLast7days);
    const usersLast30days = n(counts.usersLast30days);
    const messagesLast24h = n(counts.messagesLast24h);
    const likesLast24h = n(counts.likesLast24h);

    let matches = 0;
    let activeConversations = 0;
    let registrationsByDay: { date: string; count: number }[] = [];

    try {
      const extras = await prisma.$queryRaw<
        { matches: bigint; conversations: bigint }[]
      >`
        SELECT
          (
            SELECT COUNT(*)::bigint FROM (
              SELECT l1."fromProfileId", l1."toProfileId"
              FROM likes l1
              INNER JOIN likes l2
                ON l1."fromProfileId" = l2."toProfileId"
               AND l1."toProfileId" = l2."fromProfileId"
               AND l1."fromProfileId" < l1."toProfileId"
            ) AS m
          ) AS matches,
          (
            SELECT COUNT(*)::bigint FROM (
              SELECT DISTINCT
                CASE WHEN "fromProfileId" < "toProfileId"
                  THEN "fromProfileId" || '|' || "toProfileId"
                  ELSE "toProfileId" || '|' || "fromProfileId"
                END AS pair
              FROM messages
              WHERE "createdAt" >= ${sevenDaysAgo}
            ) AS c
          ) AS conversations
      `;
      matches = n(extras[0]?.matches);
      activeConversations = n(extras[0]?.conversations);
    } catch (extraErr) {
      console.warn('Stats extras (matches/conversations):', extraErr);
    }

    try {
      const dailyRows = await prisma.$queryRaw<{ day: Date; count: bigint }[]>`
        SELECT DATE("createdAt") AS day, COUNT(*)::bigint AS count
        FROM users
        WHERE "createdAt" >= ${sevenDaysStart}
        GROUP BY DATE("createdAt")
        ORDER BY day ASC
      `;
      const countByDate = new Map(
        dailyRows.map((r) => [new Date(r.day).toISOString().split('T')[0], n(r.count)])
      );
      registrationsByDay = Array.from({ length: 7 }).map((_, i) => {
        const dayStart = new Date(now);
        dayStart.setDate(dayStart.getDate() - (6 - i));
        dayStart.setHours(0, 0, 0, 0);
        const date = dayStart.toISOString().split('T')[0];
        return { date, count: countByDate.get(date) || 0 };
      });
    } catch (regErr) {
      console.warn('Stats registrationsByDay:', regErr);
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

    const payload = {
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
      cachedAt: new Date().toISOString(),
    };

    statsCache = { data: payload, expiresAt: Date.now() + STATS_CACHE_MS };
    res.json(payload);
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

