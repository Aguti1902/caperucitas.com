import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/services/api'
import Logo from '@/components/common/Logo'
import Input from '@/components/common/Input'
import Button from '@/components/common/Button'
import { Mail } from 'lucide-react'
import BackNavBar from '@/components/common/BackNavBar'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setIsLoading(true)

    try {
      await api.post('/auth/forgot-password', { email })
      setSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al procesar la solicitud')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col">
        <BackNavBar backTo="/login" />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6 text-center animate-fade-in">
          <Logo size="lg" />

          <div className="bg-gray-900 rounded-xl p-8 border-2 border-primary">
            <Mail className="w-20 h-20 text-primary mx-auto mb-4" />
            
            <h2 className="text-3xl font-bold text-white mb-4">
              ¡Email enviado!
            </h2>
            
            <p className="text-gray-300 mb-2">
              Si el email está registrado en nuestro sistema, recibirás un enlace para restablecer tu contraseña.
            </p>
            
            <p className="text-primary font-semibold text-lg mb-6">
              {email}
            </p>
            
            <div className="bg-gray-800 rounded-lg p-4 text-left text-sm text-gray-300 space-y-2 mb-6">
              <p>📧 <strong>Revisa tu bandeja de entrada</strong></p>
              <p>📂 Si no lo ves, <strong>revisa spam o correo no deseado</strong></p>
              <p>⏰ El enlace expira en <strong>1 hora</strong></p>
            </div>

            <Button
              fullWidth
              variant="primary"
              onClick={() => navigate('/')}
            >
              Volver al inicio
            </Button>
          </div>
        </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <BackNavBar backTo="/login" />
      <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4 animate-fade-in">
        {/* Logo */}
        <div className="text-center">
          <Logo size="md" className="mb-2" />
          <h2 className="text-2xl font-bold text-white">
            ¿Olvidaste tu contraseña?
          </h2>
          <p className="text-gray-400 mt-2">
            Ingresa tu email y te enviaremos un enlace para restablecerla
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="tu@email.com"
          />

          <Button
            type="submit"
            fullWidth
            variant="primary"
            isLoading={isLoading}
            className="mt-6"
          >
            Enviar enlace de recuperación
          </Button>
        </form>

      </div>
      </div>
    </div>
  )
}

