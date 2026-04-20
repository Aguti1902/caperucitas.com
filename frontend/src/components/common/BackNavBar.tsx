import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Logo from './Logo'

interface BackNavBarProps {
  title?: string
  backTo?: string
}

/**
 * Header fijo para páginas standalone (fuera de DashboardLayout).
 * Ocupa 56px y empuja el contenido hacia abajo con paddingTop automático.
 */
export default function BackNavBar({ title, backTo }: BackNavBarProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (backTo) navigate(backTo)
    else navigate(-1)
  }

  return (
    <>
      {/* Header fijo */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          height: '56px',
          paddingTop: 'env(safe-area-inset-top)',
        }}
        className="bg-gray-900 border-b border-gray-800 flex items-center px-3 gap-3 shadow-lg"
      >
        <button
          onClick={handleBack}
          className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-gray-800 transition-colors flex-shrink-0"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {title ? (
          <h1 className="text-white font-bold text-base truncate flex-1">{title}</h1>
        ) : (
          <Logo size="sm" className="h-8 w-auto object-contain" />
        )}
      </header>

      {/* Espaciador para empujar el contenido debajo del header fijo */}
      <div style={{ height: '56px', flexShrink: 0 }} />
    </>
  )
}
