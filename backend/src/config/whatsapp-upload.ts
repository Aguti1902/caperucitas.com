import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { RequestHandler } from 'express';

const uploadDir = path.join(process.cwd(), 'uploads', 'whatsapp-campaigns');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export const whatsappImageUpload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg';
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExt}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (JPG, PNG, WEBP, GIF)'));
    }
  },
});

export function getWhatsAppCampaignImagePath(filename: string): string {
  return path.join(uploadDir, path.basename(filename));
}

const excelUploadDir = path.join(process.cwd(), 'uploads', 'whatsapp-imports');
if (!fs.existsSync(excelUploadDir)) {
  fs.mkdirSync(excelUploadDir, { recursive: true });
}

export const whatsappExcelUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const extOk = /\.(xlsx|xls|csv)$/i.test(file.originalname || '');
    const mimeOk =
      !file.mimetype ||
      file.mimetype === 'application/octet-stream' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/csv' ||
      file.mimetype === 'text/plain';
    if (extOk || mimeOk) cb(null, true);
    else cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls) o CSV'));
  },
});

export const handleWhatsAppExcelUpload: RequestHandler = (req, res, next) => {
  whatsappExcelUpload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const msg =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'El archivo es demasiado grande (máx. 15 MB)'
          : err.message;
      return res.status(400).json({ error: msg });
    }
    if (err) {
      return res.status(400).json({ error: err.message || 'Error al subir el archivo Excel' });
    }
    next();
  });
};
