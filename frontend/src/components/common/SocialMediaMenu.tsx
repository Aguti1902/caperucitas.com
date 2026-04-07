import { useState, useRef, useEffect } from 'react'
import { Globe, X, Instagram, Youtube, Music } from 'lucide-react'

const socialLinks = [
  {
    name: 'Twitter/X',
    url: 'https://x.com/Caperucitas_com',
    icon: X,
    color: 'text-white hover:text-gray-300',
  },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/Caperucitas_com/',
    icon: Instagram,
    color: 'text-white hover:text-pink-400',
  },
  {
    name: 'YouTube',
    url: 'https://www.youtube.com/@Caperucitas',
    icon: Youtube,
    color: 'text-white hover:text-red-500',
  },
  {
    name: 'TikTok',
    url: 'https://www.tiktok.com/@caperucitas.com',
    icon: Music,
    color: 'text-white hover:text-cyan-400',
  },
]

export default function SocialMediaMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleLinkClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Botón principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-300 hover:text-white transition-colors relative"
        title="Redes sociales"
      >
        <Globe className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Menú desplegable */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-2 min-w-[200px] z-50">
          <div className="px-3 py-2 border-b border-gray-700">
            <p className="text-xs text-gray-400 font-semibold">Síguenos en</p>
          </div>
          {socialLinks.map((social) => {
            const Icon = social.icon
            return (
              <button
                key={social.name}
                onClick={() => handleLinkClick(social.url)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-800 transition-colors text-left"
              >
                <Icon className={`w-5 h-5 ${social.color}`} />
                <span className="text-white text-sm">{social.name}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

