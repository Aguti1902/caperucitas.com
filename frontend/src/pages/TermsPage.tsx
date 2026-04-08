import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Logo from '@/components/common/Logo'

export default function TermsPage() {
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
            <h1 className="text-3xl font-bold text-white mb-2">Términos y Condiciones</h1>
            <p className="text-gray-500 text-sm">Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Aceptación de los términos</h2>
            <p>Al acceder y usar Caperucitas.com ("el Servicio"), aceptas estos Términos y Condiciones en su totalidad. Si no estás de acuerdo, no uses el Servicio. El uso continuado implica la aceptación de cualquier modificación posterior.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Requisitos de acceso</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>Debes tener como mínimo <strong className="text-white">18 años de edad</strong></li>
              <li>Debes estar en un país donde el acceso a este tipo de contenido sea legal</li>
              <li>No puedes ser una persona previamente expulsada del Servicio</li>
              <li>Al pulsar "Tengo 18 años" confirmas haber leído y aceptado estos términos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Naturaleza del servicio</h2>
            <p className="mb-3">Caperucitas.com es un <strong className="text-white">directorio de perfiles para adultos</strong>. El Servicio actúa únicamente como plataforma de publicación de perfiles. No somos intermediarios, no mediamos en ningún acuerdo entre partes, ni garantizamos la veracidad de los contenidos publicados.</p>
            <p>El contenido de cada perfil es responsabilidad exclusiva de quien lo publica.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Registro y cuentas</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>Para publicar un perfil debes crear una cuenta con un email válido</li>
              <li>Eres responsable de mantener la confidencialidad de tu contraseña</li>
              <li>No puedes crear cuentas falsas ni suplantaciones de terceros</li>
              <li>Una persona física solo puede tener una cuenta activa</li>
              <li>El registro es <strong className="text-white">gratuito hasta el 1 de enero de 2027</strong>, a partir de entonces requerirá suscripción de 20€/mes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Contenido prohibido</h2>
            <p className="mb-3">Está terminantemente prohibido publicar:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Cualquier contenido que involucre a menores de edad</li>
              <li>Contenido que promueva la trata de personas o cualquier actividad ilegal</li>
              <li>Datos personales de terceros sin su consentimiento</li>
              <li>Contenido difamatorio, amenazante o que incite al odio</li>
              <li>Spam, anuncios fraudulentos o información falsa</li>
              <li>Virus, malware o cualquier código dañino</li>
            </ul>
            <p className="mt-3">El incumplimiento conlleva la eliminación inmediata del perfil y la cuenta, y puede ser comunicado a las autoridades competentes.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Fotos y contenido</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>Solo puedes subir fotos en las que tengas los derechos necesarios</li>
              <li>No se permiten fotos de menores de edad en ningún contexto</li>
              <li>Confirmas que todas las personas que aparecen en tus fotos son mayores de 18 años</li>
              <li>Caperucitas.com se reserva el derecho de eliminar fotos que infrinjan estas normas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. ROAM y suscripciones</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong className="text-white">ROAM 3h:</strong> 5€ — el perfil aparece destacado en un radio de 8 km durante 3 horas desde la activación</li>
              <li><strong className="text-white">ROAM semanal:</strong> 35€ — 4 horas/día durante 7 días, en las horas elegidas</li>
              <li><strong className="text-white">Suscripción mensual (desde 2027):</strong> 20€/mes — imprescindible para aparecer en búsquedas</li>
              <li>Los pagos se procesan mediante Stripe y no son reembolsables salvo error técnico demostrable</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">8. Pausar y eliminar el perfil</h2>
            <p><strong className="text-white">Pausar:</strong> el perfil deja de aparecer en búsquedas pero los datos se conservan y puede reactivarse en cualquier momento.</p>
            <p className="mt-2"><strong className="text-white">Eliminar cuenta:</strong> todos los datos del perfil se borran permanentemente. Esta acción es irreversible.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">9. Limitación de responsabilidad</h2>
            <p>Caperucitas.com no se hace responsable de los contenidos publicados por los usuarios, ni de los acuerdos, encuentros o transacciones que puedan derivarse del uso del directorio. Usas el Servicio bajo tu propia responsabilidad.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">10. Modificaciones del servicio</h2>
            <p>Nos reservamos el derecho de modificar, suspender o interrumpir el Servicio en cualquier momento. Notificaremos cambios sustanciales con antelación razonable.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">11. Ley aplicable y jurisdicción</h2>
            <p>Estos términos se rigen por la legislación española. Para cualquier controversia, las partes se someten a los juzgados y tribunales de España, renunciando expresamente a cualquier otro fuero.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">12. Contacto</h2>
            <div className="bg-gray-800 rounded-xl p-4 space-y-1">
              <p><strong className="text-white">Email:</strong> legal@caperucitas.com</p>
              <p><strong className="text-white">Web:</strong> caperucitas.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
