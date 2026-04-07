import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import Logo from '@/components/common/Logo'
import Input from '@/components/common/Input'
import Textarea from '@/components/common/Textarea'
import Button from '@/components/common/Button'

const SPANISH_CITIES = [
  { name: 'Madrid', lat: 40.4168, lng: -3.7038 },
  { name: 'Barcelona', lat: 41.3851, lng: 2.1734 },
  { name: 'Valencia', lat: 39.4699, lng: -0.3763 },
  { name: 'Sevilla', lat: 37.3891, lng: -5.9845 },
  { name: 'Zaragoza', lat: 41.6488, lng: -0.8891 },
  { name: 'Málaga', lat: 36.7213, lng: -4.4214 },
  { name: 'Murcia', lat: 37.9922, lng: -1.1307 },
  { name: 'Palma', lat: 39.5696, lng: 2.6502 },
  { name: 'Las Palmas', lat: 28.1248, lng: -15.43 },
  { name: 'Bilbao', lat: 43.263, lng: -2.935 },
  { name: 'Alicante', lat: 38.3452, lng: -0.481 },
  { name: 'Córdoba', lat: 37.8882, lng: -4.7794 },
  { name: 'Valladolid', lat: 41.6523, lng: -4.7245 },
  { name: 'Vigo', lat: 42.2406, lng: -8.7207 },
  { name: 'Gijón', lat: 43.545, lng: -5.6619 },
  { name: 'A Coruña', lat: 43.3623, lng: -8.4115 },
  { name: 'Granada', lat: 37.1773, lng: -3.5986 },
  { name: 'Vitoria', lat: 42.8467, lng: -2.6716 },
  { name: 'Oviedo', lat: 43.3614, lng: -5.8593 },
  { name: 'Santa Cruz de Tenerife', lat: 28.4698, lng: -16.2549 },
  { name: 'Cartagena', lat: 37.6256, lng: -0.996 },
  { name: 'Pamplona', lat: 42.8125, lng: -1.6458 },
  { name: 'Figueres', lat: 42.2679, lng: 2.9616 },
]

const GENDER_OPTIONS = [
  { id: 'chica', label: '👩 Chica', color: 'bg-pink-500' },
  { id: 'chico', label: '👨 Chico', color: 'bg-blue-500' },
  { id: 'trans', label: '🏳️‍⚧️ Trans', color: 'bg-purple-500' },
  { id: 'casa', label: '🏠 Casa / Piso', color: 'bg-orange-500' },
]

export default function CreateProfilePage() {
  const navigate = useNavigate()
  const { refreshUserData } = useAuthStore()

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
    smoking: 'no',
    drinking: 'social',
    showExactLocation: true,
  })

  const [hobbies, setHobbies] = useState<string[]>([])
  const [languages, setLanguages] = useState<string[]>(['Español'])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<Array<{ file: File; type: 'cover' | 'public' }>>([])
  const [photoPreview, setPhotoPreview] = useState<Array<{ url: string; type: 'cover' | 'public' }>>([])
  const [isDetectingLocation, setIsDetectingLocation] = useState(true)
  const [locationError, setLocationError] = useState('')

  useEffect(() => {
    const savedGender = localStorage.getItem('userGender')
    if (savedGender) {
      setFormData(prev => ({ ...prev, gender: savedGender }))
      localStorage.removeItem('userGender')
    }
    handleDetectLocation()
  }, [])

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Tu navegador no soporta geolocalización.')
      setIsDetectingLocation(false)
      return
    }
    setIsDetectingLocation(true)
    setLocationError('')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=es`,
            { headers: { 'User-Agent': 'caperucitas.com/1.0' } }
          )
          if (response.ok) {
            const data = await response.json()
            const address = data.address
            let cityName = address.city || address.town || address.municipality || address.village || address.county

            if (cityName) {
              cityName = cityName.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
            }

            if (!cityName || !SPANISH_CITIES.find(c => c.name.toLowerCase() === cityName.toLowerCase())) {
              let closest = SPANISH_CITIES[0]
              let minDist = Infinity
              SPANISH_CITIES.forEach(city => {
                const d = Math.sqrt(Math.pow(city.lat - latitude, 2) + Math.pow(city.lng - longitude, 2))
                if (d < minDist) { minDist = d; closest = city }
              })
              cityName = closest.name
            }

            setFormData(prev => ({ ...prev, city: cityName, latitude, longitude }))
          }
        } catch {
          const closest = SPANISH_CITIES.reduce((prev, city) => {
            const d = Math.sqrt(Math.pow(city.lat - latitude, 2) + Math.pow(city.lng - longitude, 2))
            const pd = Math.sqrt(Math.pow(prev.lat - latitude, 2) + Math.pow(prev.lng - longitude, 2))
            return d < pd ? city : prev
          })
          setFormData(prev => ({ ...prev, city: closest.name, latitude, longitude }))
        }
        setIsDetectingLocation(false)
      },
      () => {
        setLocationError('No se pudo obtener tu ubicación. Selecciona tu ciudad manualmente.')
        setIsDetectingLocation(false)
        setFormData(prev => ({ ...prev, city: 'Madrid', latitude: 40.4168, longitude: -3.7038 }))
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
    )
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const existingCount = selectedFiles.length
    // Máximo 7 fotos (1 portada + 6 públicas)
    if (existingCount + files.length > 7) {
      setError('Máximo 7 fotos (1 portada + 6 adicionales)')
      return
    }
    const newFiles = files.map((file, i) => {
      const coverExists = selectedFiles.some(f => f.type === 'cover') || existingCount > 0
      const type: 'cover' | 'public' = !coverExists && i === 0 ? 'cover' : 'public'
      return { file, type }
    })
    setSelectedFiles(prev => [...prev, ...newFiles])
    files.forEach((file, i) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(prev => [...prev, { url: reader.result as string, type: newFiles[i].type }])
      }
      reader.readAsDataURL(file)
    })
  }

  const removePhoto = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setPhotoPreview(prev => prev.filter((_, i) => i !== index))
  }

  const toggleHobby = (hobby: string) => {
    setHobbies(prev => prev.includes(hobby) ? prev.filter(h => h !== hobby) : [...prev, hobby])
  }

  const toggleLanguage = (lang: string) => {
    setLanguages(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.gender) { setError('Debes seleccionar tu categoría'); return }
    if (formData.title.length > 20) { setError('El título debe tener máximo 20 caracteres'); return }

    const age = parseInt(formData.age)
    if (isNaN(age) || age < 18 || age > 99) { setError('La edad debe estar entre 18 y 99 años'); return }
    if (!formData.phone && !formData.whatsapp) { setError('Debes añadir al menos un teléfono o WhatsApp de contacto'); return }
    if (selectedFiles.length === 0) { setError('Debes subir al menos 1 foto de portada'); return }

    setIsLoading(true)
    try {
      await api.post('/profile', {
        ...formData,
        age,
        height: formData.height ? parseInt(formData.height) : null,
        hobbies,
        languages,
        orientation: formData.gender, // compatibilidad con backend
      })

      for (let i = 0; i < selectedFiles.length; i++) {
        const photoData = selectedFiles[i]
        const fd = new FormData()
        fd.append('photo', photoData.file)
        fd.append('type', photoData.type)
        try {
          await api.post('/photos/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        } catch (err) {
          console.error(`Error subiendo foto ${i + 1}:`, err)
        }
      }

      await refreshUserData()
      sessionStorage.setItem('justRegistered', 'true')
      navigate('/app')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear perfil')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4 pb-32">
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="text-center">
          <Logo size="md" className="mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white">Completa tu anuncio</h2>
          <p className="text-gray-400 mt-2 text-sm">
            Cuéntanos sobre ti para aparecer en los resultados
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Categoría *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {GENDER_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: opt.id })}
                  className={`py-4 px-4 rounded-xl font-semibold text-base transition-all ${
                    formData.gender === opt.id
                      ? `${opt.color} text-white shadow-lg scale-105`
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-2 border-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Nombre / Alias (máx. 20 caracteres)"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            maxLength={20}
            placeholder="Ej: Sofía, Ana, Club Venus..."
          />

          <Input
            label="Edad (18-99 años)"
            type="number"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            required
            min={18}
            max={99}
            placeholder="Tu edad"
          />

          {/* Contacto - OBLIGATORIO */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h3 className="text-white font-semibold mb-3">📞 Datos de contacto *</h3>
            <p className="text-gray-400 text-xs mb-3">
              Al menos uno es obligatorio. Aparecerán como botones en tu perfil.
            </p>
            <div className="space-y-3">
              <Input
                label="Teléfono (para llamadas)"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Ej: +34 600 000 000"
              />
              <Input
                label="WhatsApp (puede ser el mismo)"
                type="tel"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                placeholder="Ej: +34 600 000 000"
              />
            </div>
          </div>

          <Textarea
            label="Descríbete"
            value={formData.aboutMe}
            onChange={(e) => setFormData({ ...formData, aboutMe: e.target.value })}
            required
            rows={4}
            placeholder="Cuéntanos sobre ti, tu físico, tu personalidad..."
          />

          <Textarea
            label="Lo que ofrezco / Servicios"
            value={formData.lookingFor}
            onChange={(e) => setFormData({ ...formData, lookingFor: e.target.value })}
            required
            rows={4}
            placeholder="Describe tus servicios, lo que ofreces, tus tarifas si quieres..."
          />

          {/* Ubicación */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              📍 Ciudad
            </label>
            {isDetectingLocation ? (
              <div className="bg-gray-800 rounded-lg px-4 py-3 flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"></div>
                <span className="text-gray-300">Detectando tu ubicación...</span>
              </div>
            ) : (
              <div>
                {locationError && (
                  <p className="text-yellow-400 text-xs mb-2">{locationError}</p>
                )}
                <div className="flex gap-2">
                  <select
                    value={formData.city}
                    onChange={(e) => {
                      const city = SPANISH_CITIES.find(c => c.name === e.target.value)
                      setFormData(prev => ({
                        ...prev,
                        city: e.target.value,
                        latitude: city?.lat || null,
                        longitude: city?.lng || null,
                      }))
                    }}
                    className="flex-1 input-field"
                  >
                    <option value="">Selecciona tu ciudad...</option>
                    {SPANISH_CITIES.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-3 rounded-lg text-sm transition-colors"
                    title="Detectar automáticamente"
                  >
                    📍
                  </button>
                </div>
                {formData.city && (
                  <p className="text-green-400 text-xs mt-1">✓ Ciudad: {formData.city}</p>
                )}
              </div>
            )}
          </div>

          {/* FOTOS PÚBLICAS */}
          <div className="bg-gray-800 rounded-xl p-4">
            <label className="block text-sm font-medium text-white mb-3">
              📸 Fotos (1 portada + hasta 6 adicionales)
            </label>
            <div className="mb-3">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="photo-upload-public"
              />
              <label
                htmlFor="photo-upload-public"
                className="block w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg text-center cursor-pointer transition-colors"
              >
                + Añadir Fotos
              </label>
            </div>
            {photoPreview.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {photoPreview.map((preview, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={preview.url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                    <div className={`absolute bottom-1 left-1 text-white text-[10px] px-1.5 py-0.5 rounded ${preview.type === 'cover' ? 'bg-red-600' : 'bg-gray-600'}`}>
                      {preview.type === 'cover' ? 'Portada' : 'Foto'}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-2">
              • 1ª foto: Portada (se muestra en listados) · Fotos 2-7: Adicionales en tu perfil
            </p>
          </div>

          {/* Información física (opcional) */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="text-white font-semibold mb-3">👤 Información adicional (opcional)</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Altura (cm)"
                type="number"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                placeholder="Ej: 168"
              />
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de cuerpo</label>
                <select
                  value={formData.bodyType}
                  onChange={(e) => setFormData({ ...formData, bodyType: e.target.value })}
                  className="input-field"
                >
                  <option value="">Seleccionar...</option>
                  <option value="delgado">Delgado/a</option>
                  <option value="atletico">Atlético/a</option>
                  <option value="promedio">Normal</option>
                  <option value="musculoso">Musculoso/a</option>
                  <option value="corpulento">Curvilíneo/a</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Servicios / Especialidad</label>
              <input
                type="text"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                placeholder="Ej: Masajes, Compañía, GFE..."
                className="input-field"
              />
            </div>
          </div>

          {/* Hobbies */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="text-white font-semibold mb-3">Etiquetas / Servicios</h3>
            <div className="flex flex-wrap gap-2">
              {['Masajes', 'GFE', 'Compañía', 'Cenas', 'Viajes', 'Gym', 'Yoga', 'Baile',
                'Películas', 'Conversación', 'Discreción', 'Domicilio', 'Hotel', 'Local propio'].map(hobby => (
                <button
                  key={hobby}
                  type="button"
                  onClick={() => toggleHobby(hobby)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    hobbies.includes(hobby) ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {hobby}
                </button>
              ))}
            </div>
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
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border-2 ${
                    languages.includes(lang)
                      ? 'bg-blue-600 text-white border-blue-400'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-transparent'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Reglas */}
          <div className="bg-gray-900 rounded-xl p-4 text-sm text-gray-400 border border-gray-800">
            <p className="font-semibold text-white mb-2">📋 Normas importantes:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>No se permiten fotos de menores de edad</li>
              <li>Las fotos de portada no pueden mostrar genitales explícitamente</li>
              <li>Confirmas que tienes 18 años o más</li>
              <li>El incumplimiento de las normas resulta en eliminación del perfil</li>
            </ul>
          </div>

          <Button
            type="submit"
            fullWidth
            variant="primary"
            isLoading={isLoading}
            className="bg-red-600 hover:bg-red-700 border-0 py-4 text-lg"
          >
            Publicar mi anuncio
          </Button>
        </form>
      </div>
    </div>
  )
}
