/**
 * Subida de fotos de perfil.
 * Cloudinary (dmrdydsjv) está DESHABILITADO → usamos disco local /uploads/profiles
 * servido por Express. Las URLs se guardan absolutas al backend de Railway.
 */
export { profileImageUpload as upload } from './local-upload'
export { getPublicBaseUrl, localFilePublicUrl, tryDeleteLocalUpload } from './local-upload'
