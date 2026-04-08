import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Logo from '@/components/common/Logo'

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Logo size="sm" />
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 text-gray-300 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Política de Cookies</h1>
            <p className="text-gray-500 text-sm">Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. ¿Qué son las cookies?</h2>
            <p>Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas un sitio web. Permiten que el sitio recuerde tus preferencias y mantenga tu sesión activa entre visitas.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Cookies que utilizamos</h2>
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-xl p-4">
                <h3 className="font-semibold text-white mb-2">🔒 Cookies estrictamente necesarias</h3>
                <p className="text-sm mb-2">Imprescindibles para el funcionamiento del sitio. No pueden desactivarse.</p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li><strong className="text-white">refresh_token</strong> — Mantiene tu sesión iniciada (HttpOnly, Secure)</li>
                  <li><strong className="text-white">cookie_consent</strong> — Guarda tu elección sobre cookies</li>
                </ul>
              </div>

              <div className="bg-gray-800 rounded-xl p-4">
                <h3 className="font-semibold text-white mb-2">⚙️ Cookies funcionales</h3>
                <p className="text-sm mb-2">Mejoran la experiencia pero no son imprescindibles.</p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li><strong className="text-white">localStorage: authToken</strong> — Token de acceso JWT (caduca en 15 minutos)</li>
                  <li><strong className="text-white">localStorage: city</strong> — Ciudad seleccionada para los filtros de búsqueda</li>
                </ul>
              </div>

              <div className="bg-gray-800 rounded-xl p-4">
                <h3 className="font-semibold text-white mb-2">📊 Cookies analíticas</h3>
                <p className="text-sm">Actualmente no utilizamos cookies de análisis de terceros.</p>
              </div>

              <div className="bg-gray-800 rounded-xl p-4">
                <h3 className="font-semibold text-white mb-2">🎯 Cookies publicitarias</h3>
                <p className="text-sm">Caperucitas.com no utiliza cookies publicitarias de terceros.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Cookies de terceros</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong className="text-white">YouTube:</strong> Los vídeos incrustados pueden usar cookies para recordar preferencias de reproducción</li>
              <li><strong className="text-white">Stripe:</strong> Usa cookies propias para el procesamiento seguro de pagos</li>
            </ul>
            <p className="mt-3 text-sm">Estos terceros tienen sus propias políticas de privacidad independientes de Caperucitas.com.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Gestión de cookies</h2>
            <p className="mb-3">Puedes controlar las cookies desde:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>El <strong className="text-white">banner de cookies</strong> que aparece al entrar al sitio por primera vez</li>
              <li>La configuración de tu <strong className="text-white">navegador</strong> (Chrome, Firefox, Safari, etc.)</li>
            </ul>
            <p className="mt-3 text-sm text-yellow-400">⚠️ Desactivar las cookies necesarias puede impedir que la sesión funcione correctamente.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Base legal</h2>
            <p>El uso de cookies necesarias se basa en el <strong className="text-white">interés legítimo</strong> del prestador de servicios (Art. 6.1.f RGPD). El uso de cookies no esenciales requiere tu <strong className="text-white">consentimiento previo</strong> (Art. 6.1.a RGPD), conforme a la Ley 34/2002 (LSSI) y el RGPD.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Contacto</h2>
            <div className="bg-gray-800 rounded-xl p-4">
              <p><strong className="text-white">Email:</strong> privacidad@caperucitas.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
