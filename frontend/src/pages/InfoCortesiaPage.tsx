import { Link } from 'react-router-dom'
import InfoPageLayout, { InfoSection, InfoCta } from '@/components/common/InfoPageLayout'

/**
 * Página oculta (no aparece en menús de la web).
 * Destino del WhatsApp de perfiles de cortesía: /cortesia
 */
export default function InfoCortesiaPage() {
  return (
    <InfoPageLayout
      title="Perfil de cortesía gratuito | Caperucitas.com"
      description="Accede y gestiona tu perfil de cortesía gratuito en Caperucitas.com: edita datos, fotos, pausa o activa tu anuncio hasta el 1 de abril de 2027."
      canonicalPath="/cortesia"
      keywords="perfil de cortesía, perfil gratuito escorts, gestionar anuncio, caperucitas cortesia"
    >
      <div className="space-y-3 text-center sm:text-left">
        <p className="text-amber-400 text-sm font-bold uppercase tracking-wide">
          🎁 Perfil de cortesía
        </p>
        <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
          ¿Has recibido un WhatsApp informándote de que hemos activado un perfil gratuito de
          cortesía para ti?
        </h1>
        <p className="text-gray-300 text-sm leading-relaxed">
          ¡Pues aquí te explicamos cómo acceder a tu perfil y gestionarlo fácilmente!
        </p>
        <p className="text-gray-300 text-sm leading-relaxed">
          Podrás modificar tus datos, cambiar el texto de tu anuncio, actualizar tus fotografías,
          poner tu perfil en pausa si no lo necesitas durante un tiempo y volver a activarlo cuando
          quieras.
        </p>
        <div className="bg-amber-950/40 border border-amber-600/50 rounded-xl px-4 py-3 text-sm text-amber-100">
          Tu perfil de cortesía permanece <strong className="text-white">activo y gratuito hasta el 1
          de abril de 2027</strong>.
        </div>
      </div>

      <InfoSection title="¿Cómo puedes acceder a tu perfil?" accent="amber">
        <ol className="list-decimal pl-5 space-y-2 text-sm">
          <li>
            Entra en nuestra página web:{' '}
            <a
              href="https://www.caperucitas.com/"
              className="text-red-400 font-semibold underline underline-offset-2"
            >
              https://www.caperucitas.com/
            </a>
          </li>
          <li>
            Haz clic en <strong className="text-white">«Entrar»</strong>.
          </li>
          <li>
            En el apartado <strong className="text-white">EMAIL</strong>, introduce tu número de
            teléfono (al cual has recibido el WhatsApp) seguido de{' '}
            <code className="text-amber-300 bg-gray-950 px-1.5 py-0.5 rounded">@yopmail.com</code>.
            <p className="text-gray-400 text-xs mt-1">
              Ejemplo: <code className="text-emerald-300">6123456789@yopmail.com</code>
            </p>
          </li>
          <li>
            En el apartado <strong className="text-white">CONTRASEÑA</strong>, introduce tu número
            de teléfono.
            <p className="text-gray-400 text-xs mt-1">
              Ejemplo: <code className="text-emerald-300">6123456789</code>
            </p>
          </li>
        </ol>
        <p className="text-white font-bold pt-1">¡Ya estás dentro!</p>
        <div className="pt-2">
          <InfoCta label="Entrar ahora" to="/login" variant="red" />
        </div>
      </InfoSection>

      <InfoSection title="¿Cómo puedes modificar tu perfil?">
        <p>
          Una vez hayas iniciado sesión, haz clic en{' '}
          <strong className="text-white">«Mi cuenta»</strong> (o{' '}
          <Link to="/edit-profile" className="text-red-400 font-semibold underline">
            Mi perfil
          </Link>
          ), situado en la parte superior derecha de la pantalla.
        </p>
        <p>Desde allí podrás gestionar tu perfil:</p>

        <div className="space-y-3 pt-1">
          <div className="bg-gray-950/60 border border-gray-700 rounded-xl p-3">
            <p className="text-white font-bold text-sm mb-1">1. Activar o poner en pausa tu perfil</p>
            <p className="text-gray-400 text-sm">
              Puedes poner tu perfil en pausa si no deseas que esté visible temporalmente. Cuando
              quieras volver a recibir contactos, podrás activarlo de nuevo.
            </p>
          </div>
          <div className="bg-gray-950/60 border border-gray-700 rounded-xl p-3">
            <p className="text-white font-bold text-sm mb-1">2. Ocultar tu distancia exacta</p>
            <p className="text-gray-400 text-sm">
              Puedes ocultar la distancia exacta a la que te encuentras (en metros o kilómetros),
              para proteger mejor tu privacidad.
            </p>
          </div>
          <div className="bg-gray-950/60 border border-gray-700 rounded-xl p-3">
            <p className="text-white font-bold text-sm mb-1">
              3. Modificar tus datos personales y profesionales
            </p>
            <ul className="list-disc pl-5 text-sm text-gray-400 space-y-1">
              <li>Tu nombre.</li>
              <li>
                Tu forma de contacto: teléfono, WhatsApp o ambos, además de mensajes privados por
                la web.
              </li>
              <li>La descripción de tu anuncio.</li>
              <li>Los servicios que ofreces.</li>
              <li>Tu ubicación de trabajo.</li>
            </ul>
            <p className="text-gray-400 text-sm mt-2">
              Para actualizar tu ubicación, usa{' '}
              <strong className="text-white">«Detectar automáticamente»</strong> o introduce
              manualmente la dirección donde trabajas.
            </p>
          </div>
          <div className="bg-gray-950/60 border border-gray-700 rounded-xl p-3">
            <p className="text-white font-bold text-sm mb-1">4. Cambiar tus fotografías</p>
            <p className="text-gray-400 text-sm">
              Puedes añadir, eliminar o sustituir tus fotografías cuando quieras.
            </p>
          </div>
        </div>

        <p className="pt-2">
          Cuando hayas terminado, recuerda hacer clic en{' '}
          <strong className="text-white">«Guardar los cambios»</strong>.
        </p>
        <p className="text-emerald-300 font-semibold">¡Así de fácil y sencillo!</p>
      </InfoSection>

      <InfoSection title="¡Un consejo importante!" accent="pink">
        <p>
          <strong className="text-white">Crea tu propia cuenta</strong> utilizando tu correo
          electrónico personal.
        </p>
        <p>¿Por qué? Porque así podrás:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Estar siempre informada de las novedades de tu cuenta</li>
          <li>Recibir avisos cuando tengas nuevos mensajes en tu bandeja</li>
          <li>Saber cuándo caduca tu membresía PREMIUM</li>
          <li>Estar al tanto de nuestras promociones y descuentos</li>
        </ul>
      </InfoSection>

      <InfoSection title="¡Y tenemos una ventaja extra para ti!" accent="amber">
        <p>
          Si creas tu propio perfil con tu correo electrónico personal, podrás disfrutar de tu
          suscripción <strong className="text-amber-300">PREMIUM hasta el 1 de julio de 2027</strong>.
        </p>
        <p>
          Además, podrás beneficiarte de nuevas promociones y obsequios exclusivos para ayudarte a
          destacar, conseguir más llamadas y atraer a más clientes.
        </p>
      </InfoSection>

      <InfoSection title="¡Tu perfil gratis para siempre!" accent="emerald">
        <p>
          ¡Así es! Puedes crear y mantener tu propio perfil en{' '}
          <strong className="text-white">CAPERUCITAS.COM</strong> sin pagar absolutamente nada y
          para siempre.
        </p>
        <p>
          Con tu perfil gratuito, otras personas podrán descubrirte y enviarte mensajes privados
          para contactar contigo y concertar una posible cita.
        </p>
      </InfoSection>

      <InfoSection title="¿Quieres tener todavía más oportunidades?">
        <p>
          Si contratas nuestra membresía <strong className="text-amber-300">PREMIUM</strong> por
          solo <strong className="text-white">20 € al mes</strong>, además de recibir mensajes
          privados, también podrán contactarte directamente mediante llamadas telefónicas y
          WhatsApp.
        </p>
        <p className="text-white font-semibold">
          ¡Más formas de contacto significan más oportunidades de conseguir clientes!
        </p>
      </InfoSection>

      <InfoSection title="¡Y ahora viene lo mejor!" accent="amber">
        <p>
          Por crear tu propio perfil con tu correo electrónico personal, te regalamos la membresía{' '}
          <strong className="text-amber-300">PREMIUM HASTA EL 1 DE JULIO DE 2027</strong>.
        </p>
        <p>
          ¡Sí, has leído bien! Podrás disfrutar de todas las ventajas de PREMIUM sin pagar la cuota
          mensual durante todo este periodo.
        </p>
        <p className="text-white font-bold">
          ¡Tu perfil es gratis para siempre y ahora, además, PREMIUM corre de nuestra cuenta!
        </p>
      </InfoSection>

      <div className="bg-gradient-to-br from-red-950/50 to-gray-900 border border-red-700/40 rounded-2xl p-5 space-y-3 text-center">
        <p className="text-white text-lg font-black">¿A qué esperas?</p>
        <p className="text-gray-300 text-sm">
          ¡Crea ya tu propia cuenta, personaliza tu perfil y aprovecha todas las ventajas que te
          ofrecemos!
        </p>
        <p className="text-gray-400 text-sm">
          En CAPERUCITAS.COM queremos ayudarte a conseguir más oportunidades y acercarte al éxito
          profesional.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <InfoCta label="Entrar a mi perfil de cortesía" to="/login" variant="red" />
          <InfoCta label="Crear mi propia cuenta" to="/register" variant="emerald" />
        </div>
      </div>
    </InfoPageLayout>
  )
}
