import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '@/services/api'
import Logo from '@/components/common/Logo'
import Button from '@/components/common/Button'
import { Mail, RefreshCw, Home } from 'lucide-react'

export default function EmailSentPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const email = location.state?.email || ''
  const orientation = location.state?.orientation || ''
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [verifiedHint, setVerifiedHint] = useState(false)

  // Guardar orientación en localStorage
  useEffect(() => {
    if (orientation) {
      localStorage.setItem('userOrientation', orientation)
    }
  }, [orientation])

  /**
   * Remate PDF: NO redirigir automáticamente.
   * Si el email tarda, la redirección impedía pulsar «Reenviar enlace».
   * Solo salimos cuando el usuario clica «Volver al inicio».
   * Sí comprobamos verificación para mostrar un aviso opcional.
   */
  useEffect(() => {
    const checkVerification = async () => {
      const token = localStorage.getItem('accessToken')
      if (!token) return
      try {
        const response = await api.get('/auth/me')
        if (response.data.emailVerified) {
          setVerifiedHint(true)
        }
      } catch {
        /* seguir esperando */
      }
    }

    const interval = setInterval(checkVerification, 5000)
    checkVerification()
    return () => clearInterval(interval)
  }, [])

  const handleResend = async () => {
    if (!email) {
      alert('No hay email para reenviar. Vuelve a registrarte.')
      return
    }
    setIsResending(true)
    setResendSuccess(false)
    try {
      await api.post('/auth/resend-verification', { email })
      setResendSuccess(true)
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al reenviar email')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <Logo size="lg" />

        <div className="bg-gray-900 rounded-xl p-8 border-2 border-primary">
          <Mail className="w-20 h-20 text-primary mx-auto mb-4" />

          <h2 className="text-3xl font-bold text-white mb-4">
            ¡Revisa tu email!
          </h2>

          <p className="text-gray-300 mb-2">
            Hemos enviado un enlace de verificación a:
          </p>

          <p className="text-primary font-semibold text-lg mb-6">
            {email || 'tu correo'}
          </p>

          <div className="bg-gray-800 rounded-lg p-4 text-left text-sm text-gray-300 space-y-2 mb-6">
            <p>📧 <strong>Revisa tu bandeja de entrada</strong></p>
            <p>📂 Si no lo ves, <strong>revisa spam o correo no deseado</strong></p>
            <p>⏰ El enlace expira en <strong>24 horas</strong></p>
            <p>🔁 Puedes <strong>reenviar el enlace</strong> las veces que necesites</p>
          </div>

          {verifiedHint && (
            <div className="bg-emerald-500/15 border border-emerald-500 text-emerald-300 rounded-lg p-3 mb-4 text-sm">
              ✅ Email verificado. Abre el enlace del correo o pulsa abajo para continuar.
            </div>
          )}

          {resendSuccess && (
            <div className="bg-success bg-opacity-20 border border-success text-success rounded-lg p-3 mb-4">
              ✅ Email reenviado correctamente
            </div>
          )}

          <Button
            fullWidth
            variant="outline"
            onClick={handleResend}
            isLoading={isResending}
            className="mb-3"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Reenviar enlace de activación
          </Button>

          {verifiedHint && (
            <Button
              fullWidth
              variant="primary"
              onClick={() => navigate('/create-profile')}
              className="mb-3 bg-red-600 hover:bg-red-700 border-0"
            >
              Continuar a crear perfil
            </Button>
          )}

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3.5 rounded-xl transition-colors"
          >
            <Home className="w-5 h-5" />
            VOLVER AL INICIO
          </button>
        </div>
      </div>
    </div>
  )
}
