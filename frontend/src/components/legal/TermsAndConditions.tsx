export default function TermsAndConditions() {
  return (
    <div className="prose prose-invert max-w-none">
      <h1 className="text-3xl font-bold text-white mb-6">Términos y Condiciones de Uso</h1>
      
      <p className="text-gray-400 text-sm mb-6">
        Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">1. Aceptación de los Términos</h2>
        <p className="text-gray-300 mb-4">
          Al acceder y utilizar 9citas.com (en adelante, "el Servicio"), operado por SMM4U LLC Social Media Marketing Four You 
          (en adelante, "la Empresa", "nosotros" o "nuestro"), usted acepta estar legalmente vinculado por estos 
          Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar el Servicio.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">2. Elegibilidad</h2>
        <p className="text-gray-300 mb-4">
          Para utilizar el Servicio, debe:
        </p>
        <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
          <li>Tener al menos 18 años de edad</li>
          <li>Tener la capacidad legal para celebrar un contrato vinculante</li>
          <li>No estar prohibido de usar el Servicio bajo las leyes aplicables</li>
          <li>No haber sido suspendido o eliminado previamente del Servicio</li>
        </ul>
        <p className="text-gray-300">
          Al crear una cuenta, declara y garantiza que cumple con todos estos requisitos.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">3. Registro y Cuenta de Usuario</h2>
        <h3 className="text-xl font-semibold text-white mb-3">3.1 Creación de Cuenta</h3>
        <p className="text-gray-300 mb-4">
          Para acceder a ciertas funciones del Servicio, debe crear una cuenta proporcionando información precisa, 
          actual y completa. Es su responsabilidad mantener la confidencialidad de su cuenta y contraseña.
        </p>
        <h3 className="text-xl font-semibold text-white mb-3">3.2 Responsabilidad de la Cuenta</h3>
        <p className="text-gray-300 mb-4">
          Usted es responsable de todas las actividades que ocurran bajo su cuenta. Debe notificarnos inmediatamente 
          de cualquier uso no autorizado de su cuenta.
        </p>
        <h3 className="text-xl font-semibold text-white mb-3">3.3 Veracidad de la Información</h3>
        <p className="text-gray-300">
          Debe proporcionar información verdadera sobre su identidad, edad, orientación sexual y otros datos personales. 
          Los perfiles falsos, la suplantación de identidad o el uso de fotos de terceros sin autorización resultarán 
          en la suspensión inmediata de su cuenta.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">4. Normas de Conducta</h2>
        <p className="text-gray-300 mb-4">
          Al utilizar el Servicio, usted acepta NO:
        </p>
        <ul className="list-disc list-inside text-gray-300 space-y-2">
          <li>Publicar contenido que sea ilegal, ofensivo, difamatorio, amenazante, abusivo o que viole los derechos de terceros</li>
          <li>Solicitar o promover servicios sexuales a cambio de dinero o compensación</li>
          <li>Publicar desnudos explícitos en fotos públicas (pechos, genitales o glúteos descubiertos)</li>
          <li>Acosar, intimidar o discriminar a otros usuarios por motivos de raza, religión, orientación sexual, género, discapacidad o nacionalidad</li>
          <li>Hacerse pasar por otra persona o entidad</li>
          <li>Utilizar el Servicio con fines comerciales sin nuestro consentimiento previo por escrito</li>
          <li>Recopilar información de otros usuarios sin su consentimiento</li>
          <li>Transmitir virus, malware o cualquier código malicioso</li>
          <li>Interferir con el funcionamiento normal del Servicio</li>
          <li>Crear múltiples cuentas o cuentas falsas</li>
          <li>Registrarse en una categoría de orientación sexual que no le corresponda</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">5. Contenido del Usuario</h2>
        <h3 className="text-xl font-semibold text-white mb-3">5.1 Propiedad del Contenido</h3>
        <p className="text-gray-300 mb-4">
          Usted conserva todos los derechos de propiedad sobre el contenido que publica en el Servicio (fotos, mensajes, perfil). 
          Sin embargo, al publicar contenido, nos otorga una licencia mundial, no exclusiva, transferible, sublicenciable y 
          libre de regalías para usar, reproducir, modificar, adaptar, publicar y distribuir dicho contenido en relación con 
          la operación del Servicio.
        </p>
        <h3 className="text-xl font-semibold text-white mb-3">5.2 Eliminación de Contenido</h3>
        <p className="text-gray-300 mb-4">
          Nos reservamos el derecho, pero no la obligación, de revisar, monitorear y eliminar contenido que, a nuestra 
          discreción, viole estos Términos o sea objetable.
        </p>
        {/* OCULTO TEMPORALMENTE PARA VERIFICACIÓN DE GOOGLE ADS */}
        {false && (
        <>
        <h3 className="text-xl font-semibold text-white mb-3">5.3 Fotos Privadas</h3>
        <p className="text-gray-300">
          El Servicio permite subir fotos privadas que solo serán visibles para usuarios específicos a los que usted 
          otorgue acceso. Usted es responsable de decidir a quién otorga acceso y del contenido de dichas fotos.
        </p>
        </>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">6. Suscripción 9Plus</h2>
        <h3 className="text-xl font-semibold text-white mb-3">6.1 Servicios Premium</h3>
        <p className="text-gray-300 mb-4">
          El plan 9Plus ofrece funciones adicionales como perfiles ilimitados, filtros avanzados, mensajes sin 
          restricciones y otras características premium.
        </p>
        <h3 className="text-xl font-semibold text-white mb-3">6.2 Pago y Renovación</h3>
        <p className="text-gray-300 mb-4">
          Las suscripciones se cobran de forma recurrente (mensual o según el plan elegido) y se renuevan 
          automáticamente hasta que sean canceladas. Los pagos se procesarán a través de nuestra plataforma 
          de pagos (Stripe).
        </p>
        <h3 className="text-xl font-semibold text-white mb-3">6.3 Cancelación</h3>
        <p className="text-gray-300 mb-4">
          Puede cancelar su suscripción en cualquier momento desde la configuración de su cuenta. La cancelación 
          será efectiva al final del período de facturación actual.
        </p>
        <h3 className="text-xl font-semibold text-white mb-3">6.4 Reembolsos</h3>
        <p className="text-gray-300">
          No ofrecemos reembolsos por períodos de suscripción parcialmente utilizados. Si su cuenta es suspendida 
          o eliminada por violación de estos Términos, no tendrá derecho a reembolso.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">7. Propiedad Intelectual</h2>
        <p className="text-gray-300 mb-4">
          El Servicio, incluyendo su diseño, código fuente, logotipos, marcas comerciales y todo el contenido 
          proporcionado por nosotros, es propiedad de SMM4U LLC Social Media Marketing Four You y está protegido por leyes 
          de propiedad intelectual internacionales.
        </p>
        <p className="text-gray-300">
          No puede copiar, modificar, distribuir, vender o alquilar ninguna parte del Servicio sin nuestro 
          consentimiento previo por escrito.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">8. Limitación de Responsabilidad</h2>
        <h3 className="text-xl font-semibold text-white mb-3">8.1 Uso del Servicio</h3>
        <p className="text-gray-300 mb-4">
          El Servicio se proporciona "tal cual" y "según disponibilidad". No garantizamos que el Servicio sea 
          ininterrumpido, seguro o libre de errores.
        </p>
        <h3 className="text-xl font-semibold text-white mb-3">8.2 Interacciones con Otros Usuarios</h3>
        <p className="text-gray-300 mb-4">
          No somos responsables de las interacciones entre usuarios, ya sea en línea o fuera de línea. Usted es 
          el único responsable de sus interacciones con otros usuarios y debe ejercer precaución y sentido común.
        </p>
        <h3 className="text-xl font-semibold text-white mb-3">8.3 Exclusión de Garantías</h3>
        <p className="text-gray-300">
          EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY, SMM4U LLC SOCIAL MEDIA MARKETING FOUR YOU RENUNCIA A TODAS LAS GARANTÍAS, 
          EXPRESAS O IMPLÍCITAS, INCLUYENDO GARANTÍAS DE COMERCIABILIDAD, IDONEIDAD PARA UN PROPÓSITO PARTICULAR 
          Y NO INFRACCIÓN.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">9. Indemnización</h2>
        <p className="text-gray-300">
          Usted acepta indemnizar, defender y mantener indemne a SMM4U LLC Social Media Marketing Four You, sus directores, 
          empleados y agentes de cualquier reclamo, daño, pérdida, responsabilidad y gasto (incluyendo honorarios 
          de abogados) que surja de: (a) su uso del Servicio; (b) su violación de estos Términos; o (c) su 
          violación de cualquier derecho de terceros.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">10. Suspensión y Terminación</h2>
        <p className="text-gray-300 mb-4">
          Podemos suspender o terminar su cuenta inmediatamente, sin previo aviso, si:
        </p>
        <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
          <li>Viola estos Términos y Condiciones</li>
          <li>Realiza actividades fraudulentas o ilegales</li>
          <li>Su conducta es perjudicial para otros usuarios o para el Servicio</li>
          <li>Así lo requiera la ley</li>
        </ul>
        <p className="text-gray-300">
          Tras la terminación, su derecho a usar el Servicio cesará inmediatamente y podemos eliminar su cuenta 
          y todo el contenido asociado.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">11. Modificaciones de los Términos</h2>
        <p className="text-gray-300">
          Nos reservamos el derecho de modificar estos Términos en cualquier momento. Las modificaciones entrarán 
          en vigor inmediatamente después de su publicación en el Servicio. Su uso continuado del Servicio después 
          de la publicación de cambios constituye su aceptación de dichos cambios.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">12. Ley Aplicable y Jurisdicción</h2>
        <p className="text-gray-300">
          Estos Términos se regirán e interpretarán de acuerdo con las leyes de Estados Unidos y del estado donde 
          SMM4U LLC Social Media Marketing Four You tenga su sede principal, sin dar efecto a ningún principio de conflictos 
          de leyes.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">13. Disposiciones Generales</h2>
        <h3 className="text-xl font-semibold text-white mb-3">13.1 Acuerdo Completo</h3>
        <p className="text-gray-300 mb-4">
          Estos Términos constituyen el acuerdo completo entre usted y SMM4U LLC Social Media Marketing Four You con respecto 
          al uso del Servicio.
        </p>
        <h3 className="text-xl font-semibold text-white mb-3">13.2 Divisibilidad</h3>
        <p className="text-gray-300 mb-4">
          Si alguna disposición de estos Términos se considera inválida o inaplicable, dicha disposición se 
          eliminará y las disposiciones restantes continuarán siendo válidas.
        </p>
        <h3 className="text-xl font-semibold text-white mb-3">13.3 Renuncia</h3>
        <p className="text-gray-300">
          Ninguna renuncia a cualquier término de estos Términos se considerará una renuncia adicional o 
          continua de dicho término o de cualquier otro término.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">14. Contacto</h2>
        <p className="text-gray-300 mb-2">
          Si tiene preguntas sobre estos Términos y Condiciones, puede contactarnos en:
        </p>
        <div className="bg-gray-800 rounded-lg p-4 text-gray-300">
          <p><strong className="text-white">Empresa:</strong> SMM4U LLC Social Media Marketing Four You</p>
          <p><strong className="text-white">Servicio:</strong> 9citas.com</p>
          <p><strong className="text-white">Email:</strong> legal@9citas.com</p>
          <p><strong className="text-white">Soporte:</strong> soporte@9citas.com</p>
        </div>
      </section>
    </div>
  )
}

