export default function CookiePolicy() {
  return (
    <div className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-bold text-white mb-6">Política de Cookies</h1>
      
      <p className="text-gray-400 text-sm mb-6">
        Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">1. ¿Qué son las Cookies?</h2>
        <p className="text-gray-300 mb-4">
          Las cookies son pequeños archivos de texto que se almacenan en su dispositivo (ordenador, tablet o móvil) 
          cuando visita un sitio web. Las cookies permiten que el sitio web recuerde sus acciones y preferencias 
          durante un período de tiempo, para que no tenga que volver a configurarlas cada vez que regrese o navegue 
          de una página a otra.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">2. ¿Cómo Utilizamos las Cookies?</h2>
        <p className="text-gray-300 mb-4">
          caperucitas.com, operado por SMM4U LLC Social Media Marketing Four You, utiliza cookies y tecnologías similares por varias razones:
        </p>
        <ul className="list-disc list-inside text-gray-300 space-y-2">
          <li>Mantener su sesión activa mientras navega por el Servicio</li>
          <li>Recordar sus preferencias y configuraciones</li>
          <li>Mejorar la seguridad y prevenir fraudes</li>
          <li>Analizar cómo los usuarios utilizan el Servicio</li>
          <li>Personalizar contenido y mostrar perfiles relevantes</li>
          <li>Medir la efectividad de nuestras campañas de marketing</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">3. Tipos de Cookies que Utilizamos</h2>
        
        <h3 className="text-xl font-semibold text-white mb-3">3.1 Cookies Estrictamente Necesarias</h3>
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <p className="text-gray-300 mb-2">
            <strong className="text-white">Propósito:</strong> Estas cookies son esenciales para que el Servicio funcione correctamente. 
            Sin ellas, no podría proporcionar servicios básicos.
          </p>
          <p className="text-gray-300 mb-2">
            <strong className="text-white">Ejemplos de uso:</strong>
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
            <li>Mantener su sesión iniciada</li>
            <li>Recordar su ID de usuario</li>
            <li>Autenticación y seguridad</li>
            <li>Prevención de fraudes</li>
          </ul>
          <p className="text-gray-300 mt-2">
            <strong className="text-white">Duración:</strong> Sesión o hasta 30 días
          </p>
          <p className="text-red-400 text-sm mt-2">
            ⚠️ Estas cookies no pueden ser deshabilitadas ya que el Servicio no funcionaría sin ellas.
          </p>
        </div>

        <h3 className="text-xl font-semibold text-white mb-3">3.2 Cookies de Funcionalidad</h3>
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <p className="text-gray-300 mb-2">
            <strong className="text-white">Propósito:</strong> Permiten que el Servicio recuerde las opciones que ha elegido y 
            proporcionan funcionalidades mejoradas y personalizadas.
          </p>
          <p className="text-gray-300 mb-2">
            <strong className="text-white">Ejemplos de uso:</strong>
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
            <li>Recordar sus preferencias de filtros</li>
            <li>Recordar su ciudad seleccionada</li>
            <li>Idioma preferido</li>
            <li>Tema de visualización (si aplicable)</li>
          </ul>
          <p className="text-gray-300 mt-2">
            <strong className="text-white">Duración:</strong> Hasta 1 año
          </p>
        </div>

        <h3 className="text-xl font-semibold text-white mb-3">3.3 Cookies de Rendimiento y Análisis</h3>
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <p className="text-gray-300 mb-2">
            <strong className="text-white">Propósito:</strong> Nos ayudan a entender cómo los visitantes interactúan con el Servicio, 
            recopilando información de forma anónima.
          </p>
          <p className="text-gray-300 mb-2">
            <strong className="text-white">Ejemplos de uso:</strong>
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
            <li>Número de visitantes</li>
            <li>Páginas más visitadas</li>
            <li>Tiempo de permanencia en el Servicio</li>
            <li>Errores encontrados</li>
            <li>Origen del tráfico</li>
          </ul>
          <p className="text-gray-300 mt-2">
            <strong className="text-white">Duración:</strong> Hasta 2 años
          </p>
        </div>

        <h3 className="text-xl font-semibold text-white mb-3">3.4 Cookies de Marketing y Publicidad</h3>
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <p className="text-gray-300 mb-2">
            <strong className="text-white">Propósito:</strong> Se utilizan para mostrarle anuncios relevantes y medir la 
            efectividad de nuestras campañas publicitarias.
          </p>
          <p className="text-gray-300 mb-2">
            <strong className="text-white">Ejemplos de uso:</strong>
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
            <li>Mostrar anuncios de 9Plus relevantes</li>
            <li>Limitar el número de veces que ve un anuncio</li>
            <li>Medir la efectividad de campañas publicitarias</li>
          </ul>
          <p className="text-gray-300 mt-2">
            <strong className="text-white">Duración:</strong> Hasta 1 año
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">4. Cookies de Terceros</h2>
        <p className="text-gray-300 mb-4">
          Además de nuestras propias cookies, también utilizamos cookies de terceros para proporcionar y mejorar el Servicio:
        </p>
        
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">Stripe</h3>
            <p className="text-gray-300 text-sm">
              <strong className="text-white">Propósito:</strong> Procesamiento seguro de pagos para suscripciones 9Plus
            </p>
            <p className="text-gray-300 text-sm mt-1">
              <strong className="text-white">Más información:</strong>{' '}
              <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Política de Privacidad de Stripe
              </a>
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">Cloudinary</h3>
            <p className="text-gray-300 text-sm">
              <strong className="text-white">Propósito:</strong> Almacenamiento, optimización y entrega de imágenes
            </p>
            <p className="text-gray-300 text-sm mt-1">
              <strong className="text-white">Más información:</strong>{' '}
              <a href="https://cloudinary.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Política de Privacidad de Cloudinary
              </a>
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">Vercel Analytics</h3>
            <p className="text-gray-300 text-sm">
              <strong className="text-white">Propósito:</strong> Análisis de rendimiento y uso del Servicio
            </p>
            <p className="text-gray-300 text-sm mt-1">
              <strong className="text-white">Más información:</strong>{' '}
              <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Política de Privacidad de Vercel
              </a>
            </p>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">5. Almacenamiento Local (LocalStorage)</h2>
        <p className="text-gray-300 mb-4">
          Además de cookies, también utilizamos el almacenamiento local de su navegador para guardar cierta información:
        </p>
        <ul className="list-disc list-inside text-gray-300 space-y-2">
          <li><strong className="text-white">Token de autenticación:</strong> Para mantener su sesión activa</li>
          <li><strong className="text-white">Preferencias de usuario:</strong> Configuraciones y preferencias personales</li>
          <li><strong className="text-white">Tutorial completado:</strong> Para no mostrar el tutorial de nuevo</li>
          <li><strong className="text-white">Caché temporal:</strong> Para mejorar el rendimiento</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">6. Cómo Controlar las Cookies</h2>
        
        <h3 className="text-xl font-semibold text-white mb-3">6.1 Configuración del Navegador</h3>
        <p className="text-gray-300 mb-4">
          La mayoría de los navegadores permiten controlar las cookies a través de sus configuraciones. Puede configurar 
          su navegador para rechazar cookies o eliminarlas. Sin embargo, tenga en cuenta que deshabilitar las cookies 
          necesarias afectará la funcionalidad del Servicio.
        </p>
        <p className="text-gray-300 mb-4">
          <strong className="text-white">Enlaces a la configuración de cookies por navegador:</strong>
        </p>
        <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
          <li>
            <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Google Chrome
            </a>
          </li>
          <li>
            <a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Mozilla Firefox
            </a>
          </li>
          <li>
            <a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Safari (Mac)
            </a>
          </li>
          <li>
            <a href="https://support.apple.com/es-es/HT201265" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Safari (iOS)
            </a>
          </li>
          <li>
            <a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Microsoft Edge
            </a>
          </li>
        </ul>

        <h3 className="text-xl font-semibold text-white mb-3">6.2 Modo de Navegación Privada</h3>
        <p className="text-gray-300 mb-4">
          Puede utilizar el modo de navegación privada o incógnito de su navegador, que no guardará cookies después 
          de cerrar la sesión. Sin embargo, seguirá utilizando cookies durante la sesión activa.
        </p>

        <h3 className="text-xl font-semibold text-white mb-3">6.3 Eliminación de Cookies</h3>
        <p className="text-gray-300">
          Puede eliminar las cookies almacenadas en su dispositivo en cualquier momento a través de la configuración 
          de su navegador. Tenga en cuenta que esto cerrará su sesión y eliminará sus preferencias guardadas.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">7. Cookies y Dispositivos Móviles</h2>
        <p className="text-gray-300 mb-4">
          Si accede al Servicio desde un dispositivo móvil, las cookies funcionan de manera similar al navegador de 
          escritorio. Además, podemos utilizar identificadores de dispositivos móviles para propósitos similares.
        </p>
        <p className="text-gray-300">
          Puede controlar el uso de identificadores de dispositivos a través de la configuración de privacidad de su 
          dispositivo móvil.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">8. Actualizaciones de esta Política</h2>
        <p className="text-gray-300">
          Podemos actualizar esta Política de Cookies de vez en cuando para reflejar cambios en nuestra práctica o 
          por otras razones operativas, legales o reglamentarias. Le notificaremos de cambios significativos 
          actualizando la fecha de "Última actualización" al inicio de esta política.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">9. Más Información</h2>
        <p className="text-gray-300 mb-4">
          Para más información sobre cómo tratamos sus datos personales, consulte nuestra{' '}
          <span className="text-primary">Política de Privacidad</span>.
        </p>
        <p className="text-gray-300">
          Para obtener más información general sobre cookies, visite:{' '}
          <a href="https://www.allaboutcookies.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            www.allaboutcookies.org
          </a>
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">10. Contacto</h2>
        <p className="text-gray-300 mb-4">
          Si tiene preguntas sobre nuestra Política de Cookies, puede contactarnos en:
        </p>
        <div className="bg-gray-800 rounded-lg p-4 text-gray-300">
          <p><strong className="text-white">Empresa:</strong> SMM4U LLC Social Media Marketing Four You</p>
          <p><strong className="text-white">Servicio:</strong> caperucitas.com</p>
          <p><strong className="text-white">Email:</strong> privacy@caperucitas.com</p>
          <p><strong className="text-white">Soporte:</strong> soporte@caperucitas.com</p>
        </div>
      </section>
    </div>
  )
}

