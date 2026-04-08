import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import Logo from '@/components/common/Logo'
import Input from '@/components/common/Input'
import Button from '@/components/common/Button'
import { Eye, EyeOff, CheckCircle } from 'lucide-react'
import ReCAPTCHA from 'react-google-recaptcha'

const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY
const hasRealRecaptchaKey = recaptchaSiteKey && recaptchaSiteKey !== '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'

const GENDER_OPTIONS = [
  { id: 'chica', label: '👩 Chica', desc: 'Perfil femenino' },
  { id: 'chico', label: '👨 Chico', desc: 'Perfil masculino' },
  { id: 'trans', label: '🏳️‍⚧️ Trans', desc: 'Perfil trans' },
  { id: 'casa', label: '🏠 Casa / Piso', desc: 'Perfil de local o piso' },
  { id: 'gay', label: '🌈 Gay', desc: 'Perfil gay' },
  { id: 'masajes', label: '💆 Masajes', desc: 'Servicios de masajes' },
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuthStore()
  const recaptchaRef = useRef<ReCAPTCHA>(null)

  const [step, setStep] = useState<1 | 2>(1)
  const [selectedGender, setSelectedGender] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleGenderSelect = (gender: string) => {
    setSelectedGender(gender)
    setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!selectedGender) {
      setError('Debes seleccionar una categoría')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (!acceptedTerms) {
      setError('Debes aceptar los términos y condiciones')
      return
    }

    if (hasRealRecaptchaKey && !captchaToken) {
      setError('Por favor, completa el CAPTCHA')
      return
    }

    setIsLoading(true)

    try {
      // Usamos la orientación como el género seleccionado para compatibilidad con el backend
      const result = await register(email, password, selectedGender, captchaToken || undefined)
      
      localStorage.setItem('userGender', selectedGender)
      
      if (result.requiresVerification) {
        navigate('/email-sent', {
          state: { email: result.email, orientation: selectedGender },
        })
      } else {
        navigate('/create-profile')
      }
    } catch (err: any) {
      setError(err.message || 'Error al registrar usuario')
      if (hasRealRecaptchaKey && recaptchaRef.current) {
        recaptchaRef.current.reset()
        setCaptchaToken(null)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-5 animate-fade-in">
        {/* Logo */}
        <div className="text-center">
          <Logo size="md" className="mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-white">Publicar mi perfil</h2>
          <p className="text-gray-400 text-sm mt-1">
            Gratis hasta el 1 de enero de 2027
          </p>
        </div>

        {/* Video 1 — siempre visible arriba */}
        <div className="relative w-full rounded-xl overflow-hidden shadow-xl" style={{ paddingTop: '56.25%' }}>
          <iframe className="absolute inset-0 w-full h-full" src="https://www.youtube.com/embed/1uSOwbfVdtA" title="Cómo registrarte" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        </div>

        {/* Paso 1: Seleccionar categoría */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-gray-300 text-center font-medium">
              ¿Qué tipo de perfil quieres publicar?
            </p>
            <div className="grid grid-cols-2 gap-3">
              {GENDER_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleGenderSelect(opt.id)}
                  className="bg-gray-900 hover:bg-gray-800 border-2 border-gray-700 hover:border-red-600 rounded-xl p-4 text-left transition-all group"
                >
                  <div className="text-2xl mb-2">{opt.label.split(' ')[0]}</div>
                  <div className="text-white font-semibold text-sm">{opt.label.split(' ').slice(1).join(' ')}</div>
                  <div className="text-gray-400 text-xs mt-1">{opt.desc}</div>
                </button>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={() => navigate('/')}
                className="text-gray-500 hover:text-gray-300 transition-colors text-sm"
              >
                ← Volver
              </button>
            </div>
          </div>
        )}

        {/* Paso 2: Datos de cuenta */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Categoría seleccionada */}
            <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-gray-400 text-xs">Categoría:</span>
                <p className="text-white font-semibold">
                  {GENDER_OPTIONS.find(o => o.id === selectedGender)?.label}
                </p>
              </div>
              <button
                onClick={() => setStep(1)}
                className="text-gray-400 hover:text-white text-sm underline"
              >
                Cambiar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
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
                    placeholder="Mínimo 6 caracteres"
                    className="input-field pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Info sobre email */}
              <div className="bg-gray-900 rounded-lg p-3 text-sm text-gray-400 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <p>
                  Se enviará un email de confirmación. Verifica tu cuenta para activar tu perfil.
                </p>
              </div>

              {/* CAPTCHA */}
              {hasRealRecaptchaKey && recaptchaSiteKey && (
                <div className="flex justify-center">
                  <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={recaptchaSiteKey}
                    onChange={(token) => { setCaptchaToken(token); setError('') }}
                    onExpired={() => setCaptchaToken(null)}
                    onErrored={() => { setCaptchaToken(null); setError('Error al cargar CAPTCHA') }}
                    theme="dark"
                  />
                </div>
              )}

              {/* Términos */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-red-600"
                />
                <span className="text-gray-400 text-sm">
                  Acepto los{' '}
                  <a href="/app/info" target="_blank" className="text-red-400 hover:underline">
                    Términos y Condiciones
                  </a>{' '}
                  y confirmo que tengo 18 años o más.
                </span>
              </label>

              <Button
                type="submit"
                fullWidth
                variant="primary"
                isLoading={isLoading}
                className="bg-red-600 hover:bg-red-700 border-0"
              >
                Crear mi perfil
              </Button>
            </form>

            <div className="text-center text-gray-400 text-sm">
              <p>
                ¿Ya tienes cuenta?{' '}
                <Link to="/login" className="text-red-400 hover:underline font-semibold">
                  Iniciar sesión
                </Link>
              </p>
            </div>

            {/* Video 2 — al final del formulario */}
            <div className="relative w-full rounded-xl overflow-hidden shadow-xl" style={{ paddingTop: '56.25%' }}>
              <iframe className="absolute inset-0 w-full h-full" src="https://www.youtube.com/embed/vUVizeSgAkg" title="Funciones Caperucitas" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
