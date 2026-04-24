import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import Logo from '@/components/common/Logo'
import Button from '@/components/common/Button'
import { CheckCircle, XCircle } from 'lucide-react'
import { useEffect } from 'react'

export default function VerifyEmailPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { setToken, refreshUserData } = useAuthStore()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    verifyEmail()
  }, [token])

  const verifyEmail = async () => {
    try {
      const response = await api.get(`/auth/verify-email/${token}`)
      
      // Guardar tokens y actualizar estado de autenticación
      if (response.data.accessToken) {
        setToken(response.data.accessToken, response.data.refreshToken)
        // Cargar datos del usuario para que isAuthenticated y hasProfile sean correctos
        await refreshUserData()
      }

      setStatus('success')
      setMessage(response.data.message)

      // Redirigir a crear perfil después de 2 segundos
      setTimeout(() => {
        navigate('/create-profile')
      }, 2000)
    } catch (error: any) {
      setStatus('error')
      setMessage(error.response?.data?.error || 'Error al verificar email')
    }
  }

  return (
    <div className="min-h-screen bg-dark flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <Logo size="lg" />

        {status === 'loading' && (
          <>
            <LoadingSpinner />
            <h2 className="text-2xl font-bold text-white">Verificando tu email...</h2>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-20 h-20 text-success mx-auto" />
            <h2 className="text-3xl font-bold text-white">¡Email Verificado!</h2>
            <p className="text-gray-300 text-lg">{message}</p>
            <p className="text-gray-400">
              Redirigiendo a crear tu perfil...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-20 h-20 text-danger mx-auto" />
            <h2 className="text-3xl font-bold text-white">Error</h2>
            <p className="text-gray-300 text-lg">{message}</p>
            <Button
              variant="primary"
              onClick={() => navigate('/')}
            >
              Volver al inicio
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

