import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';


// AuthRequest es simplemente un alias de Request
// Las propiedades userId y profileId están definidas en express-extensions.d.ts
export type AuthRequest = Request;

// Middleware para verificar token JWT
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Obtener token del header Authorization o de las cookies
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1] || req.cookies?.accessToken;

    if (!token) {
      return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET!) as {
      userId: string;
    };

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { profile: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    // Agregar userId y profileId al request
    req.userId = user.id;
    req.profileId = user.profile?.id;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// Middleware para verificar que el usuario tiene perfil completo
export const requireProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.profileId) {
      return res.status(403).json({ 
        error: 'Debes completar tu perfil primero' 
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Error al verificar perfil' });
  }
};

// Middleware para verificar suscripción 9Plus
export const require9Plus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.userId },
    });

    if (!subscription || !subscription.isActive) {
      return res.status(403).json({ 
        error: 'Esta función requiere suscripción 9Plus',
        requiresPremium: true,
      });
    }

    // Verificar que la suscripción no ha expirado
    // Si está cancelada pero aún no ha expirado el período, permitir acceso
    if (subscription.endDate && subscription.endDate < new Date()) {
      // El período terminó, desactivar la suscripción
      await prisma.subscription.update({
        where: { userId: req.userId },
        data: { 
          isActive: false,
          stripeStatus: 'canceled',
        },
      });
      return res.status(403).json({ 
        error: 'Tu suscripción 9Plus ha expirado',
        requiresPremium: true,
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Error al verificar suscripción' });
  }
};

// Middleware para verificar contraseña de admin (legacy)
export const authenticateAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { password } = req.body;
  
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(403).json({ error: 'Contraseña de admin incorrecta' });
  }
  
  next();
};

// Middleware para verificar token JWT de admin
export const authenticateAdminToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token de admin requerido' });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      role: string;
    };

    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado: se requiere rol de admin' });
    }

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(403).json({ error: 'Token inválido' });
  }
};

