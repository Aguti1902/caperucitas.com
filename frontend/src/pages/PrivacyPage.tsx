import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Logo from '@/components/common/Logo'

export default function PrivacyPage() {
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
            <h1 className="text-3xl font-bold text-white mb-2">Política de Privacidad</h1>
            <p className="text-gray-500 text-sm">Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Responsable del tratamiento</h2>
            <p>Caperucitas.com es el responsable del tratamiento de los datos personales recogidos a través de este sitio web. Contacto: <strong className="text-white">privacidad@caperucitas.com</strong></p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Datos que recopilamos</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong className="text-white">Registro:</strong> Email y contraseña (almacenada cifrada con bcrypt)</li>
              <li><strong className="text-white">Perfil:</strong> Nombre/alias, edad, categoría, descripción, servicios, idiomas, ciudad, fotos</li>
              <li><strong className="text-white">Contacto:</strong> Número de teléfono y WhatsApp (opcionales, visibles en el perfil)</li>
              <li><strong className="text-white">Ubicación:</strong> Coordenadas GPS solo cuando el usuario pulsa "Actualizar ubicación"</li>
              <li><strong className="text-white">Técnicos:</strong> Dirección IP, navegador, sistema operativo (para seguridad y estadísticas)</li>
              <li><strong className="text-white">Pagos:</strong> Procesados íntegramente por Stripe — no almacenamos datos de tarjeta</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Finalidad del tratamiento</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>Crear y gestionar cuentas de usuario y perfiles en el directorio</li>
              <li>Mostrar perfiles públicamente a los visitantes del sitio</li>
              <li>Enviar emails transaccionales (verificación de cuenta, recuperación de contraseña)</li>
              <li>Procesar pagos de suscripciones y funciones ROAM</li>
              <li>Prevenir fraudes y garantizar la seguridad del servicio</li>
              <li>Cumplir con obligaciones legales aplicables</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Base legal</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong className="text-white">Ejecución de contrato</strong> (Art. 6.1.b RGPD): para prestar el servicio de directorio</li>
              <li><strong className="text-white">Consentimiento</strong> (Art. 6.1.a RGPD): para el tratamiento de datos opcionales</li>
              <li><strong className="text-white">Interés legítimo</strong> (Art. 6.1.f RGPD): para prevención de fraude y mejora del servicio</li>
              <li><strong className="text-white">Obligación legal</strong> (Art. 6.1.c RGPD): para cumplimiento normativo</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Proveedores de servicios (encargados)</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong className="text-white">Supabase / PostgreSQL:</strong> Base de datos en servidores europeos</li>
              <li><strong className="text-white">Railway:</strong> Hosting del servidor backend</li>
              <li><strong className="text-white">Vercel:</strong> Hosting del frontend</li>
              <li><strong className="text-white">Cloudinary:</strong> Almacenamiento de imágenes</li>
              <li><strong className="text-white">Resend:</strong> Envío de emails transaccionales</li>
              <li><strong className="text-white">Stripe:</strong> Procesamiento de pagos (PCI DSS compliant)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Conservación de datos</h2>
            <p>Los datos se conservan mientras la cuenta esté activa. Al pausar el perfil, los datos se mantienen pero el perfil no aparece en búsquedas. Al solicitar la eliminación de cuenta, los datos se borran en un plazo máximo de 30 días, salvo obligación legal de conservarlos.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Tus derechos (RGPD)</h2>
            <p className="mb-3">Puedes ejercer en cualquier momento los siguientes derechos enviando un email a <strong className="text-white">privacidad@caperucitas.com</strong>:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Acceso a tus datos personales</li>
              <li>Rectificación de datos inexactos</li>
              <li>Supresión ("derecho al olvido")</li>
              <li>Limitación del tratamiento</li>
              <li>Portabilidad de los datos</li>
              <li>Oposición al tratamiento</li>
            </ul>
            <p className="mt-3">También puedes presentar una reclamación ante la <strong className="text-white">Agencia Española de Protección de Datos (AEPD)</strong> en <a href="https://www.aepd.es" className="text-red-400 hover:text-red-300" target="_blank" rel="noopener noreferrer">www.aepd.es</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">8. Menores de edad</h2>
            <p>Caperucitas.com es un sitio exclusivo para mayores de 18 años. No recopilamos ni tratamos datos de menores de manera consciente. Si detectamos que un menor ha creado una cuenta, la eliminaremos inmediatamente.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">9. Seguridad</h2>
            <p>Aplicamos medidas técnicas y organizativas de seguridad: cifrado HTTPS/TLS en todas las comunicaciones, contraseñas cifradas con bcrypt, tokens JWT con caducidad corta, y rate-limiting en endpoints de autenticación para prevenir ataques de fuerza bruta.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">10. Contacto</h2>
            <div className="bg-gray-800 rounded-xl p-4 space-y-1">
              <p><strong className="text-white">Sitio web:</strong> caperucitas.com</p>
              <p><strong className="text-white">Privacidad:</strong> privacidad@caperucitas.com</p>
              <p><strong className="text-white">Soporte:</strong> soporte@caperucitas.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
