import { api } from '@/services/api'

const MAX_VISIBLE_PHOTOS = 7
const MAX_PUBLIC = 6

type ExistingPhoto = { type: string }

export async function uploadProfilePhotos(
  files: File[],
  existingPhotos: ExistingPhoto[] = []
): Promise<{ uploaded: number; errors: string[] }> {
  let hasCover = existingPhotos.some((p) => p.type === 'cover')
  let publicCount = existingPhotos.filter((p) => p.type === 'public').length
  let visibleCount = existingPhotos.filter((p) => p.type !== 'private').length

  const errors: string[] = []
  let uploaded = 0

  for (let i = 0; i < files.length; i++) {
    if (visibleCount >= MAX_VISIBLE_PHOTOS) {
      errors.push(`Solo puedes tener ${MAX_VISIBLE_PHOTOS} fotos (1 portada + 6 adicionales)`)
      break
    }

    const type: 'cover' | 'public' = !hasCover ? 'cover' : 'public'
    if (type === 'public' && publicCount >= MAX_PUBLIC) {
      errors.push(`Foto ${i + 1}: límite de fotos adicionales alcanzado`)
      continue
    }

    const fd = new FormData()
    fd.append('photo', files[i])
    fd.append('type', type)

    try {
      // No fijar Content-Type: axios debe añadir el boundary del multipart
      await api.post('/photos/upload', fd)
      uploaded++
      visibleCount++
      if (type === 'cover') hasCover = true
      else publicCount++
    } catch (err: any) {
      errors.push(err.response?.data?.error || `Error al subir la foto ${i + 1}`)
    }
  }

  return { uploaded, errors }
}
