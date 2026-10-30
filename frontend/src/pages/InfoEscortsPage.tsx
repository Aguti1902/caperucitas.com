import InfoPageLayout, { InfoSection, InfoCta } from '@/components/common/InfoPageLayout'

export default function InfoEscortsPage() {
  return (
    <InfoPageLayout
      title="Escorts cerca de ti | Publica tu perfil gratis en Caperucitas.com"
      description="¿Buscas escorts cerca de ti o quieres publicar tu perfil profesional? Explora por proximidad, filtra y contacta. Publica gratis y prueba Premium recomendando."
      canonicalPath="/info-escorts"
      keywords="escorts cerca de ti, publicar perfil escort gratis, anuncios escorts, escorts por ciudad, premium escorts, contacto whatsapp escorts"
    >
      <div className="space-y-2 text-center sm:text-left">
        <p className="text-red-400 text-sm font-bold uppercase tracking-wide">+ Info escorts</p>
        <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
          ¿Buscas escorts cerca de ti? Publica tu perfil gratis en Caperucitas.com
        </h1>
        <p className="text-gray-300 text-sm leading-relaxed">
          ¿Quieres encontrar escorts cerca de tu ubicación o publicar tu propio perfil profesional
          para llegar a más personas? En Caperucitas.com puedes explorar anuncios, descubrir
          perfiles por proximidad y utilizar diferentes opciones para contactar según tus
          preferencias.
        </p>
        <p className="text-gray-400 text-sm leading-relaxed">
          Nuestra plataforma facilita la búsqueda de escorts y anunciantes por ciudad, distancia y
          otros criterios. Si eres profesional y quieres anunciarte, puedes crear tu perfil
          gratuitamente y decidir si deseas mantener las funciones básicas o contratar Premium
          para mayor visibilidad.
        </p>
      </div>

      <InfoSection title="📍 Encuentra escorts cerca de tu ubicación">
        <p>
          Explora perfiles de escorts y consulta los anuncios que más se ajusten a tus
          preferencias. La búsqueda por ubicación te permite descubrir perfiles de tu zona y
          consultar otras ciudades o municipios cuando quieras ampliar tus opciones.
        </p>
        <p>
          ¿Vas a viajar a otra ciudad? Cambia la ubicación de búsqueda y explora los perfiles
          publicados en tu próximo destino antes de llegar. Utiliza los filtros y consulta la
          información de cada anuncio antes de contactar.
        </p>
      </InfoSection>

      <InfoSection title="🆓 Publica tu perfil de escort gratis" accent="emerald">
        <p>Si eres profesional y quieres dar a conocer tus servicios, puedes empezar sin pagar ni un céntimo.</p>
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>
            <strong className="text-white">Crea tu cuenta:</strong> regístrate con tu correo y una
            contraseña.
          </li>
          <li>
            <strong className="text-white">Verifica tu email:</strong> confirma tu cuenta desde el
            correo.
          </li>
          <li>
            <strong className="text-white">Completa tu perfil:</strong> describe tus servicios y
            características.
          </li>
          <li>
            <strong className="text-white">Añade tus fotografías:</strong> hasta siete imágenes,
            respetando las normas.
          </li>
          <li>
            <strong className="text-white">Configura tu perfil:</strong> ubicación y opciones de
            contacto.
          </li>
        </ol>
      </InfoSection>

      <InfoSection title="🎁 Consigue Premium gratis recomendando" accent="amber">
        <p>
          ¿Quieres disfrutar de Premium sin pagar la cuota mensual? Al crear tu perfil por primera
          vez te saldrá la promoción de conseguir Premium solo por recomendarnos a tus ami@s.
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            Comparte con <strong className="text-white">10 contactos</strong> por WhatsApp: Premium
            gratis hasta el <strong className="text-white">1 de abril de 2027</strong>.
          </li>
          <li>
            Comparte con <strong className="text-white">20 contactos</strong> por WhatsApp: Premium
            gratis hasta el <strong className="text-white">1 de julio de 2027</strong>.
          </li>
        </ul>
        <p className="text-gray-400 text-xs">Consulta las condiciones vigentes de la promoción.</p>
      </InfoSection>

      <InfoSection title="⭐ Perfil gratuito o Premium: elige cómo anunciarte">
        <p>
          <strong className="text-white">Gratis:</strong> publica sin cuota mensual, usa funciones
          básicas y recibe mensajes internos cuando estén habilitados. Si termina tu periodo
          promocional de Premium, no estás obligado a contratar: puedes continuar con las
          funciones gratuitas y revisar tu bandeja.
        </p>
        <p>
          <strong className="text-white">Premium por 20 €/mes:</strong> más visibilidad en tu zona,
          opción de habilitar llamadas y WhatsApp, y más oportunidades de contacto directo.
        </p>
      </InfoSection>

      <InfoSection title="🔒 Controla tu ubicación y protege tu privacidad" accent="pink">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Oculta la distancia exacta</li>
          <li>Pausa tu perfil cuando no quieras contactos</li>
          <li>Cambia de ciudad o provincia</li>
          <li>Personaliza tu descripción</li>
          <li>Gestiona tus fotografías</li>
        </ul>
      </InfoSection>

      <InfoSection title="💬 Contacto: teléfono, WhatsApp o mensaje interno" accent="emerald">
        <p>
          Usa mensajes internos o habilita contacto directo (llamadas / WhatsApp) según tu
          modalidad. También puedes usar el chat global para conversar con usuarios conectados.
          Cualquier encuentro debe ser voluntario y consensuado.
        </p>
      </InfoSection>

      <InfoSection title="🚀 Empieza gratis y mejora tu visibilidad cuando lo necesites">
        <p>
          Regístrate, publica tu perfil gratis y descubre las opciones disponibles para dar a
          conocer tu anuncio.
        </p>
      </InfoSection>

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <InfoCta label="Publicar mi perfil gratis" to="/register" />
        <button
          type="button"
          onClick={() => {
            localStorage.setItem('cap_profileSection', 'escort')
            window.location.href = '/perfiles'
          }}
          className="inline-flex items-center justify-center w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 py-3.5 rounded-xl transition-colors"
        >
          Ver escorts
        </button>
      </div>
    </InfoPageLayout>
  )
}
