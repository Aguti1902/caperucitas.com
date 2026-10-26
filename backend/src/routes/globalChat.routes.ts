import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import * as globalChatController from '../controllers/globalChat.controller'

const router = Router()

const postLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados mensajes. Espera un momento.' },
})

router.get('/', globalChatController.listGlobalChat)
router.post('/', postLimiter, globalChatController.postGlobalChat)

export default router
