import { Router } from 'express';
import { authenticateToken, requireProfile } from '../middleware/auth.middleware';
import * as photoController from '../controllers/photo.controller';
import { upload } from '../config/cloudinary';

const router = Router();

router.use(authenticateToken);
router.use(requireProfile);

// Subir foto (disco local /uploads/profiles — Cloudinary deshabilitado)
router.post('/upload', upload.single('photo'), photoController.uploadPhoto);

// Eliminar foto
router.delete('/:id', photoController.deletePhoto);

// Obtener fotos del perfil
router.get('/profile/:profileId', photoController.getProfilePhotos);

export default router;

