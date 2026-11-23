import { useEffect, useState } from 'react'
import { MapPin, X } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { detectLocation } from '@/utils/geolocation'
import { api } from '@/services/api'

const SESSION_KEY = 'cap_mobile_loc_prompt_done'

/**
 * Sexo gratis + ubicación móvil: al entrar conectado, pedir GPS actual
 * (sin pisar la ubicación fija guardada).
 */
export default function MobileLocationPrompt() {
  const { isAuthenticated, hasProfile, user, refreshUserData } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const profile = user?.profile
  const eligible =
    isAuthenticated &&
    hasProfile &&
    profile?.profileType === 'sexo_gratis' &&
    !!profile?.mobileLocationEnabled

  useEffect(() => {
    if (!eligible) return
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION_KEY)) return
    setOpen(true)
  }, [eligible])

  const dismiss = () => {
    try {
      sessionStorage.setItem(SESSION_KEY, '1')
    } catch {
      /* ignore */
    }
    setOpen(false)
  }

  const accept = async () => {
    setBusy(true)
    setError(null)
    try {
      const result = await detectLocation()
      await api.put('/profile/location', {
        city: result.city,
        latitude: result.latitude,
        longitude: result.longitude,
        asMobile: true,
      })
      await refreshUserData()
      dismiss()
    } catch {
      setError(
        'No se pudo obtener el GPS. Seguiremos mostrando tu ubicación fija. Puedes reintentarlo más tarde desde Editar perfil.'
      )
    } finally {
      setBusy(false)
    }
  }

  if (!open || !eligible) return null

  return (
    <div className="fixed inset-0 z-[10050] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/75"
        aria-label="Cerrar"
        onClick={dismiss}
      />
      <div className="relative w-full sm:max-w-md bg-gray-950 border border-emerald-700/50 sm:rounded-2xl rounded-t-2xl shadow-2xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="bg-emerald-600/20 border border-emerald-500/40 rounded-xl p-2.5">
              <MapPin className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-white font-black text-lg leading-tight">¿Usar tu ubicación actual?</p>
              <p className="text-gray-400 text-sm mt-1 leading-relaxed">
                Tienes <strong className="text-emerald-300">ubicación móvil</strong> activada. Así
                podrás contactar y ser contactado cerca de donde estás ahora. Tu ubicación fija no
                se modifica; al desconectarte volverá a mostrarse.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="text-gray-500 hover:text-white p-1"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <p className="text-amber-300 text-xs bg-amber-950/40 border border-amber-700/40 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={accept}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors"
          >
            {busy ? 'Obteniendo GPS…' : 'Sí, usar mi ubicación actual'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={dismiss}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold py-3 rounded-xl transition-colors"
          >
            Seguir con ubicación fija
          </button>
        </div>
      </div>
    </div>
  )
}
