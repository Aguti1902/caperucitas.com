import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Logo from '@/components/common/Logo'

export default function NormasPage() {
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
            <h1 className="text-3xl font-bold text-white mb-2">Normas de la comunidad</h1>
            <p className="text-gray-500 text-sm">Caperucitas.com — directorio para adultos</p>
          </div>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Principios básicos</h2>
            <p>Caperucitas.com es un espacio para adultos basado en el respeto y la transparencia. Estas normas existen para garantizar un entorno seguro y de confianza para todos los usuarios.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">✅ Permitido</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>Publicar perfiles personales y profesionales de adultos mayores de 18 años</li>
              <li>Subir fotos propias o de las que tengas los derechos necesarios</li>
              <li>Indicar servicios, tarifas y disponibilidad en tu perfil</li>
              <li>Pausar tu perfil cuando no estés disponible</li>
              <li>Actualizar tu ubicación manualmente cuando lo desees</li>
              <li>Activar ROAM para aumentar tu visibilidad temporalmente</li>
              <li>Navegar y ver perfiles sin necesidad de registro</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">🚫 Absolutamente prohibido</h2>
            <div className="space-y-3">
              <div className="bg-red-900/20 border border-red-800 rounded-xl p-4">
                <p className="text-red-400 font-bold mb-2">Contenido con menores</p>
                <p className="text-sm">Cualquier contenido que involucre a personas menores de 18 años está terminantemente prohibido. Será eliminado inmediatamente y reportado a las autoridades.</p>
              </div>
              <ul className="space-y-2 list-disc list-inside">
                <li>Fotos de otras personas sin su consentimiento</li>
                <li>Datos personales de terceros (nombre real, dirección, teléfono ajeno)</li>
                <li>Perfiles falsos o suplantación de identidad</li>
                <li>Contenido que promueva la trata de personas o cualquier forma de explotación</li>
                <li>Spam, publicidad engañosa o precios falsos</li>
                <li>Contenido discriminatorio, amenazante o que incite al odio</li>
                <li>Múltiples cuentas para el mismo perfil</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">📸 Normas sobre fotos</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>Puedes subir hasta <strong className="text-white">7 fotos</strong> por perfil</li>
              <li>No se permiten fotos de menores de edad</li>
              <li>Confirmas que todas las personas que aparecen tienen 18 años o más</li>
              <li>No se permiten fotos que muestren actos sexuales explícitos en la foto de perfil principal</li>
              <li>Las fotos que incumplan las normas serán eliminadas sin previo aviso</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">⚖️ Consecuencias del incumplimiento</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong className="text-white">Aviso:</strong> para infracciones leves y primeras incidencias</li>
              <li><strong className="text-white">Eliminación del contenido:</strong> inmediata si viola las normas</li>
              <li><strong className="text-white">Suspensión del perfil:</strong> para infracciones reiteradas</li>
              <li><strong className="text-white">Eliminación permanente de la cuenta:</strong> para infracciones graves</li>
              <li><strong className="text-white">Denuncia a las autoridades:</strong> obligatoria en casos de contenido ilegal</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">🛡️ Cómo reportar contenido</h2>
            <p className="mb-3">Si encuentras contenido que infringe estas normas, puedes reportarlo desde el propio perfil usando el botón de denuncia, o enviando un email a:</p>
            <div className="bg-gray-800 rounded-xl p-4">
              <p><strong className="text-white">Email de seguridad:</strong> seguridad@caperucitas.com</p>
            </div>
            <p className="mt-3 text-sm">Revisamos todos los reportes en un plazo máximo de 24–48 horas.</p>
          </section>

          <div className="pt-4 border-t border-gray-700 flex flex-wrap gap-4 text-sm text-gray-500">
            <Link to="/terminos" className="hover:text-gray-300 transition-colors">Términos y Condiciones</Link>
            <Link to="/privacidad" className="hover:text-gray-300 transition-colors">Política de Privacidad</Link>
            <Link to="/cookies" className="hover:text-gray-300 transition-colors">Política de Cookies</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
