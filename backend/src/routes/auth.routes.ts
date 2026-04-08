import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Registro
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('orientation')
      .isIn(['chica', 'chico', 'trans', 'casa', 'gay', 'masajes', 'hetero'])
      .withMessage('Categoría inválida'),
  ],
  authController.register
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Contraseña requerida'),
  ],
  authController.login
);

// Refresh token
router.post('/refresh', authController.refreshToken);

// Logout
router.post('/logout', authenticateToken, authController.logout);

// Verificar email
router.get('/verify-email/:token', authController.verifyEmail);

// Reenviar email de verificación
router.post('/resend-verification', authController.resendVerificationEmail);

// Solicitar recuperación de contraseña
router.post('/forgot-password', authController.forgotPassword);

// Restablecer contraseña
router.post('/reset-password', authController.resetPassword);

// Eliminar cuenta (requiere autenticación)
router.delete('/delete-account', authenticateToken, authController.deleteAccount);

// Obtener usuario actual
router.get('/me', authenticateToken, authController.getCurrentUser);

export default router;

