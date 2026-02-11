export default function PrivacyPolicy() {
  return (
    <div className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-bold text-white mb-6">Política de Privacidad</h1>
      
      <p className="text-gray-400 text-sm mb-6">
        Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">1. Introducción</h2>
        <p className="text-gray-300 mb-4">
          SMM4U LLC Social Media Marketing Four You ("nosotros", "nuestro" o "la Empresa") opera el servicio 9citas.com 
          (en adelante, "el Servicio"). Esta Política de Privacidad describe cómo recopilamos, usamos, 
          almacenamos y protegemos su información personal cuando utiliza nuestro Servicio.
        </p>
        <p className="text-gray-300">
          Al utilizar el Servicio, usted acepta la recopilación y uso de información de acuerdo con esta política. 
          Si no está de acuerdo con alguna parte de esta política, no debe utilizar el Servicio.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">2. Información que Recopilamos</h2>
        
        <h3 className="text-xl font-semibold text-white mb-3">2.1 Información que Usted Proporciona</h3>
        <p className="text-gray-300 mb-4">
          Recopilamos información que usted nos proporciona directamente al:
        </p>
        <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
          <li><strong className="text-white">Registro:</strong> Nombre, dirección de correo electrónico, fecha de nacimiento, género, orientación sexual, contraseña</li>
          <li><strong className="text-white">Perfil:</strong> Fotos, descripción personal, intereses, preferencias, ciudad, ubicación geográfica</li>
          <li><strong className="text-white">Contenido:</strong> Mensajes, likes, matches</li>
          <li><strong className="text-white">Pagos:</strong> Información de tarjeta de crédito (procesada por Stripe, no almacenamos datos de tarjetas)</li>
          <li><strong className="text-white">Comunicaciones:</strong> Cuando se pone en contacto con soporte o servicios</li>
        </ul>

        <h3 className="text-xl font-semibold text-white mb-3">2.2 Información Recopilada Automáticamente</h3>
        <p className="text-gray-300 mb-4">
          Cuando utiliza el Servicio, recopilamos automáticamente:
        </p>
        <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
          <li><strong className="text-white">Datos de ubicación:</strong> Ubicación geográfica aproximada basada en su dirección IP o GPS (si lo permite)</li>
          <li><strong className="text-white">Datos de dispositivo:</strong> Tipo de dispositivo, sistema operativo, navegador, identificadores únicos</li>
          <li><strong className="text-white">Datos de uso:</strong> Páginas visitadas, tiempo de uso, interacciones con otros usuarios, funciones utilizadas</li>
          <li><strong className="text-white">Datos de conexión:</strong> Dirección IP, fecha y hora de acceso, estado de conexión (online/offline)</li>
          <li><strong className="text-white">Cookies y tecnologías similares:</strong> Ver nuestra Política de Cookies para más detalles</li>
        </ul>

        <h3 className="text-xl font-semibold text-white mb-3">2.3 Información de Terceros</h3>
        <p className="text-gray-300">
          Podemos recibir información adicional sobre usted de servicios de autenticación de terceros 
          si elige registrarse a través de ellos (como Google o Facebook).
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">3. Cómo Utilizamos su Información</h2>
        <p className="text-gray-300 mb-4">
          Utilizamos su información personal para:
        </p>
        <ul className="list-disc list-inside text-gray-300 space-y-2">
          <li><strong className="text-white">Proporcionar el Servicio:</strong> Crear y gestionar su cuenta, mostrar su perfil a otros usuarios, facilitar matches y mensajes</li>
          <li><strong className="text-white">Personalización:</strong> Mostrarle perfiles relevantes basados en ubicación, preferencias y actividad</li>
          <li><strong className="text-white">Comunicación:</strong> Enviarle notificaciones sobre matches, mensajes, actualizaciones del Servicio</li>
          <li><strong className="text-white">Seguridad:</strong> Prevenir fraudes, proteger contra actividades ilegales, hacer cumplir nuestros Términos</li>
          <li><strong className="text-white">Mejoras:</strong> Analizar el uso del Servicio para mejorarlo y desarrollar nuevas funciones</li>
          <li><strong className="text-white">Marketing:</strong> Enviarle información sobre características premium (9Plus) y promociones (puede optar por no recibirlas)</li>
          <li><strong className="text-white">Cumplimiento legal:</strong> Cumplir con obligaciones legales y responder a solicitudes legales</li>
          <li><strong className="text-white">Procesamiento de pagos:</strong> Gestionar suscripciones y transacciones (a través de Stripe)</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">4. Compartición de su Información</h2>
        
        <h3 className="text-xl font-semibold text-white mb-3">4.1 Con Otros Usuarios</h3>
        <p className="text-gray-300 mb-4">
          Su perfil (nombre, edad, fotos públicas, descripción, ubicación aproximada) es visible para otros 
          usuarios del Servicio según las configuraciones de privacidad y filtros aplicados.
        </p>

        <h3 className="text-xl font-semibold text-white mb-3">4.2 Con Proveedores de Servicios</h3>
        <p className="text-gray-300 mb-4">
          Compartimos información con proveedores de servicios que nos ayudan a operar el Servicio:
        </p>
        <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
          <li><strong className="text-white">Stripe:</strong> Procesamiento de pagos</li>
          <li><strong className="text-white">Vercel/Railway:</strong> Hosting y infraestructura</li>
          <li><strong className="text-white">Cloudinary:</strong> Almacenamiento y gestión de imágenes</li>
          <li><strong className="text-white">Servicios de análisis:</strong> Para entender el uso del Servicio</li>
        </ul>

        <h3 className="text-xl font-semibold text-white mb-3">4.3 Por Razones Legales</h3>
        <p className="text-gray-300 mb-4">
          Podemos divulgar su información si:
        </p>
        <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
          <li>Así lo requiera la ley o un proceso legal</li>
          <li>Sea necesario para proteger la seguridad de usuarios o del público</li>
          <li>Sea necesario para prevenir o investigar posibles delitos</li>
          <li>Sea necesario para hacer cumplir nuestros Términos y Condiciones</li>
        </ul>

        <h3 className="text-xl font-semibold text-white mb-3">4.4 Transferencias Empresariales</h3>
        <p className="text-gray-300">
          En caso de fusión, adquisición o venta de activos, su información puede ser transferida al nuevo 
          propietario del Servicio.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">5. Retención de Datos</h2>
        <p className="text-gray-300 mb-4">
          Conservamos su información personal mientras:
        </p>
        <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
          <li>Su cuenta esté activa</li>
          <li>Sea necesario para proporcionar el Servicio</li>
          <li>Sea necesario para cumplir con obligaciones legales</li>
          <li>Sea necesario para resolver disputas y hacer cumplir nuestros acuerdos</li>
        </ul>
        <p className="text-gray-300">
          Cuando elimine su cuenta, eliminaremos o anonimizaremos su información personal, excepto la que 
          debamos conservar por razones legales o legítimas.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">6. Seguridad de los Datos</h2>
        <p className="text-gray-300 mb-4">
          Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger su información:
        </p>
        <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
          <li>Encriptación de datos en tránsito (HTTPS/SSL)</li>
          <li>Encriptación de contraseñas (bcrypt)</li>
          <li>Servidores seguros con acceso restringido</li>
          <li>Monitoreo regular de seguridad</li>
          <li>Cumplimiento de mejores prácticas de la industria</li>
        </ul>
        <p className="text-gray-300">
          Sin embargo, ningún método de transmisión por Internet o almacenamiento electrónico es 100% seguro. 
          No podemos garantizar la seguridad absoluta de su información.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">7. Sus Derechos de Privacidad</h2>
        <p className="text-gray-300 mb-4">
          Dependiendo de su ubicación, puede tener los siguientes derechos:
        </p>
        <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
          <li><strong className="text-white">Acceso:</strong> Solicitar una copia de la información que tenemos sobre usted</li>
          <li><strong className="text-white">Rectificación:</strong> Solicitar la corrección de información inexacta</li>
          <li><strong className="text-white">Eliminación:</strong> Solicitar la eliminación de su información personal</li>
          <li><strong className="text-white">Portabilidad:</strong> Recibir sus datos en un formato estructurado y transferible</li>
          <li><strong className="text-white">Oposición:</strong> Oponerse al procesamiento de sus datos para ciertos fines</li>
          <li><strong className="text-white">Restricción:</strong> Solicitar la limitación del procesamiento de sus datos</li>
          <li><strong className="text-white">Retirar consentimiento:</strong> Puede retirar su consentimiento en cualquier momento</li>
        </ul>
        <p className="text-gray-300 mb-4">
          Para ejercer estos derechos, contacte con nosotros en: <strong className="text-white">privacy@9citas.com</strong>
        </p>
        <p className="text-gray-300">
          También puede eliminar su cuenta directamente desde la configuración de la aplicación.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">8. GDPR (Usuarios de la Unión Europea)</h2>
        <p className="text-gray-300 mb-4">
          Si usted es un residente de la Unión Europea, tiene derechos adicionales bajo el GDPR:
        </p>
        <h3 className="text-xl font-semibold text-white mb-3">8.1 Base Legal para el Procesamiento</h3>
        <p className="text-gray-300 mb-4">
          Procesamos su información personal bajo las siguientes bases legales:
        </p>
        <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
          <li><strong className="text-white">Ejecución de contrato:</strong> Para proporcionar el Servicio según nuestros Términos</li>
          <li><strong className="text-white">Consentimiento:</strong> Cuando usted nos da permiso explícito</li>
          <li><strong className="text-white">Intereses legítimos:</strong> Para mejorar y proteger el Servicio</li>
          <li><strong className="text-white">Obligación legal:</strong> Para cumplir con leyes aplicables</li>
        </ul>
        <h3 className="text-xl font-semibold text-white mb-3">8.2 Transferencias Internacionales</h3>
        <p className="text-gray-300">
          Sus datos pueden ser transferidos y procesados en países fuera de la UE. Aseguramos que estas 
          transferencias cumplan con el GDPR mediante cláusulas contractuales estándar y otras salvaguardas apropiadas.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">9. Privacidad de Menores</h2>
        <p className="text-gray-300">
          El Servicio está destinado exclusivamente a personas mayores de 18 años. No recopilamos 
          intencionalmente información de menores de edad. Si descubrimos que hemos recopilado información 
          de un menor, la eliminaremos inmediatamente. Si cree que un menor está usando el Servicio, 
          contáctenos en: <strong className="text-white">safety@9citas.com</strong>
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">10. Enlaces a Terceros</h2>
        <p className="text-gray-300">
          El Servicio puede contener enlaces a sitios web de terceros. No somos responsables de las 
          prácticas de privacidad de estos sitios. Le recomendamos leer sus políticas de privacidad.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">11. Cambios a esta Política</h2>
        <p className="text-gray-300">
          Podemos actualizar esta Política de Privacidad periódicamente. Le notificaremos de cambios 
          significativos publicando la nueva política en el Servicio y actualizando la fecha de "Última 
          actualización". Su uso continuado del Servicio después de los cambios constituye su aceptación 
          de la nueva política.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">12. Contacto</h2>
        <p className="text-gray-300 mb-4">
          Si tiene preguntas o inquietudes sobre esta Política de Privacidad o el manejo de sus datos, 
          puede contactarnos en:
        </p>
        <div className="bg-gray-800 rounded-lg p-4 text-gray-300">
          <p><strong className="text-white">Empresa:</strong> SMM4U LLC Social Media Marketing Four You</p>
          <p><strong className="text-white">Servicio:</strong> 9citas.com</p>
          <p><strong className="text-white">Email de Privacidad:</strong> privacy@9citas.com</p>
          <p><strong className="text-white">Email General:</strong> soporte@9citas.com</p>
          <p><strong className="text-white">Email Legal:</strong> legal@9citas.com</p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">13. Autoridad de Control (UE)</h2>
        <p className="text-gray-300">
          Si es residente de la Unión Europea y considera que el procesamiento de sus datos viola el GDPR, 
          tiene derecho a presentar una queja ante la autoridad de protección de datos de su país.
        </p>
      </section>
    </div>
  )
}

