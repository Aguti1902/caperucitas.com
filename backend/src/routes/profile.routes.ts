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
      .isIn(['chica', 'chico', 'trans', 'casa', 'hetero', 'gay'])
      .withMessage('Categoría inválida'),
    body('city').notEmpty().withMessage('La ciudad es requerida'),
  ],
  profileController.createProfile
);

// Obtener perfil propio
router.get('/me', requireProfile, profileController.getMyProfile);

// Actualizar perfil
router.put(
  '/',
  requireProfile,
  [
    body('title')
      .optional()
      .isLength({ min: 1, max: 15 })
      .withMessage('El título debe tener entre 1 y 15 caracteres'),
    body('age')
      .optional()
      .isInt({ min: 18, max: 99 })
      .withMessage('La edad debe estar entre 18 y 99 años'),
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

