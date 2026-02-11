import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '@/services/api'
import { showToast } from '@/store/toastStore'
import { useAuthStore } from '@/store/authStore'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import Button from '@/components/common/Button'
import Modal from '@/components/common/Modal'
import MatchModal from '@/components/common/MatchModal'
import ReportModal from '@/components/common/ReportModal'
import { Lock, Eye, AlertTriangle } from 'lucide-react'
import { formatRelationshipGoal, formatRole } from '@/utils/profileUtils'
import ProtectedImage from '@/components/common/ProtectedImage'

export default function ProfileDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const isPremium = user?.subscription?.isActive || false
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [currentPrivatePhotoIndex, setCurrentPrivatePhotoIndex] = useState(0)
  
  // Resetear índice cuando cambia el perfil o las fotos públicas
  useEffect(() => {
    setCurrentPhotoIndex(0)
    setCurrentPrivatePhotoIndex(0)
  }, [id, profile?.photos])
  const [privatePhotoAccess, setPrivatePhotoAccess] = useState<any>(null)
  const [showPrivatePhotosModal, setShowPrivatePhotosModal] = useState(false)
  const [isRequestingAccess, setIsRequestingAccess] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportCount, setReportCount] = useState(0)
  const [reportCountsByReason, setReportCountsByReason] = useState({
    scam: 0,
    inappropriate_photos: 0,
    money_request: 0,
    fake_photos: 0,
    underage: 0,
    hate_speech: 0,
  })
  const [hasReported, setHasReported] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [showBlockModal, setShowBlockModal] = useState(false)

  useEffect(() => {
    loadProfile()
    checkPrivatePhotoAccess()
    loadReportData()
    checkBlockStatus()
  }, [id])

  const loadProfile = async () => {
    if (!id) {
      console.error('❌ No hay ID de perfil')
      navigate('/app')
      return
    }
    
    try {
      const response = await api.get(`/profile/${id}`)
      console.log('📸 Perfil cargado:', {
        totalPhotos: response.data.photos?.length || 0,
        coverPhotos: response.data.photos?.filter((p: any) => p.type === 'cover').length || 0,
        privatePhotos: response.data.photos?.filter((p: any) => p.type === 'private').length || 0,
        privatePhotoAccess: response.data.privatePhotoAccess,
      })
      setProfile(response.data)
      setIsLiked(response.data.isLiked || false)
    } catch (error: any) {
      console.error('❌ Error al cargar perfil:', error)
      if (error.response?.status === 404) {
        showToast('Perfil no encontrado', 'error')
        navigate('/app')
      } else {
        showToast('Error al cargar el perfil', 'error')
        // No redirigir automáticamente para otros errores
      }
    } finally {
      setIsLoading(false)
    }
  }

  const checkPrivatePhotoAccess = async () => {
    try {
      const response = await api.get(`/private-photos/check/${id}`)
      setPrivatePhotoAccess(response.data)
    } catch (error) {
      console.error('Error al verificar acceso:', error)
    }
  }

  const loadReportData = async () => {
    try {
      // Cargar contador de denuncias (total y por motivo)
      const countResponse = await api.get(`/reports/count/${id}`)
      setReportCount(countResponse.data.total || 0)
      setReportCountsByReason(countResponse.data.byReason || {
        scam: 0,
        inappropriate_photos: 0,
        money_request: 0,
        fake_photos: 0,
        underage: 0,
      })

      // Verificar si ya denunciamos
      const checkResponse = await api.get(`/reports/check/${id}`)
      setHasReported(checkResponse.data.hasReported || false)
    } catch (error) {
      console.error('Error al cargar datos de denuncias:', error)
    }
  }

  const checkBlockStatus = async () => {
    try {
      const response = await api.get('/blocks')
      const blockedIds = response.data.blocks.map((b: any) => b.blockedProfile.id)
      setIsBlocked(blockedIds.includes(id))
    } catch (error) {
      console.error('Error al verificar bloqueo:', error)
    }
  }

  const handleBlock = async () => {
    try {
      await api.post(`/blocks/${id}`)
      setIsBlocked(true)
      setShowBlockModal(false)
      showToast('Usuario bloqueado correctamente', 'success')
      
      // Redirigir a la página de navegación después de 1 segundo
      setTimeout(() => {
        navigate('/app')
      }, 1000)
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Error al bloquear usuario', 'error')
    }
  }

  const handleUnblock = async () => {
    try {
      await api.delete(`/blocks/${id}`)
      setIsBlocked(false)
      showToast('Usuario desbloqueado correctamente', 'success')
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Error al desbloquear usuario', 'error')
    }
  }

  const handleRequestPrivatePhotoAccess = async () => {
    // YA NO REQUIERE MATCH - Cualquiera puede solicitar acceso a fotos privadas
    setIsRequestingAccess(true)
    try {
      await api.post(`/private-photos/request/${id}`)
      showToast('Solicitud enviada. El usuario recibirá una notificación.', 'success')
      await checkPrivatePhotoAccess()
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Error al solicitar acceso', 'error')
    } finally {
      setIsRequestingAccess(false)
    }
  }

  const handleLike = async () => {
    try {
      if (isLiked) {
        await api.delete(`/likes/${id}`)
        setIsLiked(false)
      } else {
        // Dar like - el backend ahora retorna si hay match
        const response = await api.post(`/likes/${id}`)
        console.log('💚 Like dado, respuesta:', response.data)
        setIsLiked(true)
        
        // Si hay match → ¡MATCH! 💕
        if (response.data.isMatch) {
          console.log('🎉 MATCH detectado en handleLike!')
          setShowMatchModal(true)
          // La notificación de Socket.IO también debería aparecer
        }
      }
    } catch (error: any) {
      console.error('❌ Error al dar like:', error)
      showToast(error.response?.data?.error || 'Error al dar like', 'error')
    }
  }

  const handleChat = () => {
    // Todos los usuarios pueden chatear sin necesidad de match
    // La limitación de usuarios FREE es solo ver 50 perfiles totales
    navigate(`/app/chat/${id}`)
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Perfil no encontrado</p>
      </div>
    )
  }

  // IMPORTANTE: En el carrusel se muestran TODAS las fotos EXCEPTO las privadas
  const publicPhotos = profile.photos?.filter((p: any) => p.type !== 'private') || []
  const photos = publicPhotos
  const currentPhoto = photos[currentPhotoIndex]
  
  // Separar fotos privadas para la sección de fotos privadas
  const privatePhotos = profile.photos?.filter((p: any) => p.type === 'private') || []
  
  // Todas las fotos (para el modal de fotos privadas)
  const allPhotos = profile.photos || []
  
  console.log('🖼️ Fotos procesadas:', {
    publicPhotos: photos.length,
    privatePhotos: privatePhotos.length,
    currentIndex: currentPhotoIndex,
    allPhotos: allPhotos.map((p: any) => ({ id: p.id, type: p.type })),
  })

  return (
    <div className="max-w-4xl mx-auto pb-8">
      {/* Carrusel de fotos - Solo fotos públicas */}
      <div className="relative aspect-[3/4] bg-gray-900">
        {photos.length > 0 && currentPhoto ? (
          <>
            <ProtectedImage
              src={currentPhoto.url}
              alt={profile.title}
              className="w-full h-full"
            />

            {/* Navegación de fotos - Flechas mejoradas */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentPhotoIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentPhotoIndex === 0}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-full p-3 shadow-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 z-10 border-2 border-white/30 hover:border-white/50 hover:scale-110 disabled:hover:scale-100"
                  aria-label="Foto anterior"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentPhotoIndex((prev) => Math.min(photos.length - 1, prev + 1))}
                  disabled={currentPhotoIndex === photos.length - 1}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-full p-3 shadow-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 z-10 border-2 border-white/30 hover:border-white/50 hover:scale-110 disabled:hover:scale-100"
                  aria-label="Foto siguiente"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Indicadores mejorados */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {photos.map((_: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPhotoIndex(index)}
                      className={`transition-all duration-200 rounded-full ${
                        index === currentPhotoIndex 
                          ? 'bg-white w-8 h-2 shadow-lg' 
                          : 'bg-white/50 w-2 h-2 hover:bg-white/70 hover:w-3'
                      }`}
                      aria-label={`Ir a foto ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            Sin fotos
          </div>
        )}
      </div>

      {/* Información */}
      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              {profile.title}, {profile.age}
              {profile.isOnline && <span className="online-indicator"></span>}
            </h1>
            {/* Mostrar ubicación SOLO si es usuario PREMIUM (9Plus) */}
            {isPremium && (
              <>
                <p className="text-gray-400 mt-1">{profile.city}</p>
                {/* Mostrar distancia SOLO si el perfil tiene showExactLocation activado */}
                {profile.showExactLocation !== false && profile.distance && (
                  <p className="text-gray-500 text-sm">A {profile.distance} km de ti</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Descripción */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-2">Sobre mí</h2>
          <p className="text-gray-300">{profile.aboutMe}</p>
        </div>

        {/* Lo que busca */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-2">Lo que busco</h2>
          <p className="text-gray-300">{profile.lookingFor}</p>
        </div>

        {/* Información detallada */}
        <div className="grid grid-cols-2 gap-4">
          {profile.height && (
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-400 text-sm">Altura</p>
              <p className="text-white font-semibold">{profile.height} cm</p>
            </div>
          )}
          
          {profile.bodyType && (
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-400 text-sm">Tipo de cuerpo</p>
              <p className="text-white font-semibold capitalize">{profile.bodyType}</p>
            </div>
          )}
          
          {profile.occupation && (
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-400 text-sm">Profesión</p>
              <p className="text-white font-semibold">{profile.occupation}</p>
            </div>
          )}
          
          {profile.education && (
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-400 text-sm">Estudios</p>
              <p className="text-white font-semibold capitalize">{profile.education}</p>
            </div>
          )}
          
          {profile.relationshipStatus && (
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-400 text-sm">Estado civil</p>
              <p className="text-white font-semibold capitalize">{profile.relationshipStatus}</p>
            </div>
          )}
          
          {profile.relationshipGoal && (
            <div className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-lg p-3 border border-pink-500/30">
              <p className="text-gray-400 text-sm">Busca</p>
              <p className="text-white font-semibold">{formatRelationshipGoal(profile.relationshipGoal)}</p>
            </div>
          )}

          {/* Mostrar ROL solo para usuarios gay */}
          {profile.orientation === 'gay' && profile.role && (
            <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg p-3 border border-purple-500/30">
              <p className="text-gray-400 text-sm">ROL</p>
              <p className="text-white font-semibold">{formatRole(profile.role)}</p>
            </div>
          )}
          
          {profile.children && (
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-400 text-sm">Hijos</p>
              <p className="text-white font-semibold capitalize">{profile.children.replace('_', ' ')}</p>
            </div>
          )}
          
          {profile.pets && (
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-400 text-sm">Mascotas</p>
              <p className="text-white font-semibold">{profile.pets}</p>
            </div>
          )}
          
          {profile.zodiacSign && (
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-400 text-sm">Signo</p>
              <p className="text-white font-semibold capitalize">{profile.zodiacSign}</p>
            </div>
          )}
          
          {profile.smoking && (
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-400 text-sm">Fumar</p>
              <p className="text-white font-semibold capitalize">{profile.smoking}</p>
            </div>
          )}
          
          {profile.drinking && (
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-400 text-sm">Beber</p>
              <p className="text-white font-semibold capitalize">{profile.drinking}</p>
            </div>
          )}
        </div>

        {/* Hobbies */}
        {profile.hobbies && profile.hobbies.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-3">🎯 Intereses</h2>
            <div className="flex flex-wrap gap-2">
              {profile.hobbies.map((hobby: string) => (
                <span
                  key={hobby}
                  className="bg-primary bg-opacity-20 text-primary px-4 py-2 rounded-full text-sm font-medium border border-primary"
                >
                  {hobby}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Idiomas */}
        {profile.languages && profile.languages.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-3">🌍 Idiomas</h2>
            <div className="flex flex-wrap gap-2">
              {profile.languages.map((language: string) => (
                <span
                  key={language}
                  className="bg-secondary bg-opacity-20 text-secondary px-4 py-2 rounded-full text-sm font-medium border border-secondary"
                >
                  {language}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Fotos Privadas - OCULTO TEMPORALMENTE PARA VERIFICACIÓN DE GOOGLE ADS */}
        {false && privatePhotos.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 border-2 border-accent">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-accent" />
                Fotos Privadas ({privatePhotos.length})
              </h2>
            </div>
            
            {privatePhotoAccess?.hasAccess ? (
              // Tiene acceso - mostrar fotos
              <div className="grid grid-cols-2 gap-3">
                {privatePhotos.map((photo: any, index: number) => (
                    <div
                      key={photo.id}
                      className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => {
                        const photoIndex = privatePhotos.findIndex((p: any) => p.id === photo.id)
                        setCurrentPrivatePhotoIndex(photoIndex >= 0 ? photoIndex : 0)
                        setShowPrivatePhotosModal(true)
                      }}
                    >
                      <ProtectedImage
                        src={photo.url}
                        alt={`Privada ${index + 1}`}
                        className="w-full h-full"
                      />
                    </div>
                  ))}
              </div>
            ) : privatePhotoAccess?.status === 'pending' ? (
              // Solicitud pendiente - mostrar fotos borrosas
              <div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {privatePhotos.map((photo: any, index: number) => (
                      <div key={photo.id} className="aspect-square rounded-lg overflow-hidden relative">
                        <img
                          src={photo.url}
                          alt={`Privada ${index + 1}`}
                          className="w-full h-full object-cover filter blur-md"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                          <Lock className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    ))}
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold mb-2">Solicitud Pendiente</p>
                  <p className="text-gray-400 text-sm">
                    Este usuario revisará tu solicitud pronto
                  </p>
                </div>
              </div>
            ) : privatePhotoAccess?.status === 'rejected' ? (
              // Solicitud rechazada - mostrar fotos borrosas
              <div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {privatePhotos.map((photo: any, index: number) => (
                      <div key={photo.id} className="aspect-square rounded-lg overflow-hidden relative">
                        <ProtectedImage
                          src={photo.url}
                          alt={`Privada ${index + 1}`}
                          className="w-full h-full filter blur-md"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                          <Lock className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    ))}
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold mb-2">Solicitud Rechazada</p>
                  <p className="text-gray-400 text-sm">
                    El usuario no ha concedido acceso a sus fotos privadas
                  </p>
                </div>
              </div>
            ) : (
              // Sin solicitud - CUALQUIERA puede solicitar acceso (NO requiere match)
              <div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {privatePhotos.map((photo: any, index: number) => (
                      <div key={photo.id} className="aspect-square rounded-lg overflow-hidden relative">
                        <ProtectedImage
                          src={photo.url}
                          alt={`Privada ${index + 1}`}
                          className="w-full h-full filter blur-md"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                          <Lock className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    ))}
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold mb-3">Fotos Privadas Bloqueadas</p>
                  <p className="text-gray-400 text-sm mb-4">
                    Solicita acceso para ver las fotos privadas de este usuario
                  </p>
                  <Button
                    variant="accent"
                    onClick={handleRequestPrivatePhotoAccess}
                    isLoading={isRequestingAccess}
                    className="flex items-center gap-2 mx-auto"
                  >
                    <Eye className="w-5 h-5" />
                    Solicitar Acceso
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-3">
          <Button
            fullWidth
            variant={isLiked ? 'outline' : 'primary'}
            onClick={handleLike}
            className="flex items-center justify-center gap-2"
          >
            {isLiked ? '❤️ Te gusta' : '🤍 Me gusta'}
          </Button>
          <Button
            fullWidth
            variant="secondary"
            onClick={handleChat}
            className="flex items-center justify-center gap-2"
          >
            💬 Chatear
          </Button>
        </div>

        {/* Botón de bloquear */}
        <div className="mt-4">
          {isBlocked ? (
            <button
              onClick={handleUnblock}
              className="w-full py-3 px-4 rounded-lg bg-gray-700 text-white font-medium hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
            >
              <span>🔓</span>
              <span>Desbloquear usuario</span>
            </button>
          ) : (
            <button
              onClick={() => setShowBlockModal(true)}
              className="w-full py-3 px-4 rounded-lg bg-gray-800 text-gray-300 font-medium hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <span>🚫</span>
              <span>Bloquear usuario</span>
            </button>
          )}
        </div>

        {/* Botón volver */}
        <div className="text-center pt-4">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            ← Volver
          </button>
        </div>

        {/* Sección de denuncias */}
        <div className="mt-8 pt-6 border-t border-gray-800">
          <div className="bg-gray-800/50 rounded-lg p-4">
            {/* Contador de denuncias */}
            {reportCount > 0 && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <AlertTriangle className="text-green-500" size={20} />
                  Este perfil ha sido denunciado por:
                </h3>
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-300">- Engaño o estafa:</span>
                    <span className="font-bold text-white">{reportCountsByReason.scam} {reportCountsByReason.scam === 1 ? 'vez' : 'veces'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-300">- Fotos públicas inapropiadas:</span>
                    <span className="font-bold text-white">{reportCountsByReason.inappropriate_photos} {reportCountsByReason.inappropriate_photos === 1 ? 'vez' : 'veces'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-300">- Pide dinero a cambio de sexo:</span>
                    <span className="font-bold text-white">{reportCountsByReason.money_request} {reportCountsByReason.money_request === 1 ? 'vez' : 'veces'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-300">- Fotos falsas:</span>
                    <span className="font-bold text-white">{reportCountsByReason.fake_photos} {reportCountsByReason.fake_photos === 1 ? 'vez' : 'veces'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-300">- Es menor de edad:</span>
                    <span className="font-bold text-white">{reportCountsByReason.underage} {reportCountsByReason.underage === 1 ? 'vez' : 'veces'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-300">- Mensajes ofensivos o discriminatorios:</span>
                    <span className="font-bold text-white">{reportCountsByReason.hate_speech} {reportCountsByReason.hate_speech === 1 ? 'vez' : 'veces'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Botón de denunciar */}
            <button
              onClick={() => setShowReportModal(true)}
              disabled={hasReported}
              className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                hasReported
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              <AlertTriangle size={20} />
              {hasReported ? 'Ya has denunciado este perfil' : 'Denunciar perfil'}
            </button>

            {!hasReported && (
              <p className="text-xs text-gray-500 text-center mt-2">
                Solo puedes denunciar a cada perfil una vez
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Modal de denuncia */}
      {showReportModal && (
        <ReportModal
          profileId={id!}
          profileTitle={profile?.title || 'Usuario'}
          onClose={() => setShowReportModal(false)}
          onReportSent={() => {
            showToast('Denuncia enviada correctamente', 'success')
            loadReportData() // Recargar datos de denuncias
          }}
        />
      )}

      {/* Modal fotos privadas */}
      <Modal
        isOpen={showPrivatePhotosModal}
        onClose={() => setShowPrivatePhotosModal(false)}
        title="Fotos Privadas"
        maxWidth="lg"
      >
        <div className="relative aspect-[3/4] max-h-[70vh]">
          <ProtectedImage
            src={privatePhotos[currentPrivatePhotoIndex]?.url}
            alt="Foto privada"
            className="w-full h-full"
          />
          
          {/* Navegación */}
          {privatePhotos.length > 1 && (
            <div className="absolute inset-0 flex items-center justify-between px-4">
              <button
                onClick={() => setCurrentPrivatePhotoIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentPrivatePhotoIndex === 0}
                className="bg-black bg-opacity-50 text-white rounded-full p-3 disabled:opacity-30 hover:bg-opacity-70"
              >
                ←
              </button>
              <button
                onClick={() => setCurrentPrivatePhotoIndex((prev) => Math.min(privatePhotos.length - 1, prev + 1))}
                disabled={currentPrivatePhotoIndex === privatePhotos.length - 1}
                className="bg-black bg-opacity-50 text-white rounded-full p-3 disabled:opacity-30 hover:bg-opacity-70"
              >
                →
              </button>
            </div>
          )}
          
          {/* Indicador */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-full text-sm">
            {currentPrivatePhotoIndex + 1} / {privatePhotos.length}
          </div>
        </div>
      </Modal>

      {/* Modal Premium - Match requerido */}
      <Modal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        title="Match requerido"
        maxWidth="sm"
      >
        <div className="text-center py-4">
          <div className="text-6xl mb-4">💔</div>
          <h3 className="text-xl font-bold text-white mb-3">
            Necesitas un match para chatear
          </h3>
          <p className="text-gray-400 mb-6">
            Los usuarios Free solo pueden chatear cuando <strong>AMBOS</strong> se han dado "Me gusta".
          </p>
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <p className="text-white font-semibold mb-2">Con 9Plus puedes:</p>
            <ul className="text-left text-gray-300 text-sm space-y-2">
              <li>✅ Chatear con solo dar like</li>
              <li>✅ Ver quién te ha dado like</li>
              <li>✅ Filtrar por edad y online</li>
              <li>✅ Chatear en cualquier ciudad</li>
            </ul>
          </div>
          <div className="flex gap-3">
            <Button
              fullWidth
              variant="outline"
              onClick={() => setShowPremiumModal(false)}
            >
              Volver
            </Button>
            <Button
              fullWidth
              variant="accent"
              onClick={() => navigate('/app/plus')}
            >
              Ver 9Plus
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Match - Estilo Tinder */}
      <MatchModal
        isOpen={showMatchModal}
        onClose={() => setShowMatchModal(false)}
        matchedProfile={profile}
      />

      {/* Modal de confirmación de bloqueo */}
      <Modal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        title="Bloquear usuario"
        maxWidth="sm"
      >
        <div className="text-center py-4">
          <div className="text-6xl mb-4">🚫</div>
          <h3 className="text-xl font-bold text-white mb-3">
            ¿Bloquear a {profile?.title}?
          </h3>
          <p className="text-gray-400 mb-6">
            Si bloqueas a este usuario:
          </p>
          <div className="bg-gray-800 rounded-lg p-4 mb-6 text-left">
            <ul className="text-gray-300 text-sm space-y-2">
              <li>❌ No podrás ver su perfil</li>
              <li>❌ No podrá ver tu perfil</li>
              <li>❌ No podrán enviarse mensajes</li>
              <li>❌ Se eliminará de tus matches</li>
            </ul>
          </div>
          <p className="text-gray-500 text-sm mb-6">
            Podrás desbloquear al usuario cuando quieras desde tu perfil bloqueado.
          </p>
          <div className="flex gap-3">
            <Button
              fullWidth
              variant="outline"
              onClick={() => setShowBlockModal(false)}
            >
              Cancelar
            </Button>
            <Button
              fullWidth
              variant="secondary"
              onClick={handleBlock}
              className="bg-red-500 hover:bg-red-600"
            >
              Bloquear
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

