import { Router } from 'express';
import { body } from 'express-validator';
import * as profileController from '../controllers/profile.controller';
import { authenticateToken, requireProfile } from '../middleware/auth.middleware';

const router = Router();

// Rutas PÚBLICAS (sin autenticación)
router.get('/public-search', profileController.publicSearchProfiles);
router.get('/public/:id', profileController.getPublicProfileById);

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Crear perfil
router.post(
  '/',
  [
    body('title')
      .isLength({ min: 1, max: 20 })
      .withMessage('El título debe tener entre 1 y 20 caracteres'),
    body('aboutMe').notEmpty().withMessage('La descripción es requerida'),
    body('lookingFor').notEmpty().withMessage('El campo "Lo que ofreces" es requerido'),
    body('age')
      .isInt({ min: 18, max: 99 })
      .withMessage('La edad debe estar entre 18 y 99 años'),
    body('orientation')
      .isIn(['chica', 'chico', 'trans', 'casa', 'gay', 'masajes', 'hetero'])
      .withMessage('Categoría inválida'),
    body('city').notEmpty().withMessage('La ciudad es requerida'),
    body('profileType')
      .optional()
      .isIn(['escort', 'sexo_gratis'])
      .withMessage('Tipo de perfil inválido'),
  ],
  profileController.createProfile
);

// Obtener perfil propio
router.get('/me', requireProfile, profileController.getMyProfile);

// Renovar listing Sexo gratis (gratis)
router.post('/renew-listing', requireProfile, profileController.renewFreeListing);

// Activar Premium Sexo gratis (3 meses) — también vía Stripe payment-intent
router.post('/sexo-gratis-premium', requireProfile, profileController.activateSexoGratisPremium);

// Actualizar perfil
router.put(
  '/',
  requireProfile,
  [
    // checkFalsy:true trata "" como "no enviado" y omite la validación
    body('title')
      .optional({ checkFalsy: true })
      .isLength({ max: 20 })
      .withMessage('El título debe tener máximo 20 caracteres'),
    body('age')
      .optional({ checkFalsy: true })
      .isInt({ min: 18, max: 99 })
      .withMessage('La edad debe estar entre 18 y 99 años'),
    body('profileType')
      .optional()
      .isIn(['escort', 'sexo_gratis'])
      .withMessage('Tipo de perfil inválido'),
  ],
  profileController.updateProfile
);

// Buscar perfiles (navegar)
router.get('/search', requireProfile, profileController.searchProfiles);

// Obtener perfil por ID
router.get('/:id', requireProfile, profileController.getProfileById);

// Actualizar ubicación
router.put('/location', requireProfile, profileController.updateLocation);

export default router;

