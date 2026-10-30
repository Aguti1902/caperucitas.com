import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import * as globalChatController from '../controllers/globalChat.controller'
import { chatImageUpload } from '../config/chat-upload'

const router = Router()

const postLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados mensajes. Espera un momento.' },
})

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas subidas. Espera un momento.' },
})

router.get('/', globalChatController.listGlobalChat)
router.post('/', postLimiter, globalChatController.postGlobalChat)
router.post('/presence', globalChatController.presenceGlobalChat)
router.get('/dms', globalChatController.listDms)
router.post('/dms', postLimiter, globalChatController.postDm)
router.post('/react', postLimiter, globalChatController.reactMessage)
router.post('/delete', postLimiter, globalChatController.deleteMessage)
router.get('/unread', globalChatController.unreadCount)
router.post(
  '/upload',
  uploadLimiter,
  chatImageUpload.single('image'),
  globalChatController.uploadChatImage
)

export default router
