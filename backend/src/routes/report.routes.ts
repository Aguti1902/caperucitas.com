import { Router } from 'express';
import { createReport, createPublicReport, getReportCount, checkIfReported } from '../controllers/report.controller';
import { authenticateToken, requireProfile } from '../middleware/auth.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limit para denuncias anónimas: max 5 por IP cada hora
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Demasiadas denuncias desde esta IP. Espera 1 hora.' },
});

// Crear denuncia pública (sin auth, por IP)
router.post('/public', reportLimiter, createPublicReport);

// Crear una denuncia (requiere perfil)
router.post('/', authenticateToken, requireProfile, createReport);

// Obtener número de denuncias de un perfil
router.get('/count/:profileId', getReportCount);

// Verificar si el usuario actual ya denunció un perfil (requiere perfil)
router.get('/check/:profileId', authenticateToken, requireProfile, checkIfReported);

export default router;

