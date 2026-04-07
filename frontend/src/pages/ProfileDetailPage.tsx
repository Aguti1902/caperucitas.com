import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '@/services/api'
import { showToast } from '@/store/toastStore'
import { useAuthStore } from '@/store/authStore'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ReportModal from '@/components/common/ReportModal'
import { AlertTriangle, Phone, MessageCircle, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react'
import { formatRelationshipGoal } from '@/utils/profileUtils'
import ProtectedImage from '@/components/common/ProtectedImage'

export default function ProfileDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportCount, setReportCount] = useState(0)
  const [reportCountsByReason, setReportCountsByReason] = useState({
    scam: 0, inappropriate_photos: 0, money_request: 0,
    fake_photos: 0, underage: 0, hate_speech: 0,
  })
  const [hasReported, setHasReported] = useState(false)

  // Navegación entre perfiles desde la lista
  const profileIds = useRef<string[]>(JSON.parse(sessionStorage.getItem('browseProfiles') || '[]'))
  const currentIndex = useRef<number>(parseInt(sessionStorage.getItem('browseIndex') || '-1'))

  // Touch swipe
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    if (id) {
      currentIndex.current = profileIds.current.indexOf(id)
    }
  }, [id])

  useEffect(() => {
    setCurrentPhotoIndex(0)
    loadProfile()
    if (isAuthenticated) {
      loadReportData()
    }
  }, [id])

  const loadProfile = async () => {
    if (!id) { navigate('/'); return }
    setIsLoading(true)
    try {
      // Usar endpoint público para que funcione sin autenticación
      const endpoint = isAuthenticated ? `/profile/${id}` : `/profile/public/${id}`
      const response = await api.get(endpoint)
      setProfile(response.data)
    } catch (error: any) {
      if (error.response?.status === 404) {
        showToast('Perfil no encontrado', 'error')
        navigate('/')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const loadReportData = async () => {
    try {
      const countRes = await api.get(`/reports/count/${id}`)
      setReportCount(countRes.data.total || 0)
      setReportCountsByReason(countRes.data.byReason || {})
      const checkRes = await api.get(`/reports/check/${id}`)
      setHasReported(checkRes.data.hasReported || false)
    } catch {}
  }

  const navigateToProfile = (direction: 'prev' | 'next') => {
    const ids = profileIds.current
    if (!ids.length) return
    const idx = currentIndex.current
    const newIdx = direction === 'next' ? idx + 1 : idx - 1
    if (newIdx >= 0 && newIdx < ids.length) {
      currentIndex.current = newIdx
      sessionStorage.setItem('browseIndex', String(newIdx))
      navigate(`/profile/${ids[newIdx]}`, { replace: true })
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(diff) > 60) {
      navigateToProfile(diff < 0 ? 'next' : 'prev')
    }
    touchStartX.current = null
  }

  if (isLoading) return <LoadingSpinner />

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Perfil no encontrado</p>
      </div>
    )
  }

  const publicPhotos = profile.photos?.filter((p: any) => p.type !== 'private') || []
  const currentPhoto = publicPhotos[currentPhotoIndex]

  const hasPrev = currentIndex.current > 0 && profileIds.current.length > 1
  const hasNext = currentIndex.current < profileIds.current.length - 1 && profileIds.current.length > 1

  const phoneClean = profile.phone?.replace(/\D/g, '')
  const whatsappClean = profile.whatsapp?.replace(/\D/g, '') || phoneClean

  return (
    <div
      className="max-w-2xl mx-auto pb-32"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Botón volver y navegación */}
      <div className="sticky top-0 z-30 bg-gray-950/90 backdrop-blur-sm flex items-center justify-between px-3 py-2 border-b border-gray-800">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        {/* Navegación prev/next */}
        {profileIds.current.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateToProfile('prev')}
              disabled={!hasPrev}
              className="p-1.5 rounded-full bg-gray-800 text-gray-300 hover:text-white disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-gray-500 text-xs">
              {currentIndex.current + 1} / {profileIds.current.length}
            </span>
            <button
              onClick={() => navigateToProfile('next')}
              disabled={!hasNext}
              className="p-1.5 rounded-full bg-gray-800 text-gray-300 hover:text-white disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Carrusel de fotos */}
      <div className="relative aspect-[3/4] bg-gray-900">
        {publicPhotos.length > 0 && currentPhoto ? (
          <>
            <ProtectedImage
              src={currentPhoto.url}
              alt={profile.title}
              className="w-full h-full"
            />

            {/* Flechas foto - click arriba/abajo para cambiar foto */}
            {publicPhotos.length > 1 && (
              <>
                {/* Zona click - mitad superior = foto anterior */}
                <button
                  onClick={() => setCurrentPhotoIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentPhotoIndex === 0}
                  className="absolute top-0 left-0 right-0 h-1/2 z-10 opacity-0"
                  aria-label="Foto anterior"
                />
                {/* Zona click - mitad inferior = foto siguiente */}
                <button
                  onClick={() => setCurrentPhotoIndex(prev => Math.min(publicPhotos.length - 1, prev + 1))}
                  disabled={currentPhotoIndex === publicPhotos.length - 1}
                  className="absolute bottom-0 left-0 right-0 h-1/2 z-10 opacity-0"
                  aria-label="Foto siguiente"
                />

                {/* Flechas izquierda/derecha visibles */}
                <button
                  onClick={() => setCurrentPhotoIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentPhotoIndex === 0}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 disabled:opacity-20 z-20 transition-all"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setCurrentPhotoIndex(prev => Math.min(publicPhotos.length - 1, prev + 1))}
                  disabled={currentPhotoIndex === publicPhotos.length - 1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 disabled:opacity-20 z-20 transition-all"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* Indicadores de foto */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                  {publicPhotos.map((_: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPhotoIndex(i)}
                      className={`rounded-full transition-all ${i === currentPhotoIndex ? 'bg-white w-6 h-2' : 'bg-white/50 w-2 h-2'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600 text-5xl">
            👤
          </div>
        )}
      </div>

      {/* Info del perfil */}
      <div className="px-4 py-5 space-y-5">
        {/* Nombre, edad y ubicación */}
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            {profile.title}, {profile.age}
            {profile.isOnline && (
              <span className="inline-flex items-center bg-green-500 rounded-full px-2 py-0.5 text-xs font-bold text-white">
                ● Online
              </span>
            )}
          </h1>
          {profile.city && (
            <p className="text-gray-400 mt-1">📍 {profile.city}</p>
          )}
          {profile.distance !== undefined && profile.distance !== null && (
            <p className="text-gray-500 text-sm">A {profile.distance} km de ti</p>
          )}
        </div>

        {/* Botones de contacto - ANCHOS, bien visibles */}
        {(profile.phone || profile.whatsapp) && (
          <div className="flex gap-3">
            {profile.phone && (
              <a
                href={`tel:${profile.phone}`}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors text-lg"
              >
                <Phone className="w-6 h-6" />
                Llamar
              </a>
            )}
            {whatsappClean && (
              <a
                href={`https://wa.me/${whatsappClean}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-colors text-lg"
              >
                <MessageCircle className="w-6 h-6" />
                WhatsApp
              </a>
            )}
          </div>
        )}

        {/* Descripción */}
        {profile.aboutMe && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Sobre mí</h2>
            <p className="text-gray-300 whitespace-pre-wrap">{profile.aboutMe}</p>
          </div>
        )}

        {/* Lo que ofrece */}
        {profile.lookingFor && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Lo que ofrezco</h2>
            <p className="text-gray-300 whitespace-pre-wrap">{profile.lookingFor}</p>
          </div>
        )}

        {/* Información detallada */}
        <div className="grid grid-cols-2 gap-3">
          {profile.height && (
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-400 text-xs">Altura</p>
              <p className="text-white font-semibold">{profile.height} cm</p>
            </div>
          )}
          {profile.bodyType && (
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-400 text-xs">Cuerpo</p>
              <p className="text-white font-semibold capitalize">{profile.bodyType}</p>
            </div>
          )}
          {profile.occupation && (
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-400 text-xs">Servicios</p>
              <p className="text-white font-semibold">{profile.occupation}</p>
            </div>
          )}
          {profile.relationshipGoal && (
            <div className="bg-gradient-to-br from-red-600/20 to-pink-600/20 rounded-lg p-3 border border-red-600/30">
              <p className="text-gray-400 text-xs">Tipo</p>
              <p className="text-white font-semibold">{formatRelationshipGoal(profile.relationshipGoal)}</p>
            </div>
          )}
          {profile.children && (
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-400 text-xs">Info adicional</p>
              <p className="text-white font-semibold capitalize">{profile.children.replace('_', ' ')}</p>
            </div>
          )}
          {profile.zodiacSign && (
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-400 text-xs">Signo</p>
              <p className="text-white font-semibold capitalize">{profile.zodiacSign}</p>
            </div>
          )}
        </div>

        {/* Hobbies / Servicios */}
        {profile.hobbies && profile.hobbies.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Servicios / Intereses</h2>
            <div className="flex flex-wrap gap-2">
              {profile.hobbies.map((hobby: string) => (
                <span
                  key={hobby}
                  className="bg-red-600/20 text-red-400 px-3 py-1 rounded-full text-sm font-medium border border-red-600/40"
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
            <h2 className="text-xl font-semibold text-white mb-3">Idiomas</h2>
            <div className="flex flex-wrap gap-2">
              {profile.languages.map((lang: string) => (
                <span
                  key={lang}
                  className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Sección de denuncias */}
        <div className="mt-6 pt-6 border-t border-gray-800">
          {reportCount > 0 && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-4">
              <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                <AlertTriangle className="text-orange-400" size={18} />
                Este perfil ha sido denunciado:
              </h3>
              <div className="space-y-1 text-sm">
                {reportCountsByReason.scam > 0 && <p className="text-gray-300">· Engaño/estafa: <strong>{reportCountsByReason.scam}x</strong></p>}
                {reportCountsByReason.inappropriate_photos > 0 && <p className="text-gray-300">· Fotos inapropiadas: <strong>{reportCountsByReason.inappropriate_photos}x</strong></p>}
                {reportCountsByReason.money_request > 0 && <p className="text-gray-300">· Pide dinero: <strong>{reportCountsByReason.money_request}x</strong></p>}
                {reportCountsByReason.fake_photos > 0 && <p className="text-gray-300">· Fotos falsas: <strong>{reportCountsByReason.fake_photos}x</strong></p>}
                {reportCountsByReason.underage > 0 && <p className="text-gray-300">· Posible menor: <strong>{reportCountsByReason.underage}x</strong></p>}
                {reportCountsByReason.hate_speech > 0 && <p className="text-gray-300">· Mensajes ofensivos: <strong>{reportCountsByReason.hate_speech}x</strong></p>}
              </div>
            </div>
          )}

          <button
            onClick={() => setShowReportModal(true)}
            disabled={hasReported || !isAuthenticated}
            className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm ${
              hasReported
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : !isAuthenticated
                ? 'bg-gray-800 text-gray-400 cursor-not-allowed'
                : 'bg-red-900/50 hover:bg-red-900/70 text-red-400 border border-red-800'
            }`}
          >
            <AlertTriangle size={16} />
            {hasReported
              ? 'Ya has denunciado este perfil'
              : !isAuthenticated
              ? 'Inicia sesión para denunciar'
              : 'Denunciar perfil'}
          </button>

          {/* Volver a búsqueda */}
          <div className="text-center mt-4">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-500 hover:text-gray-300 transition-colors text-sm"
            >
              ← Volver a la búsqueda
            </button>
          </div>
        </div>
      </div>

      {/* Botones flotantes en móvil */}
      {(profile.phone || whatsappClean) && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex gap-0 md:hidden shadow-2xl">
          {profile.phone && (
            <a
              href={`tel:${profile.phone}`}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 transition-colors text-lg"
            >
              <Phone className="w-6 h-6" />
              Llamar
            </a>
          )}
          {whatsappClean && (
            <a
              href={`https://wa.me/${whatsappClean}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-5 transition-colors text-lg"
            >
              <MessageCircle className="w-6 h-6" />
              WhatsApp
            </a>
          )}
        </div>
      )}

      {/* Modal de denuncia */}
      {showReportModal && isAuthenticated && (
        <ReportModal
          profileId={id!}
          profileTitle={profile?.title || 'Usuario'}
          onClose={() => setShowReportModal(false)}
          onReportSent={() => {
            showToast('Denuncia enviada correctamente', 'success')
            loadReportData()
          }}
        />
      )}
    </div>
  )
}
