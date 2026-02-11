import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import Logo from '@/components/common/Logo'
import Input from '@/components/common/Input'
import Textarea from '@/components/common/Textarea'
import Button from '@/components/common/Button'

export default function CreateProfilePage() {
  const navigate = useNavigate()
  const { refreshUserData } = useAuthStore()

  const [formData, setFormData] = useState({
    title: '',
    aboutMe: '',
    lookingFor: '',
    age: '',
    orientation: 'hetero',
    gender: '',
    role: '', // ROL solo para usuarios gay
    city: '',
    latitude: null as number | null,
    longitude: null as number | null,
    height: '',
    bodyType: '',
    relationshipStatus: 'soltero',
    relationshipGoal: '', // Nuevo campo
    occupation: '',
    education: '',
    smoking: 'no',
    drinking: 'social',
    children: 'no',
    pets: '',
    zodiacSign: '',
    showExactLocation: true, // Por defecto mostrar ubicación
  })

  const [hobbies, setHobbies] = useState<string[]>([])
  const [languages, setLanguages] = useState<string[]>(['Español'])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<Array<{ file: File, type: 'cover' | 'public' | 'private' }>>([])
  const [photoPreview, setPhotoPreview] = useState<Array<{ url: string, type: 'cover' | 'public' | 'private' }>>([])
  const [isDetectingLocation, setIsDetectingLocation] = useState(true)
  const [locationError, setLocationError] = useState('')

  // Lista de ciudades españolas para geocodificación
  const SPANISH_CITIES = [
    { name: 'Madrid', lat: 40.4168, lng: -3.7038 },
    { name: 'Barcelona', lat: 41.3851, lng: 2.1734 },
    { name: 'Valencia', lat: 39.4699, lng: -0.3763 },
    { name: 'Sevilla', lat: 37.3891, lng: -5.9845 },
    { name: 'Zaragoza', lat: 41.6488, lng: -0.8891 },
    { name: 'Málaga', lat: 36.7213, lng: -4.4214 },
    { name: 'Murcia', lat: 37.9922, lng: -1.1307 },
    { name: 'Palma', lat: 39.5696, lng: 2.6502 },
    { name: 'Las Palmas', lat: 28.1248, lng: -15.4300 },
    { name: 'Bilbao', lat: 43.2630, lng: -2.9350 },
    { name: 'Alicante', lat: 38.3452, lng: -0.4810 },
    { name: 'Córdoba', lat: 37.8882, lng: -4.7794 },
    { name: 'Valladolid', lat: 41.6523, lng: -4.7245 },
    { name: 'Vigo', lat: 42.2406, lng: -8.7207 },
    { name: 'Gijón', lat: 43.5450, lng: -5.6619 },
    { name: 'Hospitalet de Llobregat', lat: 41.3598, lng: 2.0994 },
    { name: 'A Coruña', lat: 43.3623, lng: -8.4115 },
    { name: 'Granada', lat: 37.1773, lng: -3.5986 },
    { name: 'Vitoria', lat: 42.8467, lng: -2.6716 },
    { name: 'Elche', lat: 38.2699, lng: -0.6983 },
    { name: 'Oviedo', lat: 43.3614, lng: -5.8593 },
    { name: 'Santa Cruz de Tenerife', lat: 28.4698, lng: -16.2549 },
    { name: 'Badalona', lat: 41.4502, lng: 2.2451 },
    { name: 'Cartagena', lat: 37.6256, lng: -0.9960 },
    { name: 'Terrassa', lat: 41.5633, lng: 2.0099 },
    { name: 'Jerez', lat: 36.6862, lng: -6.1367 },
    { name: 'Sabadell', lat: 41.5433, lng: 2.1092 },
    { name: 'Móstoles', lat: 40.3230, lng: -3.8651 },
    { name: 'Alcalá de Henares', lat: 40.4818, lng: -3.3634 },
    { name: 'Pamplona', lat: 42.8125, lng: -1.6458 },
    { name: 'Figueres', lat: 42.2679, lng: 2.9616 },
  ]

  // Lista de ciudades españolas (misma que LocationSelector)

  // Obtener orientación guardada y detectar ubicación automáticamente
  useEffect(() => {
    const savedOrientation = localStorage.getItem('userOrientation')
    if (savedOrientation) {
      setFormData(prev => ({
        ...prev,
        orientation: savedOrientation,
        // NO establecer género por defecto - el usuario debe elegir
        gender: ''
      }))
      localStorage.removeItem('userOrientation') // Limpiar después de usar
    }

    // DETECTAR UBICACIÓN AUTOMÁTICAMENTE AL CREAR PERFIL
    handleDetectLocation()
  }, [])

  // Función para detectar ubicación manualmente (si el usuario quiere)
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Tu navegador no soporta geolocalización.')
      return
    }

    setIsDetectingLocation(true)
    setLocationError('')
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords
        
        console.log(`📍 Ubicación obtenida: ${latitude}, ${longitude} (precisión: ${accuracy}m)`)
        
        try {
          // Usar geocodificación inversa para obtener la ciudad exacta
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=es`,
            {
              headers: {
                'User-Agent': '9citas.com/1.0'
              }
            }
          )
          
          if (response.ok) {
            const data = await response.json()
            const address = data.address
            
            // Intentar obtener la ciudad de diferentes campos
            let cityName = address.city || 
                          address.town || 
                          address.municipality || 
                          address.village ||
                          address.county ||
                          address.state_district
            
            // Si no encontramos ciudad, buscar la más cercana de nuestra lista
            if (!cityName) {
              console.log('⚠️ No se encontró ciudad en geocodificación, usando ciudad más cercana')
              let closestCity = SPANISH_CITIES[0]
              let minDistance = Infinity

              SPANISH_CITIES.forEach(city => {
                const distance = Math.sqrt(
                  Math.pow(city.lat - latitude, 2) + Math.pow(city.lng - longitude, 2)
                )
                if (distance < minDistance) {
                  minDistance = distance
                  closestCity = city
                }
              })
              cityName = closestCity.name
            } else {
              // Normalizar nombre de ciudad (capitalizar primera letra)
              cityName = cityName.split(' ').map((word: string) => 
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              ).join(' ')
              
              // Verificar si la ciudad está en nuestra lista, si no, usar la más cercana
              const cityInList = SPANISH_CITIES.find(c => 
                c.name.toLowerCase() === cityName.toLowerCase()
              )
              
              if (!cityInList) {
                console.log(`⚠️ Ciudad "${cityName}" no está en lista, usando ciudad más cercana`)
                let closestCity = SPANISH_CITIES[0]
                let minDistance = Infinity

                SPANISH_CITIES.forEach(city => {
                  const distance = Math.sqrt(
                    Math.pow(city.lat - latitude, 2) + Math.pow(city.lng - longitude, 2)
                  )
                  if (distance < minDistance) {
                    minDistance = distance
                    closestCity = city
                  }
                })
                cityName = closestCity.name
              }
            }
            
            console.log(`✅ Ciudad detectada: ${cityName}`)
            
            setFormData(prev => ({
              ...prev,
              city: cityName,
              latitude,
              longitude,
            }))
          } else {
            throw new Error('Error en geocodificación')
          }
        } catch (error) {
          console.error('Error en geocodificación inversa:', error)
          // Fallback: buscar la ciudad más cercana
          let closestCity = SPANISH_CITIES[0]
          let minDistance = Infinity

          SPANISH_CITIES.forEach(city => {
            const distance = Math.sqrt(
              Math.pow(city.lat - latitude, 2) + Math.pow(city.lng - longitude, 2)
            )
            if (distance < minDistance) {
              minDistance = distance
              closestCity = city
            }
          })

          setFormData(prev => ({
            ...prev,
            city: closestCity.name,
            latitude,
            longitude,
          }))
        }
        
        setIsDetectingLocation(false)
      },
      (error) => {
        console.error('Error de geolocalización:', error)
        setLocationError('No se pudo obtener tu ubicación. Por favor, permite el acceso a tu ubicación.')
        setIsDetectingLocation(false)
        // Usar Madrid como fallback
        setFormData(prev => ({
          ...prev,
          city: 'Madrid',
          latitude: 40.4168,
          longitude: -3.7038,
        }))
      },
      {
        enableHighAccuracy: true, // Máxima precisión usando GPS
        timeout: 30000, // 30 segundos para obtener ubicación precisa
        maximumAge: 0, // No usar ubicación en caché, siempre obtener nueva
      }
    )
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    // Determinar si es para fotos públicas o privadas basado en el input
    const isPrivateInput = e.target.id === 'photo-upload-private'
    
    // Contar fotos actuales por tipo
    const coverCount = selectedFiles.filter(f => f.type === 'cover').length
    const publicCount = selectedFiles.filter(f => f.type === 'public').length
    const privateCount = selectedFiles.filter(f => f.type === 'private').length
    
    if (isPrivateInput) {
      // Fotos privadas: máximo 4
      if (privateCount + files.length > 4) {
        setError('Máximo 4 fotos privadas')
        return
      }
    } else {
      // Fotos públicas: 1 portada + 3 públicas = 4 total
      if (coverCount + publicCount + files.length > 4) {
        setError('Máximo 4 fotos públicas (1 portada + 3 públicas)')
        return
      }
    }
    
    // Agregar archivos con su tipo correcto
    const newFiles = files.map(file => {
      let type: 'cover' | 'public' | 'private'
      
      if (isPrivateInput) {
        type = 'private'
      } else {
        // Si no hay cover aún, esta es la cover
        const publicFilesCount = selectedFiles.filter(f => f.type !== 'private').length
        if (coverCount === 0 && publicFilesCount === 0) {
          type = 'cover'
        } else {
          type = 'public'
        }
      }
      
      console.log(`📸 Foto seleccionada: ${file.name} → tipo: ${type}`)
      return { file, type }
    })
    
    setSelectedFiles([...selectedFiles, ...newFiles])
    
    // Preview con tipo
    files.forEach((file, index) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(prev => [...prev, { 
          url: reader.result as string, 
          type: newFiles[index].type 
        }])
      }
      reader.readAsDataURL(file)
    })
  }

  const removePhoto = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setPhotoPreview(prev => prev.filter((_, i) => i !== index))
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.title.length > 15) {
      setError('El título debe tener máximo 15 caracteres')
      return
    }

    // IMPORTANTE: La ciudad NO es obligatoria al crear el perfil
    // Se puede crear sin ciudad y se detectará cuando use la app

    const age = parseInt(formData.age)
    if (age < 18 || age > 99) {
      setError('La edad debe estar entre 18 y 99 años')
      return
    }

    if (!formData.gender) {
      setError('Debes seleccionar tu género')
      return
    }

    // Validar ROL solo para usuarios gay
    if (formData.orientation === 'gay' && !formData.role) {
      setError('Debes seleccionar tu ROL (Activo, Pasivo o Versátil)')
      return
    }

    if (!formData.relationshipGoal) {
      setError('Debes seleccionar el tipo de relación que buscas')
      return
    }

    if (selectedFiles.length === 0) {
      setError('Debes subir al menos 1 foto de portada')
      return
    }

    // El género se establece automáticamente según la orientación
    // No necesitamos validarlo manualmente

    setIsLoading(true)

    try {
      // Crear perfil
      await api.post('/profile', {
        ...formData,
        age,
        height: formData.height ? parseInt(formData.height) : null,
        hobbies,
        languages,
        showExactLocation: formData.showExactLocation, // Enviar preferencia de ubicación
        relationshipGoal: formData.relationshipGoal, // Nuevo campo
      })

      // Subir fotos con su tipo correcto
      for (let i = 0; i < selectedFiles.length; i++) {
        const photoData = selectedFiles[i]
        const formData = new FormData()
        formData.append('photo', photoData.file)
        formData.append('type', photoData.type) // Usar el tipo que se asignó al seleccionar
        
        console.log(`📤 Subiendo foto ${i + 1}:`, {
          nombre: photoData.file.name,
          tipo: photoData.type,
        })
        
        try {
          await api.post('/photos/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          console.log(`✅ Foto ${i + 1} subida como ${photoData.type}`)
        } catch (photoErr) {
          console.error(`❌ Error subiendo foto ${i + 1}:`, photoErr)
        }
      }

      await refreshUserData()
      
      // Marcar que el usuario acaba de registrarse para mostrar el tutorial
      sessionStorage.setItem('justRegistered', 'true')
      
      navigate('/app')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear perfil')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark py-8 px-4" style={{ paddingBottom: '120px', overflowY: 'auto' }}>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        {/* Logo */}
        <div className="text-center">
          <Logo size="md" className="mb-4" />
          <h2 className="text-2xl font-bold text-white">Completa tu perfil</h2>
          <p className="text-gray-400 mt-2">
            Cuéntanos un poco sobre ti para empezar a conocer gente
          </p>
        </div>

        {/* Formulario */}
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
            placeholder="Ej: Carlos, 28"
          />

          {/* Selector de género - OBLIGATORIO (sin selección por defecto) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Género *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {formData.orientation === 'hetero' ? (
                <>
                  {/* Opciones para HETERO: Hombre o Mujer */}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: 'hombre' })}
                    className={`py-4 px-6 rounded-xl font-semibold text-lg transition-all ${
                      formData.gender === 'hombre'
                        ? 'bg-blue-500 text-white shadow-lg scale-105'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-2 border-gray-700'
                    }`}
                  >
                    👨 Hombre
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: 'mujer' })}
                    className={`py-4 px-6 rounded-xl font-semibold text-lg transition-all ${
                      formData.gender === 'mujer'
                        ? 'bg-pink-500 text-white shadow-lg scale-105'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-2 border-gray-700'
                    }`}
                  >
                    👩 Mujer
                  </button>
                </>
              ) : (
                <>
                  {/* Opciones para GAY: Gay o Trans */}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: 'gay' })}
                    className={`py-4 px-6 rounded-xl font-semibold text-lg transition-all ${
                      formData.gender === 'gay'
                        ? 'bg-purple-500 text-white shadow-lg scale-105'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-2 border-gray-700'
                    }`}
                  >
                    🏳️‍🌈 Gay
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: 'trans' })}
                    className={`py-4 px-6 rounded-xl font-semibold text-lg transition-all ${
                      formData.gender === 'trans'
                        ? 'bg-gradient-to-r from-pink-400 via-white to-blue-400 text-gray-900 shadow-lg scale-105'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-2 border-gray-700'
                    }`}
                  >
                    🏳️‍⚧️ Trans
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Selector de ROL - OBLIGATORIO solo para usuarios GAY */}
          {formData.orientation === 'gay' && (
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

          <Textarea
            label="Descríbete"
            value={formData.aboutMe}
            onChange={(e) => setFormData({ ...formData, aboutMe: e.target.value })}
            required
            rows={4}
            placeholder="Cuéntanos sobre ti, tus intereses, hobbies..."
          />

          <Textarea
            label="Lo que buscas"
            value={formData.lookingFor}
            onChange={(e) => setFormData({ ...formData, lookingFor: e.target.value })}
            required
            rows={4}
            placeholder="¿Qué tipo de conexión o relación buscas?"
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

          {/* Orientación oculta - ya se seleccionó en el registro */}
          {/* Género oculto - ya se seleccionó en el registro */}

          {/* Ubicación - Detección automática */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              📍 Ubicación
            </label>
            
            {isDetectingLocation ? (
              <div className="bg-gray-800 rounded-lg px-4 py-3 flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                <span className="text-gray-300">Detectando tu ubicación...</span>
              </div>
            ) : locationError ? (
              <div>
                <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-2">
                  {locationError}
                </div>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  className="w-full bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Reintentar detección
                </button>
              </div>
            ) : formData.city ? (
              <div className="bg-gray-800 rounded-lg px-4 py-3 flex items-center justify-between">
                <span className="text-white font-medium">{formData.city}</span>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  className="text-primary text-sm hover:underline"
                >
                  Actualizar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleDetectLocation}
                className="w-full bg-primary hover:bg-primary/90 text-white py-3 px-4 rounded-lg transition-colors"
              >
                Detectar mi ubicación
              </button>
            )}
          </div>

          {/* Toggle para mostrar ubicación exacta */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-white font-medium block mb-1">
                  🔒 Privacidad de ubicación
                </label>
                <p className="text-sm text-gray-400">
                  {formData.showExactLocation 
                    ? 'Otros usuarios verán tu ciudad y distancia exacta' 
                    : 'Otros usuarios no verán tu ubicación exacta'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, showExactLocation: !formData.showExactLocation })}
                className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  formData.showExactLocation ? 'bg-primary' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    formData.showExactLocation ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* FOTOS PÚBLICAS */}
          <div className="bg-gray-800 rounded-lg p-4">
            <label className="block text-sm font-medium text-white mb-3">
              📸 Fotos Públicas (Obligatorio: mínimo 1, máximo 4)
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
                className="block w-full bg-primary hover:opacity-90 text-white font-semibold py-3 px-6 rounded-lg text-center cursor-pointer transition-opacity"
              >
                + Añadir Fotos Públicas
              </label>
            </div>

            {photoPreview.filter(p => p.type === 'cover' || p.type === 'public').length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {photoPreview.filter(p => p.type === 'cover' || p.type === 'public').map((preview, index) => {
                  const globalIndex = photoPreview.findIndex(p => p === preview)
                  return (
                    <div key={globalIndex} className="relative aspect-square">
                      <img
                        src={preview.url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(globalIndex)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                      <div className={`absolute bottom-1 left-1 text-white text-xs px-2 py-0.5 rounded ${
                        preview.type === 'cover' ? 'bg-primary' : 'bg-secondary'
                      }`}>
                        {preview.type === 'cover' ? '📷 Portada' : '👁️ Pública'}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <p className="text-xs text-gray-400 mt-2">
              • 1ª foto: Portada (obligatoria, se muestra en tu perfil)<br/>
              • Fotos 2-4: Públicas (visibles para todos)
            </p>
          </div>

          {/* FOTOS PRIVADAS - OCULTO TEMPORALMENTE PARA VERIFICACIÓN DE GOOGLE ADS */}
          {false && (
          <div className="bg-gray-800 rounded-lg p-4 border-2 border-accent">
            <label className="block text-sm font-medium text-white mb-3 flex items-center gap-2">
              🔒 Fotos Privadas (Opcional: máximo 4)
            </label>
            
            <div className="mb-3">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="photo-upload-private"
              />
              <label
                htmlFor="photo-upload-private"
                className="block w-full bg-accent hover:opacity-90 text-black font-semibold py-3 px-6 rounded-lg text-center cursor-pointer transition-opacity"
              >
                + Añadir Fotos Privadas
              </label>
            </div>

            {photoPreview.filter(p => p.type === 'private').length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {photoPreview.filter(p => p.type === 'private').map((preview, index) => {
                  const globalIndex = photoPreview.findIndex(p => p === preview)
                  return (
                    <div key={globalIndex} className="relative aspect-square">
                      <img
                        src={preview.url}
                        alt={`Preview privada ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(globalIndex)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                      <div className="absolute bottom-1 left-1 bg-accent text-black text-xs px-2 py-0.5 rounded flex items-center gap-1">
                        🔒 Privada
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <p className="text-xs text-gray-400 mt-2">
              • Solo visibles para usuarios con los que tengas match<br/>
              • Pueden solicitar acceso para verlas<br/>
              • Máximo 4 fotos privadas
            </p>
          </div>
          )}

          {/* Información física */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">👤 Información Física</h3>
            
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
                  <option value="musculoso">Musculoso</option>
                  <option value="corpulento">Corpulento</option>
                </select>
              </div>
            </div>
          </div>

          {/* Estilo de vida */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">🌟 Estilo de Vida</h3>
            
            <Input
              label="Profesión / Trabajo"
              type="text"
              value={formData.occupation}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
              placeholder="Ej: Ingeniero, Diseñador, Estudiante..."
            />

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nivel de estudios
              </label>
              <select
                value={formData.education}
                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                className="input-field"
              >
                <option value="">Seleccionar...</option>
                <option value="secundaria">Secundaria</option>
                <option value="bachillerato">Bachillerato</option>
                <option value="fp">Formación Profesional</option>
                <option value="universitario">Universitario</option>
                <option value="posgrado">Posgrado/Máster</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ¿Fumas?
                </label>
                <select
                  value={formData.smoking}
                  onChange={(e) => setFormData({ ...formData, smoking: e.target.value })}
                  className="input-field"
                >
                  <option value="no">No fumo</option>
                  <option value="ocasional">Ocasionalmente</option>
                  <option value="regular">Sí, regularmente</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ¿Bebes alcohol?
                </label>
                <select
                  value={formData.drinking}
                  onChange={(e) => setFormData({ ...formData, drinking: e.target.value })}
                  className="input-field"
                >
                  <option value="no">No bebo</option>
                  <option value="social">Socialmente</option>
                  <option value="regular">Regularmente</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ¿Tienes hijos?
                </label>
                <select
                  value={formData.children}
                  onChange={(e) => setFormData({ ...formData, children: e.target.value })}
                  className="input-field"
                >
                  <option value="no">No</option>
                  <option value="si_vivo">Sí, viven conmigo</option>
                  <option value="si_no_vivo">Sí, no viven conmigo</option>
                  <option value="quiero">No, pero quiero</option>
                </select>
              </div>

              <Input
                label="Mascotas"
                type="text"
                value={formData.pets}
                onChange={(e) => setFormData({ ...formData, pets: e.target.value })}
                placeholder="Ej: Perro, Gato, Ninguna..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Estado civil
                </label>
                <select
                  value={formData.relationshipStatus}
                  onChange={(e) => setFormData({ ...formData, relationshipStatus: e.target.value })}
                  className="input-field"
                >
                  <option value="soltero">Soltero/a</option>
                  <option value="divorciado">Divorciado/a</option>
                  <option value="viudo">Viudo/a</option>
                  <option value="complicado">Es complicado</option>
                  <option value="abierto">Relación abierta</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Signo zodiacal
                </label>
                <select
                  value={formData.zodiacSign}
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
          </div>

          {/* Hobbies e intereses */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">🎯 Hobbies e Intereses</h3>
            <p className="text-sm text-gray-400 mb-3">Selecciona tus intereses (mínimo 3)</p>
            
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
            <h3 className="text-white font-semibold mb-3">🌍 Idiomas que hablas</h3>
            
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

          {/* Reglas */}
          <div className="bg-gray-900 rounded-lg p-4 text-sm text-gray-400 space-y-2">
            <p className="font-semibold text-white mb-2">📋 Reglas importantes:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>No se permiten fotos de desnudos enseñando pechos, genitales o culo en las fotos públicas</li>
              <li>No se permite pedir dinero a cambio de sexo</li>
              <li>Evitar mensajes con insultos, xenofobia o discriminación</li>
              <li>No registrarse en un género/categoría que no corresponda</li>
              <li>Si incumples las reglas, tu perfil podrá ser eliminado</li>
            </ul>
          </div>

          <Button
            type="submit"
            fullWidth
            variant="primary"
            isLoading={isLoading}
            className="mt-6"
          >
            Guardar perfil
          </Button>
        </form>
      </div>
    </div>
  )
}

