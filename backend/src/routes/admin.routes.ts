import { Router } from 'express';
import { authenticateAdminToken } from '../middleware/auth.middleware';
import * as adminController from '../controllers/admin.controller';
import * as analyticsController from '../controllers/analytics.controller';
import * as whatsappController from '../controllers/whatsapp.controller';
import { whatsappImageUpload, handleWhatsAppExcelUpload } from '../config/whatsapp-upload';
const router = Router();

// Login de admin (sin autenticación)
router.post('/login', adminController.login);

// Rutas protegidas con JWT
router.get('/profiles', authenticateAdminToken, adminController.getAllProfiles);
router.get('/reports', authenticateAdminToken, adminController.getAllReports);
router.get('/stats', authenticateAdminToken, adminController.getStats);

// Google Analytics 4
router.get('/analytics', authenticateAdminToken, analyticsController.getAnalyticsDashboard);
router.get('/analytics/diagnostics', authenticateAdminToken, analyticsController.getAnalyticsDiagnostics);
router.get('/analytics/status', authenticateAdminToken, analyticsController.getAnalyticsStatus);

// WhatsApp / Evolution API
router.get('/whatsapp/stats', authenticateAdminToken, whatsappController.getWhatsAppStats);
router.get('/whatsapp/instances', authenticateAdminToken, whatsappController.getWhatsAppInstances);
router.get('/whatsapp/instance', authenticateAdminToken, whatsappController.getInstanceConnection);
router.get('/whatsapp/contacts', authenticateAdminToken, whatsappController.getContacts);
router.post('/whatsapp/contacts/import', authenticateAdminToken, whatsappController.importContacts);
router.post('/whatsapp/contacts/import-excel', authenticateAdminToken, handleWhatsAppExcelUpload, whatsappController.importContactsExcel);
router.get('/whatsapp/quota', authenticateAdminToken, whatsappController.getWhatsAppQuotaHandler);
router.patch('/whatsapp/quota', authenticateAdminToken, whatsappController.rechargeWhatsAppQuota);
router.post('/whatsapp/messages/reset', authenticateAdminToken, whatsappController.resetWhatsAppMessages);
router.post('/whatsapp/contacts/sync-profiles', authenticateAdminToken, whatsappController.syncProfileContacts);
router.get('/whatsapp/recipient-count', authenticateAdminToken, whatsappController.getRecipientCount);
router.delete('/whatsapp/contacts/:id', authenticateAdminToken, whatsappController.deleteContact);
router.get('/whatsapp/campaigns', authenticateAdminToken, whatsappController.getCampaigns);
router.get('/whatsapp/campaigns/:id', authenticateAdminToken, whatsappController.getCampaignById);
router.post('/whatsapp/campaigns/upload-image', authenticateAdminToken, whatsappImageUpload.single('image'), whatsappController.uploadCampaignImage);
router.post('/whatsapp/campaigns', authenticateAdminToken, whatsappController.createCampaign);
router.post('/whatsapp/campaigns/:id/cancel', authenticateAdminToken, whatsappController.cancelCampaign);
router.post('/whatsapp/campaigns/:id/resume', authenticateAdminToken, whatsappController.resumeCampaignHandler);
router.post('/whatsapp/test', authenticateAdminToken, whatsappController.sendTestMessage);
router.get('/whatsapp/setup/status', authenticateAdminToken, whatsappController.getSetupStatus);
router.post('/whatsapp/setup/create-instance', authenticateAdminToken, whatsappController.setupCreateInstance);
router.get('/whatsapp/setup/qrcode', authenticateAdminToken, whatsappController.setupGetQr);
router.post('/whatsapp/setup/restart', authenticateAdminToken, whatsappController.setupRestartInstance);
router.post('/whatsapp/setup/connect', authenticateAdminToken, whatsappController.setupConnect);
router.post('/whatsapp/setup/pairing-code', authenticateAdminToken, whatsappController.setupPairingCode);
router.get('/whatsapp/setup/diagnostics', authenticateAdminToken, whatsappController.getWhatsAppDiagnosticsHandler);

// Acciones de administración
router.delete('/users/:userId', authenticateAdminToken, adminController.deleteUser);
router.delete('/reports/:reportId', authenticateAdminToken, adminController.deleteReport);
router.post('/regenerate-fakes', authenticateAdminToken, adminController.regenerateFakeProfiles);
router.post('/delete-fakes', authenticateAdminToken, adminController.deleteFakeProfiles);
router.get('/export-emails', authenticateAdminToken, adminController.exportEmails);
router.post('/verify-user/:userId', authenticateAdminToken, adminController.verifyUserEmail);

export default router;
