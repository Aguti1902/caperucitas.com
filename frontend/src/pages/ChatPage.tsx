import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import Modal from '@/components/common/Modal'
import Button from '@/components/common/Button'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Image, MapPin, Lock, Star } from 'lucide-react'
import { getSocket } from '@/services/socket'
import ProtectedImage from '@/components/common/ProtectedImage'

export default function ChatPage() {
  const { profileId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { decrementUnreadMessagesCount } = useNotificationStore()
  const [profile, setProfile] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  
  // Verificar si es usuario 9Plus
  const isPremium = user?.subscription?.isActive || false
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [myPhotos, setMyPhotos] = useState<any[]>([])
  const [isFavorite, setIsFavorite] = useState(false)
  const [peerTyping, setPeerTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<number | null>(null)
  const lastTypingEmit = useRef(0)

  useEffect(() => {
    // NO hacer scroll al inicio - mantener posición
    // Solo cargar datos
    loadProfile()
    loadMessages()
    loadMyPhotos()
    if (profileId) {
      checkFavorite()
    }
  }, [profileId, isPremium])

  // Polling cada segundo para recibir mensajes nuevos (respaldo de Socket.IO)
  useEffect(() => {
    if (!profileId) return

    // Esperar 1 segundo antes de empezar el polling para no sobrecargar
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        loadMessages(true) // Carga silenciosa (no muestra loading, no marca como leídos automáticamente)
      }, 1000) // Cada 1 segundo

      return () => {
        clearInterval(interval)
      }
    }, 1000)

    return () => {
      clearTimeout(timeout)
    }
  }, [profileId])

  // Escuchar mensajes en tiempo real con Socket.IO
  useEffect(() => {
    const socket = getSocket()
    if (!socket || !profileId) return

    console.log('💬 ChatPage: Escuchando mensajes en tiempo real para:', profileId)

    const handleNewMessage = (message: any) => {
      console.log('📨 Nuevo mensaje recibido:', message)
      
      // Solo añadir si el mensaje es de este chat
      if (message.fromProfileId === profileId || message.toProfileId === profileId) {
        setMessages((prev) => {
          // Evitar duplicados
          const exists = prev.some((m) => m.id === message.id)
          if (exists) return prev
          
          return [...prev, message]
        })
        
        // Marcar como leído si es un mensaje recibido
        if (message.fromProfileId === profileId && !message.isRead) {
          api.put(`/messages/${profileId}/read`).then(() => {
            decrementUnreadMessagesCount()
          }).catch(console.error)
        }
      }
    }

    const handleMessageSent = (message: any) => {
      console.log('✅ Mensaje enviado confirmado:', message)
      // El mensaje ya se añadió al enviar, pero actualizamos por si acaso
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === message.id)
        if (exists) {
          return prev.map((m) => m.id === message.id ? message : m)
        }
        return [...prev, message]
      })
    }

    const handleTyping = (data: any) => {
      if (data?.fromProfileId === profileId) {
        setPeerTyping(true)
        if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = window.setTimeout(() => setPeerTyping(false), 3000)
      }
    }
    const handleStopTyping = (data: any) => {
      if (data?.fromProfileId === profileId) setPeerTyping(false)
    }

    socket.on('new_message', handleNewMessage)
    socket.on('message_sent', handleMessageSent)
    socket.on('user_typing', handleTyping)
    socket.on('user_stop_typing', handleStopTyping)

    return () => {
      socket.off('new_message', handleNewMessage)
      socket.off('message_sent', handleMessageSent)
      socket.off('user_typing', handleTyping)
      socket.off('user_stop_typing', handleStopTyping)
    }
  }, [profileId, decrementUnreadMessagesCount])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadProfile = async () => {
    try {
      const response = await api.get(`/profile/${profileId}`)
      setProfile(response.data)
    } catch (error) {
      console.error('Error al cargar perfil:', error)
      navigate('/app/inbox')
    }
  }

  const loadMyPhotos = async () => {
    try {
      const response = await api.get('/profile/me')
      setMyPhotos(response.data.photos || [])
    } catch (error) {
      console.error('Error al cargar mis fotos:', error)
    }
  }

  const loadMessages = async (silent = false) => {
    try {
      const response = await api.get(`/messages/${profileId}`)
      const newMessages = response.data.messages
      
      // Solo actualizar si hay cambios para evitar re-renders innecesarios
      setMessages((prev) => {
        // Comparar por IDs para evitar actualizar si no hay cambios
        if (prev.length === newMessages.length && 
            prev.every((msg, idx) => msg.id === newMessages[idx]?.id && msg.isRead === newMessages[idx]?.isRead)) {
          return prev // No hay cambios, mantener estado anterior
        }
        return newMessages
      })
      
      // Contar mensajes no leídos antes de marcarlos
      const unreadCount = newMessages.filter((msg: any) => 
        !msg.isRead && msg.fromProfileId === profileId
      ).length
      
      // Marcar como leídos (solo si no es una carga silenciosa o si hay no leídos)
      if (!silent && unreadCount > 0) {
        await api.put(`/messages/${profileId}/read`)
        // Actualizar el contador
        for (let i = 0; i < unreadCount; i++) {
          decrementUnreadMessagesCount()
        }
      }
    } catch (error) {
      if (!silent) {
        console.error('Error al cargar mensajes:', error)
      }
    } finally {
      if (!silent) {
        setIsLoading(false)
      }
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    try {
      const response = await api.post('/messages', {
        toProfileId: profileId,
        text: newMessage,
      })

      setMessages([...messages, response.data.data])
      setNewMessage('')
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al enviar mensaje')
    } finally {
      setIsSending(false)
    }
  }

  const handleSendPhoto = async (photoId: string) => {
    setIsSending(true)
    try {
      const response = await api.post('/messages', {
        toProfileId: profileId,
        photoId: photoId,
      })

      setMessages([...messages, response.data.data])
      setShowPhotoModal(false)
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al enviar foto')
    } finally {
      setIsSending(false)
    }
  }

  const handleSendLocation = async () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización')
      return
    }

    setIsSending(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          const response = await api.post('/messages', {
            toProfileId: profileId,
            location: { latitude, longitude },
          })
          setMessages([...messages, response.data.data])
        } catch (error: any) {
          alert(error.response?.data?.error || 'Error al enviar ubicación')
        } finally {
          setIsSending(false)
        }
      },
      () => {
        alert('No se pudo obtener tu ubicación')
        setIsSending(false)
      },
      {
        enableHighAccuracy: true, // Máxima precisión usando GPS
        timeout: 30000, // 30 segundos para obtener ubicación precisa
        maximumAge: 0, // No usar ubicación en caché, siempre obtener nueva
      }
    )
  }

  const checkFavorite = async () => {
    if (!profileId) return
    // Verificar favorito solo si es premium
    if (!isPremium) {
      setIsFavorite(false)
      return
    }
    try {
      const response = await api.get('/favorites')
      const favorites = response.data.favorites || []
      const isFav = favorites.some((fav: any) => fav.targetProfileId === profileId)
      setIsFavorite(isFav)
    } catch (error) {
      // Si no es premium, no mostrar error
      if (error && typeof error === 'object' && 'response' in error) {
        const err = error as any
        if (err.response?.status !== 403) {
          console.error('Error al verificar favorito:', error)
        }
      }
    }
  }

  const handleToggleFavorite = async () => {
    if (!profileId) return
    
    // Si no es premium, mostrar modal de 9Plus
    if (!isPremium) {
      setShowPremiumModal(true)
      return
    }
    
    try {
      if (isFavorite) {
        await api.delete(`/favorites/${profileId}`)
        setIsFavorite(false)
      } else {
        await api.post(`/favorites/${profileId}`)
        setIsFavorite(true)
      }
    } catch (error: any) {
      if (error.response?.status === 403 && error.response?.data?.requiresPremium) {
        setShowPremiumModal(true)
      } else {
        alert(error.response?.data?.error || 'Error al actualizar favorito')
      }
    }
  }

  const handleDeleteConversation = async () => {
    try {
      await api.delete(`/messages/${profileId}`)
      navigate('/app/inbox')
    } catch (error) {
      console.error('Error al eliminar conversación:', error)
    }
  }

  if (isLoading || !profile) {
    return <LoadingSpinner />
  }

  const coverPhoto = profile.photos?.find((p: any) => p.type === 'cover')

  return (
    <>
      {/* Ocultar menú inferior cuando estemos en el chat */}
      <style>{`
        nav[class*="fixed bottom-0"] {
          display: none;
        }
        body, html {
          overflow: hidden !important;
          position: fixed !important;
          width: 100% !important;
        }
        main {
          padding: 0 !important;
          overflow: hidden !important;
          height: 100vh !important;
        }
      `}</style>
      
      <div className="flex flex-col bg-dark h-screen overflow-hidden relative" style={{ height: '100dvh' }}>
      {/* Header del Chat - FIJO EN LA PARTE SUPERIOR - DEBAJO DEL HEADER GLOBAL */}
      <div 
        className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between flex-shrink-0"
        style={{
          position: 'fixed',
          top: '56px', // Debajo del header global (56px de altura)
          left: 0,
          right: 0,
          zIndex: 9999, // z-index muy alto
          height: '64px',
        }}
      >
        <button
          onClick={() => navigate('/app/inbox')}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ← Volver
        </button>

        <button
          onClick={() => navigate(`/app/profile/${profileId}`)}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800">
              {coverPhoto ? (
                <ProtectedImage
                  src={coverPhoto.url}
                  alt={profile.title}
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">
                  ?
                </div>
              )}
            </div>
            {profile.isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-gray-900"></div>
            )}
          </div>
          <div className="text-left">
            <h2 className="font-semibold text-white">{profile.title}</h2>
            {profile.isOnline ? (
              <p className="text-xs text-success">En línea</p>
            ) : (
              <p className="text-xs text-gray-500">
                {profile.lastSeenAt
                  ? `Última conexión: ${formatDistanceToNow(new Date(profile.lastSeenAt), { addSuffix: true, locale: es })}`
                  : 'Desconectado'}
              </p>
            )}
          </div>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleFavorite}
            className={`transition-colors ${
              isPremium
                ? isFavorite 
                  ? 'text-primary hover:text-primary/80' 
                  : 'text-gray-400 hover:text-primary'
                : 'text-gray-500 hover:text-gray-400 opacity-50'
            }`}
            title={
              isPremium
                ? isFavorite 
                  ? 'Quitar de favoritos' 
                  : 'Agregar a favoritos'
                : 'Requiere 9Plus - Haz clic para ver planes'
            }
          >
            <Star className={isFavorite && isPremium ? 'fill-current' : ''} size={20} />
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="text-gray-400 hover:text-red-500 transition-colors"
            title="Eliminar conversación"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Mensajes - Con padding para header global + header del chat + input */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ paddingTop: '140px', paddingBottom: '100px' }}>
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No hay mensajes aún</p>
            <p className="text-gray-500 text-sm mt-2">Envía el primer mensaje</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.fromProfileId === user?.profile?.id
            const time = formatDistanceToNow(new Date(message.createdAt), {
              addSuffix: true,
              locale: es,
            })

            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    isOwn
                      ? 'bg-primary text-white'
                      : 'bg-gray-800 text-white'
                  }`}
                >
                  {message.text && <p>{message.text}</p>}
                  {message.photo && (
                    <ProtectedImage
                      src={message.photo.url}
                      alt="Foto"
                      className="rounded-lg mt-1 max-w-full cursor-pointer hover:opacity-90"
                      onClick={() => window.open(message.photo.url, '_blank')}
                    />
                  )}
                  {message.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4" />
                      <span>Ubicación compartida</span>
                      <a
                        href={`https://www.google.com/maps?q=${message.location.latitude},${message.location.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        Ver en mapa
                      </a>
                    </div>
                  )}
                  
                  {/* Hora */}
                  <div className="flex items-center gap-2 text-xs opacity-70 mt-1">
                    <span>{time}</span>
                    {isOwn && !isPremium && (
                      // Usuario FREE: Mensaje de upgrade
                      <span className="text-yellow-400 text-[10px] cursor-pointer" onClick={() => navigate('/app/plus')} title="Contrata 9Plus">
                        🔒 9Plus
                      </span>
                    )}
                  </div>
                  
                  {/* Confirmación de lectura - Debajo del mensaje */}
                  {isOwn && isPremium && (
                    <div className="mt-1 text-xs">
                      {message.isRead ? (
                        <span className="text-white font-semibold flex items-center gap-1">
                          <span className="text-green-400">✓✓</span>
                          <span>leído</span>
                        </span>
                      ) : (
                        <span className="text-gray-400 flex items-center gap-1">
                          <span>✓</span>
                          <span>enviado</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
        {peerTyping && (
          <p className="text-gray-400 text-xs italic px-1">{profile?.title || 'Usuario'} está escribiendo…</p>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de mensaje - FIJO EN LA PARTE INFERIOR */}
      <form 
        onSubmit={handleSendMessage} 
        className="bg-gray-900 border-t border-gray-800 flex-shrink-0"
        style={{
          position: 'fixed',
          bottom: '64px', // Espacio para el footer del dashboard (64px)
          left: 0,
          right: 0,
          zIndex: 50000, // z-index MUY alto para estar por encima de TODO
          padding: '12px 16px',
          backgroundColor: '#111827', // bg-gray-900
        }}
      >
        <div className="flex gap-2 items-center w-full">
          {/* Botón de fotos */}
          <button
            type="button"
            onClick={() => setShowPhotoModal(true)}
            className="bg-gray-800 text-white rounded-full p-2 hover:bg-gray-700 transition-colors flex-shrink-0"
            title="Enviar foto"
            disabled={isSending}
          >
            <Image className="w-5 h-5" />
          </button>

          {/* Botón de ubicación */}
          <button
            type="button"
            onClick={handleSendLocation}
            className="bg-gray-800 text-white rounded-full p-2 hover:bg-gray-700 transition-colors flex-shrink-0"
            title="Compartir ubicación"
            disabled={isSending}
          >
            <MapPin className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value)
              const socket = getSocket()
              if (socket && profileId) {
                const now = Date.now()
                if (now - lastTypingEmit.current > 1200) {
                  lastTypingEmit.current = now
                  socket.emit('typing', { toProfileId: profileId })
                }
                if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current)
                typingTimeoutRef.current = window.setTimeout(() => {
                  socket.emit('stop_typing', { toProfileId: profileId })
                }, 2000)
              }
            }}
            placeholder="Escribe un mensaje..."
            className="flex-1 bg-gray-800 text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm min-w-0"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="bg-primary text-white rounded-full px-4 py-2 font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 text-sm whitespace-nowrap"
          >
            Enviar
          </button>
        </div>
      </form>

      {/* Modal de selección de fotos */}
      <Modal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        title="Selecciona una foto para enviar"
        maxWidth="lg"
      >
        {myPhotos.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            No tienes fotos en tu perfil
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {myPhotos.map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-square cursor-pointer group"
                onClick={() => handleSendPhoto(photo.id)}
              >
                <img
                  src={photo.url}
                  alt="Foto"
                  className="w-full h-full object-cover rounded-lg group-hover:opacity-80 transition-opacity"
                />
                {photo.type === 'private' && (
                  <div className="absolute top-2 right-2 bg-accent text-black px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Privada
                  </div>
                )}
                {photo.type === 'cover' && (
                  <div className="absolute top-2 right-2 bg-primary text-white px-2 py-1 rounded-full text-xs font-bold">
                    Portada
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all flex items-center justify-center">
                  <span className="text-white font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    Enviar
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Modal de eliminar conversación */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar conversación"
        maxWidth="sm"
      >
        <p className="text-gray-300 mb-6">
          ¿Estás seguro de que quieres eliminar esta conversación? Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowDeleteModal(false)}
            className="flex-1 bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleDeleteConversation}
            className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            Eliminar
          </button>
        </div>
      </Modal>

      {/* Modal Premium - Favoritos requiere 9Plus */}
      <Modal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        title="Favoritos - Exclusivo 9Plus"
        maxWidth="sm"
      >
        <div className="text-center py-4">
          <div className="text-6xl mb-4">⭐</div>
          <h3 className="text-xl font-bold text-white mb-3">
            Los favoritos son exclusivos de 9Plus
          </h3>
          <p className="text-gray-400 mb-6">
            Guarda tus perfiles favoritos con los que chateas para acceder a ellos rápidamente.
          </p>
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <p className="text-white font-semibold mb-2">Con 9Plus puedes:</p>
            <ul className="text-left text-gray-300 text-sm space-y-2">
              <li>⭐ Guardar perfiles favoritos</li>
              <li>✅ Chatear con solo dar like</li>
              <li>✅ Ver quién te ha dado like</li>
              <li>✅ Filtrar por edad y online</li>
              <li>✅ Chatear en cualquier ciudad</li>
              <li>✅ Ver distancia exacta a usuarios</li>
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
              onClick={() => {
                setShowPremiumModal(false)
                navigate('/app/plus')
              }}
            >
              Ver planes 9Plus
            </Button>
          </div>
        </div>
      </Modal>
      </div>
    </>
  )
}

