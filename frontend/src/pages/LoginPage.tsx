import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import Logo from '@/components/common/Logo'
import Input from '@/components/common/Input'
import Button from '@/components/common/Button'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [requiresVerification, setRequiresVerification] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setRequiresVerification(false)
    setIsLoading(true)

    try {
      await login(email, password)
      navigate('/app')
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión')
      if (err.response?.data?.requiresEmailVerification) {
        setRequiresVerification(true)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setIsResending(true)
    try {
      const { api } = await import('@/services/api')
      await api.post('/auth/resend-verification', { email })
      setError('Email de verificación reenviado. Por favor, revisa tu bandeja de entrada.')
      setRequiresVerification(false)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al reenviar el email de verificación')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-5 animate-fade-in">
        {/* Logo */}
        <div className="text-center">
          <Logo size="md" className="mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-white">Acceso Escorts</h2>
          <p className="text-gray-400 text-sm mt-1">
            Gestiona tu perfil y anuncio
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className={`${requiresVerification ? 'bg-yellow-500/10 border-yellow-500 text-yellow-400' : 'bg-red-500/10 border-red-500 text-red-400'} border px-4 py-3 rounded-lg text-sm`}>
              <p className="mb-1">{error}</p>
              {requiresVerification && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="text-yellow-300 hover:text-yellow-200 underline text-xs font-semibold"
                >
                  {isResending ? 'Reenviando...' : '¿No recibiste el email? Haz clic aquí para reenviarlo'}
                </button>
              )}
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

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="input-field pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            fullWidth
            variant="primary"
            isLoading={isLoading}
            className="mt-2 bg-red-600 hover:bg-red-700 border-0"
          >
            Entrar
          </Button>
        </form>

        {/* Olvidé contraseña */}
        <div className="text-center">
          <Link
            to="/forgot-password"
            className="text-gray-400 hover:text-red-400 transition-colors text-sm"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {/* Registro */}
        <div className="text-center bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-gray-400 text-sm mb-3">¿No tienes cuenta de escort?</p>
          <Link
            to="/register"
            className="block w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors text-center"
          >
            Publicar mi anuncio gratis
          </Link>
          <p className="text-gray-500 text-xs mt-2">
            Gratis hasta el 1 de enero de 2027
          </p>
        </div>

        {/* Volver */}
        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="text-gray-500 hover:text-gray-300 transition-colors text-sm"
          >
            ← Volver al inicio
          </button>
        </div>
      </div>
    </div>
  )
}
