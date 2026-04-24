import { useEffect } from 'react'
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useToastStore } from '@/store/toastStore'

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] flex flex-col gap-2 w-[90vw] max-w-sm pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

interface ToastItemProps {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onClose: () => void
}

const STYLES = {
  success: { bg: 'bg-green-900/95 border-green-500/50', icon: <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" /> },
  error:   { bg: 'bg-red-900/95 border-red-500/50',   icon: <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" /> },
  warning: { bg: 'bg-yellow-900/95 border-yellow-500/50', icon: <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" /> },
  info:    { bg: 'bg-gray-800/95 border-gray-600/50', icon: <Info className="w-5 h-5 text-blue-400 flex-shrink-0" /> },
}

function ToastItem({ message, type, duration = 4000, onClose }: ToastItemProps) {
  useEffect(() => {
    if (duration <= 0) return
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  }, [duration, onClose])

  const { bg, icon } = STYLES[type]

  return (
    <div
      className={`${bg} border rounded-xl shadow-2xl px-4 py-3 flex items-start gap-3 pointer-events-auto animate-slide-up backdrop-blur-sm`}
      style={{ animation: 'slide-up 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
    >
      {icon}
      <p className="text-white text-sm flex-1 leading-snug">{message}</p>
      <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors flex-shrink-0 mt-0.5">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
