import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateToken, requireProfile } from '../middleware/auth.middleware';
import * as messageController from '../controllers/message.controller';

const router = Router();

const guestMessageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados mensajes. Espera un rato e inténtalo de nuevo.' },
});

// Público: mensaje sin cuenta
router.post('/guest', guestMessageLimiter, messageController.sendGuestContactMessage);

router.use(authenticateToken);
router.use(requireProfile);

router.post('/', messageController.sendMessage);
router.get('/conversations', messageController.getConversations);
router.get('/unread-count', messageController.getUnreadCount);
router.get('/guest-inbox', messageController.getGuestContactInbox);
router.put('/guest-inbox/read', messageController.markGuestContactRead);
router.delete('/guest/:id', messageController.deleteGuestContactMessage);
router.get('/:profileId', messageController.getMessages);
router.put('/:profileId/read', messageController.markAsRead);
router.delete('/:profileId', messageController.deleteConversation);

export default router;
