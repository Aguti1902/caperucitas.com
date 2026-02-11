import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import Input from '@/components/common/Input'
import Textarea from '@/components/common/Textarea'
import Button from '@/components/common/Button'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import Modal from '@/components/common/Modal'
import { Eye, Trash2 } from 'lucide-react'

export default function EditProfilePage() {
  const navigate = useNavigate()
  const { refreshUserData, user, logout } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [userOrientation, setUserOrientation] = useState<string>('hetero')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    aboutMe: '',
    lookingFor: '',
    age: '',
    gender: '',
    role: '', // ROL solo para usuarios gay
    city: '',
    height: '',
    bodyType: '',
    relationshipStatus: '',
    relationshipGoal: '', // Nuevo campo
    occupation: '',
    smoking: '',
    drinking: '',
    children: '',
    pets: '',
    zodiacSign: '',
    education: '',
    showExactLocation: true, // Nuevo campo: mostrar ubicación exacta (por defecto SÍ)
  })
  
  const [hobbies, setHobbies] = useState<string[]>([])
  const [languages, setLanguages] = useState<string[]>([])
  const [existingPhotos, setExistingPhotos] = useState<any[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [photoPreview, setPhotoPreview] = useState<string[]>([])
  const [selectedPrivateFiles, setSelectedPrivateFiles] = useState<File[]>([])
  const [privatePhotoPreview, setPrivatePhotoPreview] = useState<string[]>([])

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const response = await api.get('/profile/me')
      const profile = response.data
      setUserOrientation(profile.orientation || 'hetero')
      setFormData({
        title: profile.title,
        aboutMe: profile.aboutMe,
        lookingFor: profile.lookingFor,
        age: profile.age.toString(),
        gender: profile.gender || '',
        role: profile.role || '', // ROL solo para usuarios gay
        city: profile.city,
        height: profile.height?.toString() || '',
        bodyType: profile.bodyType || '',
        relationshipStatus: profile.relationshipStatus || '',
        relationshipGoal: profile.relationshipGoal || '', // Nuevo campo
        occupation: profile.occupation || '',
        smoking: profile.smoking || '',
        drinking: profile.drinking || '',
        children: profile.children || '',
        pets: profile.pets || '',
        zodiacSign: profile.zodiacSign || '',
        education: profile.education || '',
        showExactLocation: profile.showExactLocation !== undefined ? profile.showExactLocation : true, // Por defecto true
      })
      setHobbies(profile.hobbies || [])
      setLanguages(profile.languages || [])
      setExistingPhotos(profile.photos || [])
    } catch (error) {
      console.error('Error al cargar perfil:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const coverCount = existingPhotos.filter(p => p.type === 'cover').length
    const publicCount = existingPhotos.filter(p => p.type === 'public').length
    const maxPublic = coverCount > 0 ? 3 : 2 // Si hay portada, máximo 3 públicas
    
    if (selectedFiles.length + publicCount >= maxPublic) {
      alert(`Máximo ${maxPublic} fotos públicas (incluyendo portada)`)
      return
    }
    
    setSelectedFiles([...selectedFiles, ...files])
    
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const handlePrivateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const privateCount = existingPhotos.filter(p => p.type === 'private').length
    
    if (selectedPrivateFiles.length + privateCount >= 4) {
      alert('Máximo 4 fotos privadas')
      return
    }
    
    setSelectedPrivateFiles([...selectedPrivateFiles, ...files])
    
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPrivatePhotoPreview(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeNewPhoto = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setPhotoPreview(prev => prev.filter((_, i) => i !== index))
  }

  const removeNewPrivatePhoto = (index: number) => {
    setSelectedPrivateFiles(prev => prev.filter((_, i) => i !== index))
    setPrivatePhotoPreview(prev => prev.filter((_, i) => i !== index))
  }

  const deleteExistingPhoto = async (photoId: string) => {
    try {
      await api.delete(`/photos/${photoId}`)
      setExistingPhotos(prev => prev.filter(p => p.id !== photoId))
    } catch (err) {
      alert('Error al eliminar foto')
    }
  }

  const toggleHobby = (hobby: string) => {
    setHobbies(prev => 
      prev.includes(hobby) 
        ? prev.filter(h => h !== hobby)
        : [...prev, hobby]
    )
  }

  const toggleLanguage = (language: string) => {
    setLanguages(prev => 
      prev.includes(language) 
        ? prev.filter(l => l !== language)
        : [...prev, language]
    )
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'ELIMINAR') {
      setError('Debes escribir "ELIMINAR" para confirmar')
      return
    }

    setIsDeleting(true)

    try {
      await api.delete('/auth/delete-account')
      
      // Cerrar sesión y redirigir
      await logout()
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al eliminar la cuenta')
      setIsDeleting(false)
    }
  }

  const handleViewProfile = () => {
    // Redirigir a la vista del propio perfil como si fuera otro usuario
    if (user?.profile?.id) {
      navigate(`/app/profile/${user.profile.id}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.title.length > 15) {
      setError('El título debe tener máximo 15 caracteres')
      return
    }

    const age = parseInt(formData.age)
    if (age < 18 || age > 99) {
      setError('La edad debe estar entre 18 y 99 años')
      return
    }

    if (!formData.gender) {
      setError('Debes seleccionar tu género')
      return
    }

    setIsSaving(true)

    try {
      // Actualizar perfil
      await api.put('/profile', {
        ...formData,
        age,
        height: formData.height ? parseInt(formData.height) : null,
        hobbies,
        languages,
        relationshipGoal: formData.relationshipGoal, // Nuevo campo
      })

      // Subir nuevas fotos públicas
      for (let i = 0; i < selectedFiles.length; i++) {
        const photoFormData = new FormData()
        photoFormData.append('photo', selectedFiles[i])
        
        // Determinar tipo según fotos existentes
        const coverExists = existingPhotos.some(p => p.type === 'cover')
        
        let type = 'public'
        if (!coverExists && i === 0) {
          type = 'cover'
        } else {
          type = 'public'
        }
        
        console.log(`📸 Subiendo foto pública ${i+1}/${selectedFiles.length} como tipo: ${type}`)
        photoFormData.append('type', type)
        
        try {
          const response = await api.post('/photos/upload', photoFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          console.log(`✅ Foto pública ${i+1} subida correctamente:`, response.data)
        } catch (photoErr: any) {
          console.error('❌ Error subiendo foto pública:', photoErr)
          console.error('Respuesta error:', photoErr.response?.data)
        }
      }

      // Subir nuevas fotos privadas
      for (let i = 0; i < selectedPrivateFiles.length; i++) {
        const photoFormData = new FormData()
        photoFormData.append('photo', selectedPrivateFiles[i])
        photoFormData.append('type', 'private') // ASEGURAR que siempre sea 'private'
        
        console.log(`🔒 Subiendo foto PRIVADA ${i+1}/${selectedPrivateFiles.length}`)
        
        try {
          const response = await api.post('/photos/upload', photoFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          console.log(`✅ Foto PRIVADA ${i+1} subida correctamente:`, response.data)
          
          // Verificar que se guardó como privada
          if (response.data.photo?.type !== 'private') {
            console.error(`⚠️ ALERTA: La foto se guardó como '${response.data.photo?.type}' en vez de 'private'`)
          }
        } catch (photoErr: any) {
          console.error('❌ Error subiendo foto privada:', photoErr)
          console.error('Respuesta error:', photoErr.response?.data)
        }
      }

      await refreshUserData()
      navigate('/app', { replace: false }) // No reemplazar historial, mantener scroll
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al actualizar perfil')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-6">Editar perfil</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <Input
          label="Título del perfil (máx. 15 caracteres)"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          maxLength={15}
        />

        <Textarea
          label="Descríbete"
          value={formData.aboutMe}
          onChange={(e) => setFormData({ ...formData, aboutMe: e.target.value })}
          required
          rows={4}
        />

        <Textarea
          label="Lo que buscas"
          value={formData.lookingFor}
          onChange={(e) => setFormData({ ...formData, lookingFor: e.target.value })}
          required
          rows={4}
        />

        <Input
          label="Edad (18-99 años)"
          type="number"
          value={formData.age}
          onChange={(e) => setFormData({ ...formData, age: e.target.value })}
          required
          min={18}
          max={99}
        />

        {/* FOTOS PÚBLICAS */}
        <div className="bg-gray-800 rounded-lg p-4">
          <label className="block text-sm font-medium text-white mb-3">
            📸 Fotos Públicas (Portada + hasta 3 públicas)
          </label>
          
          {/* Fotos públicas existentes */}
          {existingPhotos.filter(p => p.type === 'cover' || p.type === 'public').length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">Fotos públicas actuales:</p>
              <div className="grid grid-cols-4 gap-2">
                {existingPhotos
                  .filter(p => p.type === 'cover' || p.type === 'public')
                  .map((photo) => (
                    <div key={photo.id} className="relative aspect-square">
                      <img
                        src={photo.url}
                        alt="Foto perfil"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => deleteExistingPhoto(photo.id)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                      <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-xs px-2 py-0.5 rounded">
                        {photo.type === 'cover' ? 'Portada' : 'Pública'}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Añadir fotos públicas */}
          <div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="photo-upload"
            />
            <label
              htmlFor="photo-upload"
              className="block w-full bg-primary hover:opacity-90 text-white font-semibold py-3 px-6 rounded-lg text-center cursor-pointer transition-opacity"
            >
              + Añadir Fotos Públicas
            </label>
          </div>

          {photoPreview.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-3">
              {photoPreview.map((preview, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={preview}
                    alt={`Nueva ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewPhoto(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                  <div className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded">
                    Nueva
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOTOS PRIVADAS - OCULTO TEMPORALMENTE PARA VERIFICACIÓN DE GOOGLE ADS */}
        {false && (
        <div className="bg-gray-800 rounded-lg p-4 border-2 border-primary/30">
          <label className="block text-sm font-medium text-white mb-3">
            🔒 Fotos Privadas (Máximo 4 - Solo visibles si das permiso)
          </label>
          
          {/* Fotos privadas existentes */}
          {existingPhotos.filter(p => p.type === 'private').length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">
                Fotos privadas actuales ({existingPhotos.filter(p => p.type === 'private').length}/4):
              </p>
              <div className="grid grid-cols-4 gap-2">
                {existingPhotos
                  .filter(p => p.type === 'private')
                  .map((photo) => (
                    <div key={photo.id} className="relative aspect-square">
                      <img
                        src={photo.url}
                        alt="Foto privada"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => deleteExistingPhoto(photo.id)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                      <div className="absolute bottom-1 left-1 bg-primary bg-opacity-90 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                        🔒 Privada
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Añadir fotos privadas */}
          <div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePrivateFileChange}
              className="hidden"
              id="private-photo-upload"
              disabled={existingPhotos.filter(p => p.type === 'private').length >= 4}
            />
            <label
              htmlFor="private-photo-upload"
              className={`block w-full font-semibold py-3 px-6 rounded-lg text-center cursor-pointer transition-opacity ${
                existingPhotos.filter(p => p.type === 'private').length >= 4
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-primary/80 hover:opacity-90 text-white'
              }`}
            >
              + Añadir Fotos Privadas ({existingPhotos.filter(p => p.type === 'private').length}/4)
            </label>
            {existingPhotos.filter(p => p.type === 'private').length >= 4 && (
              <p className="text-xs text-gray-400 mt-2 text-center">
                Has alcanzado el límite de 4 fotos privadas
              </p>
            )}
          </div>

          {privatePhotoPreview.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-3">
              {privatePhotoPreview.map((preview, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={preview}
                    alt={`Nueva privada ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewPrivatePhoto(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                  <div className="absolute bottom-1 left-1 bg-primary text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                    🔒 Nueva
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-400 mt-3">
            💡 Las fotos privadas solo serán visibles para otros usuarios si les das permiso explícito
          </p>
        </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Altura (cm)"
            type="number"
            value={formData.height}
            onChange={(e) => setFormData({ ...formData, height: e.target.value })}
            placeholder="Ej: 175"
          />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tipo de cuerpo
            </label>
            <select
              value={formData.bodyType}
              onChange={(e) => setFormData({ ...formData, bodyType: e.target.value })}
              className="input-field"
            >
              <option value="">Seleccionar...</option>
              <option value="delgado">Delgado</option>
              <option value="atletico">Atlético</option>
              <option value="promedio">Promedio</option>
              <option value="robusto">Robusto</option>
              <option value="musculoso">Musculoso</option>
            </select>
          </div>
        </div>

        <Input
          label="Profesión / Trabajo"
          type="text"
          value={formData.occupation}
          onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
          placeholder="Ej: Ingeniero, Diseñador, Estudiante..."
        />

        {/* Tipo de relación que busca - DESPLEGABLE DESTACADO EN SU PROPIA SECCIÓN */}
        <div className="bg-gradient-to-br from-pink-500/30 via-purple-500/30 to-red-500/30 rounded-2xl p-6 border-2 border-pink-500 shadow-xl">
          <label className="block text-xl font-bold text-white mb-4 text-center flex items-center justify-center gap-2">
            <span>¿Qué tipo de relación buscas?</span>
            <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.relationshipGoal}
            onChange={(e) => setFormData({ ...formData, relationshipGoal: e.target.value })}
            className="w-full bg-gray-900 text-white border-2 border-pink-500 rounded-xl px-6 py-4 text-lg font-semibold focus:outline-none focus:ring-4 focus:ring-pink-500/50 focus:border-pink-400 transition-all cursor-pointer"
            required
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 1rem center',
              backgroundSize: '1.5rem',
              paddingRight: '3rem',
            }}
          >
            <option value="" disabled>Selecciona una opción...</option>
            <option value="amistad">👥 Amistad</option>
            <option value="relacion_seria">❤️ Relación seria</option>
            <option value="encuentros_casuales">🔥 Encuentros casuales</option>
          </select>
          <p className="text-center text-sm text-gray-300 mt-3">
            ✨ Esto ayudará a otros usuarios a saber qué buscas
          </p>
        </div>

        {/* Selector de ROL - Solo para usuarios GAY */}
        {userOrientation === 'gay' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              ROL *
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'activo' })}
                className={`py-4 px-6 rounded-xl font-semibold text-lg transition-all ${
                  formData.role === 'activo'
                    ? 'bg-green-500 text-white shadow-lg scale-105'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-2 border-gray-700'
                }`}
              >
                🔵 Activo
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'pasivo' })}
                className={`py-4 px-6 rounded-xl font-semibold text-lg transition-all ${
                  formData.role === 'pasivo'
                    ? 'bg-blue-500 text-white shadow-lg scale-105'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-2 border-gray-700'
                }`}
              >
                🔴 Pasivo
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'versatil' })}
                className={`py-4 px-6 rounded-xl font-semibold text-lg transition-all ${
                  formData.role === 'versatil'
                    ? 'bg-purple-500 text-white shadow-lg scale-105'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-2 border-gray-700'
                }`}
              >
                ⚪ Versátil
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Estado
            </label>
            <select
              value={formData.relationshipStatus}
              onChange={(e) => setFormData({ ...formData, relationshipStatus: e.target.value })}
              className="input-field"
            >
              <option value="">-</option>
              <option value="soltero">Soltero</option>
              <option value="complicado">Complicado</option>
              <option value="abierto">Relación abierta</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Fumar
            </label>
            <select
              value={formData.smoking}
              onChange={(e) => setFormData({ ...formData, smoking: e.target.value })}
              className="input-field"
            >
              <option value="">-</option>
              <option value="no">No</option>
              <option value="ocasional">Ocasional</option>
              <option value="regular">Sí</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Beber
            </label>
            <select
              value={formData.drinking}
              onChange={(e) => setFormData({ ...formData, drinking: e.target.value })}
              className="input-field"
            >
              <option value="">-</option>
              <option value="no">No</option>
              <option value="social">Social</option>
              <option value="regular">Regular</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              ¿Tienes hijos?
            </label>
            <select
              value={formData.children || ''}
              onChange={(e) => setFormData({ ...formData, children: e.target.value })}
              className="input-field"
            >
              <option value="">-</option>
              <option value="no">No</option>
              <option value="si_vivo">Sí, viven conmigo</option>
              <option value="si_no_vivo">Sí, no viven conmigo</option>
              <option value="quiero">No, pero quiero</option>
            </select>
          </div>

          <Input
            label="Mascotas"
            type="text"
            value={formData.pets || ''}
            onChange={(e) => setFormData({ ...formData, pets: e.target.value })}
            placeholder="Ej: Perro, Gato, Ninguna..."
          />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Signo zodiacal
            </label>
            <select
              value={formData.zodiacSign || ''}
              onChange={(e) => setFormData({ ...formData, zodiacSign: e.target.value })}
              className="input-field"
            >
              <option value="">-</option>
              <option value="aries">♈ Aries</option>
              <option value="tauro">♉ Tauro</option>
              <option value="geminis">♊ Géminis</option>
              <option value="cancer">♋ Cáncer</option>
              <option value="leo">♌ Leo</option>
              <option value="virgo">♍ Virgo</option>
              <option value="libra">♎ Libra</option>
              <option value="escorpio">♏ Escorpio</option>
              <option value="sagitario">♐ Sagitario</option>
              <option value="capricornio">♑ Capricornio</option>
              <option value="acuario">♒ Acuario</option>
              <option value="piscis">♓ Piscis</option>
            </select>
          </div>
        </div>

        {/* PRIVACIDAD: Mostrar ubicación exacta */}
        <div className="bg-gray-800 rounded-lg p-4 border-2 border-gray-700">
          <label className="block text-sm font-medium text-white mb-3">
            🔒 Privacidad de ubicación
          </label>
          <div className="space-y-3">
            <p className="text-sm text-gray-400">
              ¿Quieres que otros usuarios vean tu ubicación exacta (ciudad y distancia)?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, showExactLocation: true })}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                  formData.showExactLocation
                    ? 'bg-primary text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                ✅ Sí, mostrar ubicación
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, showExactLocation: false })}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                  !formData.showExactLocation
                    ? 'bg-primary text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                🔒 No, ocultar ubicación
              </button>
            </div>
            <p className="text-xs text-gray-500">
              {formData.showExactLocation 
                ? '✅ Tu ciudad y distancia serán visibles para otros usuarios (excepto usuarios gratis que no pueden verlo)' 
                : '🔒 Tu ubicación estará oculta. Solo se mostrará tu país o región general'}
            </p>
          </div>
        </div>

        {/* Hobbies */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">🎯 Hobbies e Intereses</h3>
          <div className="flex flex-wrap gap-2">
            {['Deportes', 'Gym', 'Viajar', 'Cine', 'Series', 'Música', 'Leer', 'Cocinar', 'Videojuegos', 
              'Fotografía', 'Arte', 'Bailar', 'Senderismo', 'Playa', 'Montaña', 'Yoga', 'Mascotas', 
              'Tecnología', 'Moda', 'Gastronomía'].map(hobby => (
              <button
                key={hobby}
                type="button"
                onClick={() => toggleHobby(hobby)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  hobbies.includes(hobby)
                    ? 'bg-primary text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {hobby}
              </button>
            ))}
          </div>
        </div>

        {/* Idiomas */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">🌍 Idiomas</h3>
          <div className="flex flex-wrap gap-2">
            {['Español', 'Inglés', 'Catalán', 'Francés', 'Alemán', 'Italiano', 'Portugués', 
              'Árabe', 'Chino', 'Ruso'].map(language => (
              <button
                key={language}
                type="button"
                onClick={() => toggleLanguage(language)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  languages.includes(language)
                    ? 'bg-secondary text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {language}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/app')}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSaving}
            className="flex-1"
          >
            Guardar cambios
          </Button>
        </div>

        {/* Botón para ver perfil completo */}
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleViewProfile}
            fullWidth
            className="flex items-center justify-center gap-2"
          >
            <Eye className="w-5 h-5" />
            Ver mi perfil completo
          </Button>
        </div>

        {/* Sección de eliminar cuenta */}
        <div className="mt-8 pt-8 border-t border-gray-700">
          <div className="bg-red-900 bg-opacity-20 border border-red-500 rounded-lg p-6">
            <h3 className="text-red-500 font-bold text-lg mb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Zona de Peligro
            </h3>
            <p className="text-gray-300 text-sm mb-4">
              Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor, estate seguro.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteModal(true)}
              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar mi cuenta
            </Button>
          </div>
        </div>
      </form>

      {/* Modal de confirmación de eliminación */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeleteConfirmText('')
          setError('')
        }}
        title="¿Estás seguro de eliminar tu cuenta?"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="bg-red-900 bg-opacity-20 border border-red-500 rounded-lg p-4">
            <p className="text-red-500 font-semibold mb-2">⚠️ Esta acción es irreversible</p>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• Se eliminarán todos tus datos personales</li>
              <li>• Se eliminarán todas tus fotos</li>
              <li>• Se eliminarán todos tus mensajes</li>
              <li>• Se cancelará tu suscripción si tienes una activa</li>
              <li>• Perderás todos tus matches y likes</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Para confirmar, escribe <span className="text-red-500 font-bold">ELIMINAR</span> en el campo de abajo:
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Escribe ELIMINAR"
              className="input-field"
            />
          </div>

          {error && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false)
                setDeleteConfirmText('')
                setError('')
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleDeleteAccount}
              isLoading={isDeleting}
              disabled={deleteConfirmText !== 'ELIMINAR'}
              className="flex-1 bg-red-500 hover:bg-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar cuenta
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

