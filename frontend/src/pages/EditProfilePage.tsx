import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import Input from '@/components/common/Input'
import Textarea from '@/components/common/Textarea'
import Button from '@/components/common/Button'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import Modal from '@/components/common/Modal'
import { detectLocation } from '@/utils/geolocation'
import CitySelector from '@/components/common/CitySelector'
import { Eye, Pause, Play } from 'lucide-react'

export default function EditProfilePage() {
  const navigate = useNavigate()
  const { refreshUserData, user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isPausing, setIsPausing] = useState(false)
  const [error, setError] = useState('')
  const [showPauseModal, setShowPauseModal] = useState(false)
  const [profilePaused, setProfilePaused] = useState(false)
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    aboutMe: '',
    lookingFor: '',
    age: '',
    gender: '',
    city: '',
    latitude: null as number | null,
    longitude: null as number | null,
    phone: '',
    whatsapp: '',
    height: '',
    bodyType: '',
    occupation: '',
    smoking: '',
    drinking: '',
    showExactLocation: true,
  })

  const [hobbies, setHobbies] = useState<string[]>([])
  const [languages, setLanguages] = useState<string[]>(['Español'])
  const [existingPhotos, setExistingPhotos] = useState<any[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [photoPreview, setPhotoPreview] = useState<string[]>([])

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const response = await api.get('/profile/me')
      const profile = response.data
      setProfilePaused(profile.isPaused || false)
      setFormData({
        title: profile.title || '',
        aboutMe: profile.aboutMe || '',
        lookingFor: profile.lookingFor || '',
        age: profile.age?.toString() || '',
        gender: profile.gender || profile.orientation || '',
        city: profile.city || '',
        latitude: profile.latitude ?? null,
        longitude: profile.longitude ?? null,
        phone: profile.phone || '',
        whatsapp: profile.whatsapp || '',
        height: profile.height?.toString() || '',
        bodyType: profile.bodyType || '',
        occupation: profile.occupation || '',
        smoking: profile.smoking || '',
        drinking: profile.drinking || '',
        showExactLocation: profile.showExactLocation !== undefined ? profile.showExactLocation : true,
      })
      setHobbies(profile.hobbies || [])
      setLanguages(profile.languages?.length ? profile.languages : ['Español'])
      setExistingPhotos(profile.photos || [])
    } catch {
      console.error('Error al cargar perfil')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const totalPhotos = existingPhotos.filter(p => p.type !== 'private').length
    if (selectedFiles.length + totalPhotos + files.length > 7) {
      alert('Máximo 7 fotos (1 portada + 6 adicionales)')
      return
    }
    setSelectedFiles(prev => [...prev, ...files])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => setPhotoPreview(prev => [...prev, reader.result as string])
      reader.readAsDataURL(file)
    })
  }

  const removeNewPhoto = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setPhotoPreview(prev => prev.filter((_, i) => i !== index))
  }

  const deleteExistingPhoto = async (photoId: string) => {
    try {
      await api.delete(`/photos/${photoId}`)
      setExistingPhotos(prev => prev.filter(p => p.id !== photoId))
    } catch {
      alert('Error al eliminar foto')
    }
  }

  const toggleLanguage = (lang: string) => {
    setLanguages(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang])
  }

  const handleUpdateLocation = async () => {
    setIsUpdatingLocation(true)
    try {
      const result = await detectLocation()
      await api.put('/profile/location', { city: result.city, latitude: result.latitude, longitude: result.longitude })
      setFormData(prev => ({ ...prev, city: result.city, latitude: result.latitude, longitude: result.longitude }))
      alert(`✓ Ubicación actualizada a ${result.city}`)
    } catch {
      alert('No se pudo obtener tu ubicación')
    } finally {
      setIsUpdatingLocation(false)
    }
  }

  const handleTogglePause = async () => {
    setIsPausing(true)
    try {
      if (profilePaused) {
        // Activar perfil
        await api.put('/profile', { ...formData, isPaused: false })
        setProfilePaused(false)
        setShowPauseModal(false)
        alert('✓ Tu perfil está activo y visible en los listados')
      } else {
        // Pausar perfil
        await api.put('/profile', { ...formData, isPaused: true })
        setProfilePaused(true)
        setShowPauseModal(false)
        alert('✓ Tu perfil está pausado. No aparecerás en los listados hasta que lo actives de nuevo.')
      }
      await refreshUserData()
    } catch {
      alert('Error al cambiar el estado del perfil')
    } finally {
      setIsPausing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.title.length > 20) { setError('El título debe tener máximo 20 caracteres'); return }
    const age = parseInt(formData.age)
    if (isNaN(age) || age < 18 || age > 99) { setError('La edad debe estar entre 18 y 99 años'); return }

    setIsSaving(true)
    try {
      await api.put('/profile', {
        ...formData,
        age,
        height: formData.height ? parseInt(formData.height) : null,
        hobbies,
        languages,
      })

      const coverExists = existingPhotos.some(p => p.type === 'cover')
      for (let i = 0; i < selectedFiles.length; i++) {
        const fd = new FormData()
        fd.append('photo', selectedFiles[i])
        fd.append('type', !coverExists && i === 0 ? 'cover' : 'public')
        try {
          await api.post('/photos/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        } catch (err) {
          console.error('Error subiendo foto:', err)
        }
      }

      await refreshUserData()
      navigate('/perfiles')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al actualizar perfil')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
      <h1 className="text-2xl font-bold text-white mb-6">Editar mi perfil</h1>

      {/* Estado del perfil */}
      <div className={`rounded-xl p-4 mb-4 border flex items-center justify-between ${
        profilePaused
          ? 'bg-orange-900/20 border-orange-700'
          : 'bg-green-900/20 border-green-700'
      }`}>
        <div>
          <p className={`font-semibold ${profilePaused ? 'text-orange-400' : 'text-green-400'}`}>
            {profilePaused ? '⏸ Perfil pausado' : '✓ Perfil activo'}
          </p>
          <p className="text-gray-400 text-xs mt-0.5">
            {profilePaused
              ? 'Tu perfil no aparece en los listados'
              : 'Tu perfil es visible para todos'}
          </p>
        </div>
        <button
          onClick={() => setShowPauseModal(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            profilePaused
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-orange-600 hover:bg-orange-700 text-white'
          }`}
        >
          {profilePaused ? <><Play className="w-4 h-4" /> Activar</> : <><Pause className="w-4 h-4" /> Pausar</>}
        </button>
      </div>

      {/* Toggle privacidad distancia */}
      <div className="rounded-xl p-4 mb-6 border border-gray-700 bg-gray-900 flex items-center justify-between">
        <div>
          <p className="font-semibold text-white text-sm">🔒 PRIVACIDAD</p>
          <p className="text-gray-400 text-xs mt-0.5">
            {formData.showExactLocation
              ? 'Los visitantes ven la distancia exacta a tu ubicación'
              : 'No saldrá la distancia exacta a tu ubicación'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormData(prev => ({ ...prev, showExactLocation: !prev.showExactLocation }))}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
            formData.showExactLocation
              ? 'bg-orange-600 hover:bg-orange-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {formData.showExactLocation ? 'ACTIVAR privacidad' : 'DESACTIVAR privacidad'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <Input
          label="Nombre / Alias (máx. 20 caracteres)"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          maxLength={20}
        />

        <Input
          label="Edad"
          type="number"
          value={formData.age}
          onChange={(e) => setFormData({ ...formData, age: e.target.value })}
          required
          min={18}
          max={99}
        />

        {/* Contacto */}
        <div className="bg-gray-800 rounded-xl p-4">
          <h3 className="text-white font-semibold mb-3">📞 Datos de contacto</h3>
          <div className="space-y-3">
            <Input
              label="Teléfono (para llamadas)"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+34 600 000 000"
            />
            <Input
              label="WhatsApp"
              type="tel"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              placeholder="+34 600 000 000"
            />
          </div>
        </div>

        <Textarea
          label="Descríbete"
          value={formData.aboutMe}
          onChange={(e) => setFormData({ ...formData, aboutMe: e.target.value })}
          required
          rows={4}
        />

        <Textarea
          label="Lo que ofrezco / Servicios"
          value={formData.lookingFor}
          onChange={(e) => setFormData({ ...formData, lookingFor: e.target.value })}
          required
          rows={4}
        />

        {/* Ciudad */}
        <div className="bg-gray-800 rounded-xl p-4">
          <h3 className="text-white font-semibold mb-3">📍 Ciudad</h3>
          <CitySelector
            value={formData.city}
            onChange={(city, lat, lng) =>
              setFormData(prev => ({ ...prev, city, latitude: lat, longitude: lng }))
            }
            onDetect={handleUpdateLocation}
            isDetecting={isUpdatingLocation}
          />
        </div>

        {/* FOTOS */}
        <div className="bg-gray-800 rounded-xl p-4">
          <label className="block text-sm font-medium text-white mb-3">
            📸 Fotos (máx. 7: 1 portada + 6 adicionales)
          </label>

          {existingPhotos.filter(p => p.type !== 'private').length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-2">Fotos actuales:</p>
              <div className="grid grid-cols-4 gap-2">
                {existingPhotos.filter(p => p.type !== 'private').map((photo) => (
                  <div key={photo.id} className="relative aspect-square">
                    <img src={photo.url} alt="Foto" className="w-full h-full object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => deleteExistingPhoto(photo.id)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                    <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                      {photo.type === 'cover' ? 'Portada' : 'Foto'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" id="photo-upload" />
          <label htmlFor="photo-upload" className="block w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg text-center cursor-pointer transition-colors text-sm">
            + Añadir más fotos
          </label>

          {photoPreview.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-3">
              {photoPreview.map((preview, index) => (
                <div key={index} className="relative aspect-square">
                  <img src={preview} alt={`Nueva ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
                  <button type="button" onClick={() => removeNewPhoto(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
                  <div className="absolute bottom-1 left-1 bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded">Nueva</div>
                </div>
              ))}
            </div>
          )}
        </div>


        {/* Idiomas */}
        <div className="bg-gray-800 rounded-xl p-4">
          <h3 className="text-white font-semibold mb-3">🌍 Idiomas</h3>
          <div className="flex flex-wrap gap-2">
            {['Español', 'Inglés', 'Catalán', 'Francés', 'Alemán', 'Italiano', 'Portugués', 'Árabe', 'Ruso'].map(lang => (
              <button
                key={lang}
                type="button"
                onClick={() => toggleLanguage(lang)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  languages.includes(lang) ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate('/perfiles')} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={isSaving} className="flex-1 bg-red-600 hover:bg-red-700 border-0">
            Guardar cambios
          </Button>
        </div>

        {/* Ver perfil */}
        <Button
          type="button"
          variant="outline"
          onClick={() => user?.profile?.id && navigate(`/profile/${user.profile.id}`)}
          fullWidth
          className="flex items-center justify-center gap-2"
        >
          <Eye className="w-5 h-5" />
          Ver mi perfil completo
        </Button>
      </form>

      {/* Modal pausar/activar */}
      <Modal
        isOpen={showPauseModal}
        onClose={() => setShowPauseModal(false)}
        title={profilePaused ? 'Activar perfil' : 'Pausar perfil'}
        maxWidth="sm"
      >
        <div className="space-y-4">
          {profilePaused ? (
            <>
              <div className="text-center text-4xl mb-2">▶️</div>
              <p className="text-gray-300 text-center">
                Al activar tu perfil, volverás a aparecer en los listados de búsqueda.
              </p>
            </>
          ) : (
            <>
              <div className="text-center text-4xl mb-2">⏸️</div>
              <p className="text-gray-300 text-center">
                Al pausar tu perfil, <strong>dejarás de aparecer</strong> en los listados. Puedes volver a activarlo cuando quieras.
              </p>
            </>
          )}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowPauseModal(false)} className="flex-1">
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleTogglePause}
              isLoading={isPausing}
              className={`flex-1 border-0 ${profilePaused ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}`}
            >
              {profilePaused ? 'Activar perfil' : 'Pausar perfil'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
