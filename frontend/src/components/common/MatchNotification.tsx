import { useEffect, useState } from 'react'
import { getSocket } from '@/services/socket'
import { useNavigate } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'

interface MatchProfile {
  id: string
  title: string
  age?: number
  photos?: { url: string }[]
  city?: string
}

interface MatchNotificationData {
  matchProfile: MatchProfile
  myProfile: {
    id: string
    title: string
  }
}

export default function MatchNotification() {
  const [match, setMatch] = useState<MatchNotificationData | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const socket = getSocket()
    if (!socket) {
      console.warn('⚠️ Socket no disponible para MatchNotification')
      return
    }

    console.log('✅ MatchNotification: Escuchando evento new_match')
    console.log('   Socket conectado:', socket.connected)
    console.log('   Socket ID:', socket.id)

    const handleNewMatch = (data: MatchNotificationData) => {
      console.log('🎉🎉🎉 MatchNotification: Recibido evento new_match', data)
      setMatch(data)
      setIsVisible(true)

      // NO auto-ocultar - el usuario debe cerrar manualmente
    }

    // Escuchar todos los eventos para debug
    socket.onAny((event, ...args) => {
      if (event === 'new_match') {
        console.log('📡 Evento recibido:', event, args)
      }
    })

    socket.on('new_match', handleNewMatch)

    return () => {
      socket.off('new_match', handleNewMatch)
      socket.offAny()
    }
  }, [])

  const handleSendMessage = () => {
    if (match) {
      setIsVisible(false)
      navigate(`/app/chat/${match.matchProfile.id}`)
    }
  }

  const handleKeepSearching = () => {
    setIsVisible(false)
    navigate('/app/navigate')
  }

  if (!isVisible || !match) return null

  const coverPhoto = match.matchProfile.photos?.[0]?.url || '/logo-caperucitas.jpeg'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-4 animate-fade-in">
      <div className="bg-transparent w-full max-w-md">
        {/* Estrellas decorativas */}
        <div className="flex items-center justify-center mb-4">
          <span className="text-4xl">✨</span>
          <span className="text-4xl mx-2">✨</span>
          <span className="text-4xl">✨</span>
        </div>

        {/* Título principal */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-3 bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          ¡IT'S A MATCH!
        </h1>
        
        <p className="text-white text-center text-lg mb-8">
          ¡A {match.matchProfile.title} también le gustas!
        </p>

        {/* Foto del perfil con borde degradado */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 via-red-500 to-pink-500 p-1 animate-pulse"></div>
            <div className="relative rounded-full overflow-hidden bg-gray-900 p-1">
              <img
                src={coverPhoto}
                alt={match.matchProfile.title}
                className="w-32 h-32 rounded-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Información del perfil */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-white mb-2">
            {match.matchProfile.title}
            {match.matchProfile.age && (
              <span className="text-gray-300 font-normal">, {match.matchProfile.age}</span>
            )}
          </h3>
          {match.matchProfile.city && (
            <div className="flex items-center justify-center gap-1 text-gray-300">
              <span className="text-red-500">📍</span>
              <span>{match.matchProfile.city}</span>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="space-y-3">
          <button
            onClick={handleSendMessage}
            className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white py-4 px-6 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg"
          >
            <MessageCircle className="w-6 h-6" />
            Enviar Mensaje
          </button>
          <button
            onClick={handleKeepSearching}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white py-4 px-6 rounded-2xl font-semibold text-lg transition-colors"
          >
            Seguir Buscando
          </button>
        </div>
      </div>
    </div>
  )
}
