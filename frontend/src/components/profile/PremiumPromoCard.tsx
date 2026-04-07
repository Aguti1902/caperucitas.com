import { Crown, Sparkles, Star, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface PremiumPromoCardProps {
  onClose: () => void
}

export default function PremiumPromoCard({ onClose }: PremiumPromoCardProps) {
  const navigate = useNavigate()

  const handleUpgrade = () => {
    navigate('/app/plus')
  }

  return (
    <div className="absolute inset-0 bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-yellow-400">
      <div className="relative h-full flex flex-col overflow-y-auto">
        {/* Header con gradiente */}
        <div className="relative bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 p-8 pb-12">
          {/* Estrellas decorativas */}
          <Star className="absolute top-4 left-4 w-6 h-6 text-yellow-200 animate-pulse" fill="currentColor" />
          <Star className="absolute top-6 right-8 w-4 h-4 text-yellow-200 animate-pulse" fill="currentColor" style={{ animationDelay: '0.5s' }} />
          <Sparkles className="absolute bottom-8 left-8 w-5 h-5 text-yellow-200 animate-pulse" style={{ animationDelay: '1s' }} />
          <Zap className="absolute bottom-6 right-6 w-6 h-6 text-yellow-200 animate-pulse" fill="currentColor" style={{ animationDelay: '0.3s' }} />

          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-yellow-300 to-amber-400 rounded-full flex items-center justify-center shadow-2xl border-4 border-yellow-200">
                <Crown className="w-14 h-14 text-yellow-900" fill="currentColor" strokeWidth={0} />
              </div>
              <div className="absolute -top-1 -right-1 w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center border-2 border-yellow-200 shadow-lg">
                <span className="text-white font-bold text-xs">9</span>
              </div>
            </div>
          </div>

          <h2 className="text-4xl font-black text-gray-900 text-center mb-2">
            ¡Hazte 9Plus!
          </h2>
          
          <p className="text-gray-800 text-center font-semibold text-base">
            Desbloquea todo el potencial de Caperucitas
          </p>
        </div>

        {/* Contenido */}
        <div className="flex-1 p-6 pb-8">
          {/* Beneficios */}
          <div className="space-y-3 mb-6">
            {[
              { icon: '❤️', text: 'Ver quién te ha dado like', color: 'from-[#fc4d5c] to-pink-500' },
              { icon: '👁️', text: 'Filtros por edad y estado online', color: 'from-[#00a3e8] to-blue-500' },
              { icon: '💬', text: 'Chatea desde cualquier ciudad', color: 'from-[#01cc00] to-green-500' },
              { icon: '♾️', text: 'Sin límite de perfiles', color: 'from-[#ff6600] to-orange-500' },
              { icon: '📍', text: 'Conoce la distancia exacta', color: 'from-[#ffcc00] to-yellow-500' },
            ].map((benefit, index) => (
              <div 
                key={index} 
                className="flex items-center gap-3 bg-gray-900 rounded-xl p-4 border border-gray-800 hover:border-yellow-400 transition-all"
              >
                <div className={`w-10 h-10 bg-gradient-to-br ${benefit.color} rounded-full flex items-center justify-center flex-shrink-0 text-xl shadow-lg`}>
                  {benefit.icon}
                </div>
                <span className="text-white font-medium text-sm">{benefit.text}</span>
              </div>
            ))}
          </div>

          {/* Badge premium */}
          <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 rounded-xl p-4 mb-6 text-center shadow-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-gray-900" />
              <span className="text-gray-900 font-black text-lg">PREMIUM</span>
              <Sparkles className="w-5 h-5 text-gray-900" />
            </div>
            <p className="text-gray-800 text-xs font-semibold">
              Miles de usuarios ya disfrutan de 9Plus
            </p>
          </div>

          {/* Botones */}
          <div className="space-y-3">
            <button
              onClick={handleUpgrade}
              className="w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 text-gray-900 font-black py-4 px-8 rounded-full text-lg hover:scale-105 transition-transform shadow-xl border-2 border-yellow-300"
            >
              Ver Planes
            </button>
            
            <button
              onClick={onClose}
              className="w-full text-gray-400 font-semibold py-3 px-8 rounded-full text-sm hover:text-white hover:bg-gray-800 transition-colors"
            >
              Continuar gratis
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

