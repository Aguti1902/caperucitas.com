import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '@/services/api'
import Logo from '@/components/common/Logo'
import Button from '@/components/common/Button'
import { Eye, EyeOff, CheckCircle } from 'lucide-react'
import BackNavBar from '@/components/common/BackNavBar'

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setIsLoading(true)

    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword: password,
      })
      setSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al restablecer la contraseña')
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

          <div className="bg-gray-900 rounded-xl p-8 border-2 border-success">
            <CheckCircle className="w-20 h-20 text-success mx-auto mb-4" />
            
            <h2 className="text-3xl font-bold text-white mb-4">
              ¡Contraseña restablecida!
            </h2>
            
            <p className="text-gray-300 mb-6">
              Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
            </p>

            <Button
              fullWidth
              variant="primary"
              onClick={() => navigate('/')}
            >
              Ir al inicio de sesión
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
            Restablecer contraseña
          </h2>
          <p className="text-gray-400 mt-2">
            Ingresa tu nueva contraseña
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Campo de contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Mínimo 6 caracteres"
                className="input-field pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Campo de confirmar contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirmar contraseña
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Repite tu contraseña"
                className="input-field pr-12"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            fullWidth
            variant="primary"
            isLoading={isLoading}
            className="mt-6"
          >
            Restablecer contraseña
          </Button>
        </form>

      </div>
      </div>
    </div>
  )
}

