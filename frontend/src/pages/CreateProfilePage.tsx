import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/services/api'
import { uploadProfilePhotos } from '@/utils/uploadProfilePhotos'
import { useAuthStore } from '@/store/authStore'
import Input from '@/components/common/Input'
import Textarea from '@/components/common/Textarea'
import Button from '@/components/common/Button'
import { detectLocation } from '@/utils/geolocation'
import CitySelector from '@/components/common/CitySelector'
import BackNavBar from '@/components/common/BackNavBar'

const GENDER_OPTIONS = [
  { id: 'chica', label: '👩 Chica', color: 'bg-pink-500' },
  { id: 'chico', label: '👨 Chico', color: 'bg-blue-500' },
  { id: 'trans', label: '🏳️‍⚧️ Trans', color: 'bg-purple-500' },
  { id: 'casa', label: '🏠 Casa / Piso', color: 'bg-orange-500' },
  { id: 'gay', label: '🌈 Gay', color: 'bg-green-500' },
  { id: 'masajes', label: '💆 Masajes', color: 'bg-teal-500' },
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
    profileType: '' as '' | 'escort' | 'sexo_gratis',
    city: '',
    latitude: null as number | null,
    longitude: null as number | null,
    phone: '',
    whatsapp: '',
    acceptMessages: false,
    height: '',
    bodyType: '',
    occupation: '',
    smoking: 'no',
    drinking: 'social',
    showExactLocation: true,
  })


  const [languages, setLanguages] = useState<string[]>(['Español'])
  const [error, setError] = useState('')
  const [acceptedSexoGratisRules, setAcceptedSexoGratisRules] = useState(false)
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

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true)
    setLocationError('')
    try {
      const result = await detectLocation()
      setFormData(prev => ({ ...prev, city: result.city, latitude: result.latitude, longitude: result.longitude }))
    } catch {
      setLocationError('No se pudo obtener tu ubicación. Selecciona tu ciudad manualmente.')
      setFormData(prev => ({ ...prev, city: 'Madrid', latitude: 40.4168, longitude: -3.7038 }))
    } finally {
      setIsDetectingLocation(false)
    }
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


  const toggleLanguage = (lang: string) => {
    setLanguages(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang])
  }

  const showError = (msg: string) => {
    setError(msg)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.gender) { showError('⚠️ Debes seleccionar tu categoría'); return }
    if (!formData.profileType) { showError('⚠️ Debes elegir Escort o Sexo gratis'); return }
    if (!formData.title.trim()) { showError('⚠️ El título es obligatorio'); return }
    if (formData.title.length > 20) { showError('⚠️ El título debe tener máximo 20 caracteres'); return }

    const age = parseInt(formData.age)
    if (isNaN(age) || age < 18 || age > 99) { showError('⚠️ La edad debe estar entre 18 y 99 años'); return }
    if (!formData.phone && !formData.whatsapp && !formData.acceptMessages) {
      showError('⚠️ Debes añadir teléfono, WhatsApp o activar contacto por mensaje')
      return
    }
    if (formData.profileType === 'sexo_gratis' && !acceptedSexoGratisRules) {
      showError('⚠️ Debes aceptar las normas de la sección Sexo gratis')
      return
    }
    if (selectedFiles.length === 0) { showError('⚠️ Debes subir al menos 1 foto para publicar tu perfil'); return }

    setIsLoading(true)
    try {
      await api.post('/profile', {
        ...formData,
        age,
        height: formData.height ? parseInt(formData.height) : null,
        hobbies: [],
        languages,
        orientation: formData.gender, // compatibilidad con backend
      })

      const { uploaded, errors } = await uploadProfilePhotos(
        selectedFiles.map((f) => f.file)
      )

      if (uploaded === 0) {
        showError(errors[0] || '⚠️ No se pudo subir ninguna foto. Añade al menos una para que tu perfil sea visible.')
        await refreshUserData()
        navigate('/edit-profile')
        return
      }

      if (errors.length > 0) {
        setError(`${uploaded} foto(s) guardada(s). ${errors.join('. ')}`)
      }

      // Activar perfil solo tras subir fotos correctamente
      await api.put('/profile', { isPaused: false })

      navigate('/perfiles')
      await refreshUserData()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear perfil')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 pb-32">
      <BackNavBar backTo="/perfiles" />
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in px-4 py-4">

        {/* Video explicativo — antes del formulario */}
        <div className="relative w-full rounded-xl overflow-hidden shadow-xl" style={{ paddingTop: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src="https://www.youtube.com/embed/n0k2VE4UNaI"
            title="Cómo completar tu perfil"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Completa tu perfil</h2>
          <p className="text-gray-400 mt-1 text-sm">
            Cuéntanos sobre ti para aparecer en los resultados
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Tipo de perfil */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tipo de perfil *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, profileType: 'escort' })}
                className={`py-4 px-4 rounded-xl font-semibold text-base transition-all ${
                  formData.profileType === 'escort'
                    ? 'bg-red-600 text-white shadow-lg scale-105'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-2 border-gray-700'
                }`}
              >
                💼 Escort
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, profileType: 'sexo_gratis' })}
                className={`py-4 px-4 rounded-xl font-semibold text-base transition-all ${
                  formData.profileType === 'sexo_gratis'
                    ? 'bg-emerald-600 text-white shadow-lg scale-105'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-2 border-gray-700'
                }`}
              >
                💚 Sexo gratis
              </button>
            </div>
            <p className="text-gray-500 text-xs mt-2">
              Solo puedes elegir una opción. Aparecerás en la sección correspondiente.
            </p>
            <p className="text-amber-200/90 text-xs mt-2 leading-relaxed bg-amber-900/20 border border-amber-700/40 rounded-lg px-3 py-2">
              Si eliges &quot;Sexo gratis&quot; no podrás pedir dinero ni regalos a cambio de sexo; si lo haces, serás
              bloqueado permanentemente en nuestra web. Si pides algo a cambio, selecciona ESCORT. Si no eres
              profesional, puedes elegir la opción de &quot;Mensaje&quot; como forma de contacto para recibir respuestas
              sin tener que poner tu número de teléfono ni tu WhatsApp.
            </p>
            {formData.profileType === 'sexo_gratis' && (
              <div className="mt-3 bg-emerald-900/20 border border-emerald-700 rounded-xl p-4 space-y-3">
                <p className="text-emerald-200 text-sm font-semibold">⚠️ Compromiso obligatorio</p>
                <p className="text-gray-300 text-xs leading-relaxed">
                  Al elegir <strong className="text-white">Sexo gratis</strong>, te comprometes a no solicitar ni aceptar
                  ningún tipo de compensación económica, regalo o beneficio a cambio. El incumplimiento supone
                  baneo y expulsión permanente de la web.
                </p>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedSexoGratisRules}
                    onChange={(e) => setAcceptedSexoGratisRules(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span className="text-gray-300 text-xs">Acepto estas normas y publicaré sin pedir dinero ni regalos</span>
                </label>
              </div>
            )}
          </div>

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

          {/* Contacto */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h3 className="text-white font-semibold mb-3">📞 Datos de contacto *</h3>
            <p className="text-gray-400 text-xs mb-3">
              Añade teléfono/WhatsApp y/o activa mensajes. Ideal para Sexo gratis si no quieres publicar tu número.
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
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Mensaje</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, acceptMessages: false })}
                    className={`py-3 rounded-xl font-bold text-sm transition-all ${
                      !formData.acceptMessages
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-900 text-gray-400 border border-gray-700'
                    }`}
                  >
                    NO
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, acceptMessages: true })}
                    className={`py-3 rounded-xl font-bold text-sm transition-all ${
                      formData.acceptMessages
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-900 text-gray-400 border border-gray-700'
                    }`}
                  >
                    SI
                  </button>
                </div>
                <p className="text-gray-500 text-xs mt-2">
                  Recibirás tus mensajes en tu bandeja de entrada
                </p>
              </div>
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
            label={formData.profileType === 'sexo_gratis' ? 'Lo que busco / ofrezco' : 'Lo que ofrezco / Servicios'}
            value={formData.lookingFor}
            onChange={(e) => setFormData({ ...formData, lookingFor: e.target.value })}
            required
            rows={4}
            placeholder={
              formData.profileType === 'sexo_gratis'
                ? 'Describe qué buscas u ofreces, sin mencionar tarifas ni compensación económica...'
                : 'Describe tus servicios, lo que ofreces, tus tarifas si quieres...'
            }
          />

          {/* Ubicación */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              📍 Tu lugar de trabajo
            </label>
            <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg px-3 py-2 mb-3">
              <p className="text-blue-200 text-xs leading-relaxed">
                💡 Para un uso perfecto, pon el nombre de la calle, número, ciudad y provincia, o detecta automáticamente la ubicación cuando estés en tu lugar de trabajo. <strong>La dirección NO saldrá publicada</strong>, solo se usará para mostrarte cerca de los usuarios.
              </p>
            </div>
            <CitySelector
              value={formData.city}
              onChange={(city, lat, lng) =>
                setFormData(prev => ({ ...prev, city, latitude: lat, longitude: lng }))
              }
              onDetect={handleDetectLocation}
              isDetecting={isDetectingLocation}
              locationError={locationError}
            />
          </div>

          {/* FOTOS PÚBLICAS */}
          <div className="bg-gray-800 rounded-xl p-4">
            <label className="block text-sm font-medium text-white mb-3">
              📸 Fotos <span className="text-red-400">*</span> (obligatoria al menos 1, hasta 7)
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
              • La primera foto que subas aparecerá en los listados · Puedes subir hasta 7 fotos
            </p>
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
              <li>Confirmas que tienes 18 años o más</li>
              <li>El incumplimiento de las normas resulta en eliminación del perfil</li>
            </ul>
          </div>

          {/* Aviso legal */}
          <div className="border-2 border-yellow-400 bg-yellow-400/10 rounded-xl p-4">
            <p className="text-yellow-300 text-sm font-semibold leading-snug">
              ⚠️ Si publicas un perfil falso con fotos y/o el teléfono de otra persona sin su consentimiento, puedes enfrentarte a delitos como suplantación, difamación o acoso, con multas e incluso consecuencias penales.
            </p>
          </div>

          {/* Error también junto al botón para que se vea sin hacer scroll */}
          {error && (
            <div className="bg-red-500/15 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <Button
            type="submit"
            fullWidth
            variant="primary"
            isLoading={isLoading}
            className="bg-red-600 hover:bg-red-700 border-0 py-4 text-lg"
          >
            Publicar perfil
          </Button>
        </form>
      </div>
    </div>
  )
}
