import { Router } from 'express'
import * as mediaController from '../controllers/media.controller'

const router = Router()

// GET /api/media/:id  (uuid)
router.get('/:id', mediaController.getMediaById)

export default router
