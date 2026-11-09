import { Router } from 'express'
import * as mediaController from '../controllers/media.controller'
import * as mediaImport from '../controllers/mediaImport.controller'

const router = Router()

router.post('/import/cloudinary', mediaImport.startCloudinaryImport)
router.get('/import/status', mediaImport.cloudinaryImportStatus)

// GET /api/media/:id  (uuid)
router.get('/:id', mediaController.getMediaById)

export default router
