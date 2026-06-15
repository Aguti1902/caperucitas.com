import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import ProtectedImage from './ProtectedImage'
import { getProfileCoverPhoto } from '@/utils/profileUtils'

interface MatchModalProps {
  isOpen: boolean
  onClose: () => void
  matchedProfile: any
}

export default function MatchModal({ isOpen, onClose, matchedProfile }: MatchModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const navigate = useNavigate()

  if (!isOpen || !matchedProfile) return null

  const coverPhoto = getProfileCoverPhoto(matchedProfile)

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
      {/* Overlay animado */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-pink-500/30 to-purple-600/30 backdrop-blur-sm" />
      
      {/* Confetti effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-20px`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          >
            {['💕', '💖', '❤️', '💗', '💓'][Math.floor(Math.random() * 5)]}
          </div>
        ))}
      </div>

      {/* Contenido */}
      <div className="relative bg-gray-900 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-scale-in">
        {/* Título principal */}
        <div className="text-center mb-6">
          <div className="text-8xl mb-4 animate-pulse">✨</div>
          <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-pink-500 to-purple-600 mb-2">
            ¡IT'S A MATCH!
          </h2>
          <p className="text-gray-400 text-lg">
            ¡A {matchedProfile.title} también le gustas!
          </p>
        </div>

        {/* Foto del match */}
        <div className="relative mb-6">
          <div className="w-48 h-48 mx-auto rounded-full overflow-hidden border-4 border-primary shadow-2xl">
            {coverPhoto ? (
              <ProtectedImage
                src={coverPhoto.url}
                alt={matchedProfile.title}
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-800 text-6xl">
                👤
              </div>
            )}
          </div>
          
          {/* Corazón flotante */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-ping">
            <Heart className="w-16 h-16 text-primary fill-primary" />
          </div>
        </div>

        {/* Info del match */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-white mb-1">
            {matchedProfile.title}, {matchedProfile.age}
          </h3>
          <p className="text-gray-400">
            📍 {matchedProfile.city}
          </p>
        </div>

        {/* Botones */}
        <div className="space-y-3">
          <button
            onClick={() => {
              onClose()
              navigate(`/app/chat/${matchedProfile.id}`)
            }}
            className="w-full bg-gradient-to-r from-primary to-pink-600 text-white font-bold py-4 px-6 rounded-full hover:scale-105 transition-transform shadow-lg"
          >
            💬 Enviar Mensaje
          </button>
          
          <button
            onClick={onClose}
            className="w-full bg-gray-800 text-white font-semibold py-3 px-6 rounded-full hover:bg-gray-700 transition-colors"
          >
            Seguir Buscando
          </button>
        </div>
      </div>
    </div>
  )
}

