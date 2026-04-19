import { Router } from 'express';
import { authenticateAdminToken } from '../middleware/auth.middleware';
import * as adminController from '../controllers/admin.controller';
const router = Router();

// Login de admin (sin autenticación)
router.post('/login', adminController.login);

// Rutas protegidas con JWT
router.get('/profiles', authenticateAdminToken, adminController.getAllProfiles);
router.get('/reports', authenticateAdminToken, adminController.getAllReports);
router.get('/stats', authenticateAdminToken, adminController.getStats);

// Acciones de administración
router.delete('/users/:userId', authenticateAdminToken, adminController.deleteUser);
router.delete('/reports/:reportId', authenticateAdminToken, adminController.deleteReport);
router.post('/regenerate-fakes', authenticateAdminToken, adminController.regenerateFakeProfiles);
router.post('/delete-fakes', authenticateAdminToken, adminController.deleteFakeProfiles);
router.get('/export-emails', authenticateAdminToken, adminController.exportEmails);
router.post('/verify-user/:userId', authenticateAdminToken, adminController.verifyUserEmail);

export default router;
