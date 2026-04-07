import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.utils';
import { generateVerificationToken, sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail } from '../utils/email-resend.utils';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

// Registro
export const register = async (req: Request, res: Response) => {
  try {
    // Validar input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, orientation, captchaToken } = req.body;

    // Validar CAPTCHA
    if (captchaToken) {
      const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
      
      if (recaptchaSecret) {
        try {
          const verifyUrl = `https://www.google.com/recaptcha/api/siteverify`;
          const verifyResponse = await fetch(verifyUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `secret=${recaptchaSecret}&response=${captchaToken}`,
          });

          const verifyData = await verifyResponse.json() as { success: boolean; challenge_ts?: string; hostname?: string; 'error-codes'?: string[] };

          if (!verifyData.success) {
            return res.status(400).json({ 
              error: 'Verificación CAPTCHA fallida. Por favor, inténtalo de nuevo.',
              captchaError: true,
            });
          }

          console.log('✅ CAPTCHA verificado correctamente');
        } catch (captchaError) {
          console.error('Error al verificar CAPTCHA:', captchaError);
          // No bloqueamos el registro si falla la verificación del CAPTCHA (modo degradado)
          console.warn('⚠️ Modo degradado: Permitiendo registro sin verificar CAPTCHA');
        }
      } else {
        console.warn('⚠️ RECAPTCHA_SECRET_KEY no configurada - CAPTCHA deshabilitado');
      }
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      // Si el usuario existe pero NO ha verificado su email, reenviar el email de verificación
      if (!existingUser.emailVerified) {
        // Eliminar tokens antiguos
        await prisma.emailVerificationToken.deleteMany({
          where: { userId: existingUser.id },
        });

        // Crear nuevo token
        const verificationToken = generateVerificationToken();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        await prisma.emailVerificationToken.create({
          data: {
            userId: existingUser.id,
            token: verificationToken,
            expiresAt,
          },
        });

        // Reenviar email de forma SÍNCRONA para capturar errores
        try {
          await sendVerificationEmail(existingUser.email, verificationToken);
          console.log(`✅ Email de verificación reenviado a: ${existingUser.email}`);
        } catch (error: any) {
          console.error('\n❌ ========================================');
          console.error('❌ ERROR CRÍTICO AL REENVIAR EMAIL');
          console.error('❌ ========================================');
          console.error('Email:', existingUser.email);
          console.error('Error:', error.message);
          console.error('Stack:', error.stack);
          console.error('❌ ========================================\n');
          // No bloquear el flujo si falla el email
        }

        return res.status(200).json({
          message: 'Este email ya está registrado pero no verificado. Te hemos reenviado el email de confirmación.',
          email: existingUser.email,
          orientation,
          requiresVerification: true,
          isResend: true,
        });
      }

      // Si ya está verificado, mostrar error
      return res.status(400).json({ error: 'Este email ya está registrado' });
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    const hasEmailService = !!process.env.RESEND_API_KEY;

    // Si no hay servicio de email, verificar directamente para no bloquear el registro
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        emailVerified: !hasEmailService, // Si no hay email service, verificar automáticamente
      },
    });

    // Solo enviar email de verificación si RESEND está configurado
    if (hasEmailService) {
      const verificationToken = generateVerificationToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await prisma.emailVerificationToken.create({
        data: { userId: user.id, token: verificationToken, expiresAt },
      });

      try {
        await sendVerificationEmail(user.email, verificationToken);
        console.log(`✅ Email de verificación enviado a: ${user.email}`);
      } catch (error: any) {
        console.error('❌ Error enviando email de verificación:', error.message);
      }

      console.log(`✅ Usuario registrado: ${user.email} (esperando verificación de email)`);

      return res.status(201).json({
        message: 'Usuario registrado. Por favor verifica tu email para continuar.',
        email: user.email,
        orientation,
        requiresVerification: true,
      });
    }

    // Sin servicio de email: generar tokens y dejar entrar directamente
    console.log(`✅ Usuario registrado (sin verificación email): ${user.email}`);

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.status(201).json({
      message: 'Usuario registrado correctamente.',
      user: {
        id: user.id,
        email: user.email,
        hasProfile: false,
      },
      accessToken,
      refreshToken,
      requiresVerification: false,
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

// Login
export const login = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        profile: true,
        subscription: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Verificar que el email esté confirmado
    if (!user.emailVerified) {
      return res.status(403).json({ 
        error: 'Por favor, verifica tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada y haz clic en el enlace de confirmación.',
        requiresEmailVerification: true,
        email: user.email,
      });
    }

    // Actualizar estado online si tiene perfil
    if (user.profile) {
      await prisma.profile.update({
        where: { id: user.profile.id },
        data: {
          isOnline: true,
          lastSeenAt: new Date(),
        },
      });
    }

    // Generar tokens
    let accessToken: string;
    let refreshToken: string;
    
    try {
      accessToken = generateAccessToken(user.id);
      refreshToken = generateRefreshToken(user.id);
    } catch (tokenError: any) {
      console.error('Error al generar tokens:', tokenError);
      return res.status(500).json({ 
        error: 'Error de configuración del servidor',
        details: process.env.NODE_ENV === 'development' ? tokenError.message : undefined
      });
    }

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: 'Login exitoso',
      user: {
        id: user.id,
        email: user.email,
        hasProfile: !!user.profile,
        profile: user.profile ? {
          id: user.profile.id,
          title: user.profile.title,
          orientation: user.profile.orientation,
          city: user.profile.city,
        } : null,
        subscription: user.subscription ? {
          isActive: user.subscription.isActive,
          plan: user.subscription.plan,
        } : null,
      },
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    console.error('Error en login:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Error al iniciar sesión',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Refresh token
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token requerido' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const newAccessToken = generateAccessToken(user.id);

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000,
    });

    res.json({
      accessToken: newAccessToken,
    });
  } catch (error) {
    res.status(403).json({ error: 'Refresh token inválido' });
  }
};

// Logout
export const logout = async (req: AuthRequest, res: Response) => {
  try {
    // Marcar como offline
    if (req.profileId) {
      await prisma.profile.update({
        where: { id: req.profileId },
        data: {
          isOnline: false,
          lastSeenAt: new Date(),
        },
      });
    }

    // Limpiar cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({ message: 'Logout exitoso' });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ error: 'Error al cerrar sesión' });
  }
};

// Verificar email
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    // Buscar el token
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationToken) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    // Verificar si el token ha expirado
    if (new Date() > verificationToken.expiresAt) {
      await prisma.emailVerificationToken.delete({
        where: { id: verificationToken.id },
      });
      return res.status(400).json({ error: 'Token expirado. Por favor solicita uno nuevo.' });
    }

    // Verificar email del usuario
    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: true },
    });

    // Eliminar el token usado
    await prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    });

    // Enviar email de bienvenida de forma SÍNCRONA
    try {
      await sendWelcomeEmail(verificationToken.user.email, verificationToken.user.email.split('@')[0]);
    } catch (error: any) {
      console.error('\n❌ ERROR AL ENVIAR EMAIL DE BIENVENIDA:', error.message);
      // No bloquear si falla
    }

    // Generar tokens de sesión
    const accessToken = generateAccessToken(verificationToken.userId);
    const refreshToken = generateRefreshToken(verificationToken.userId);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: 'Email verificado exitosamente',
      user: {
        id: verificationToken.user.id,
        email: verificationToken.user.email,
        emailVerified: true,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Error al verificar email:', error);
    res.status(500).json({ error: 'Error al verificar email' });
  }
};

// Reenviar email de verificación
export const resendVerificationEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'El email ya está verificado' });
    }

    // Eliminar tokens anteriores
    await prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id },
    });

    // Crear nuevo token
    const verificationToken = generateVerificationToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt,
      },
    });

    // Enviar email
    await sendVerificationEmail(user.email, verificationToken);

    res.json({ message: 'Email de verificación reenviado' });
  } catch (error) {
    console.error('Error al reenviar email:', error);
    res.status(500).json({ error: 'Error al reenviar email' });
  }
};

// Solicitar recuperación de contraseña
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email requerido' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Por seguridad, siempre devolver el mismo mensaje aunque el usuario no exista
    if (!user) {
      return res.json({ 
        message: 'Si el email existe en nuestro sistema, recibirás un email con instrucciones para restablecer tu contraseña.' 
      });
    }

    // Eliminar tokens de reset anteriores
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Generar nuevo token
    const resetToken = generateVerificationToken(); // Reutilizamos la función
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Expira en 1 hora

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    });

    // Enviar email con link de reset de forma SÍNCRONA
    try {
      await sendPasswordResetEmail(user.email, resetToken);
      console.log(`✅ Token de recuperación de contraseña generado y enviado a: ${user.email}`);
    } catch (error: any) {
      console.error('\n❌ ERROR AL ENVIAR EMAIL DE RECUPERACIÓN:', error.message);
      // No bloquear si falla
    }

    res.json({ 
      message: 'Si el email existe en nuestro sistema, recibirás un email con instrucciones para restablecer tu contraseña.' 
    });
  } catch (error) {
    console.error('Error en forgot password:', error);
    res.status(500).json({ error: 'Error al procesar solicitud' });
  }
};

// Restablecer contraseña
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token y nueva contraseña requeridos' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Buscar el token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    // Verificar si ya fue usado
    if (resetToken.used) {
      return res.status(400).json({ error: 'Este token ya fue utilizado' });
    }

    // Verificar si ha expirado
    if (new Date() > resetToken.expiresAt) {
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });
      return res.status(400).json({ error: 'Token expirado. Por favor solicita uno nuevo.' });
    }

    // Hash de la nueva contraseña
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });

    // Marcar token como usado
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    res.json({ message: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión.' });
  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    res.status(500).json({ error: 'Error al restablecer contraseña' });
  }
};

// Eliminar cuenta de usuario
export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        subscription: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Si tiene suscripción activa en Stripe, cancelarla
    if (user.subscription?.stripeSubscriptionId) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        await stripe.subscriptions.cancel(user.subscription.stripeSubscriptionId);
      } catch (stripeError) {
        console.error('Error al cancelar suscripción en Stripe:', stripeError);
        // Continuar con la eliminación aunque falle la cancelación en Stripe
      }
    }

    // Eliminar usuario (Prisma se encargará de eliminar todo lo relacionado gracias a onDelete: Cascade)
    await prisma.user.delete({
      where: { id: userId },
    });

    // Limpiar cookies y tokens
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({ message: 'Cuenta eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar cuenta:', error);
    res.status(500).json({ error: 'Error al eliminar cuenta' });
  }
};

// Obtener usuario actual
export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        profile: {
          include: {
            photos: true,
          },
        },
        subscription: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      hasProfile: !!user.profile,
      profile: user.profile,
      subscription: user.subscription,
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error al obtener datos del usuario' });
  }
};

