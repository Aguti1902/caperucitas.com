import InfoPageLayout, { InfoSection, InfoCta } from '@/components/common/InfoPageLayout'

export default function InfoSexoGratisPage() {
  return (
    <InfoPageLayout
      title="Sexo gratis cerca de ti | Publica tu perfil gratis en Caperucitas.com"
      description="¿Buscas sexo gratis? Publica tu perfil gratuito en Caperucitas.com, encuentra personas cerca de ti, filtra por ubicación y conversa sin pagar por registrarte."
      canonicalPath="/info-sexo-gratis"
      keywords="sexo gratis, perfiles sexo gratis, conocer gente cerca, encuentros consensuados, publicar perfil gratis, chat adultos, premium gratis"
    >
      <div className="space-y-2 text-center sm:text-left">
        <p className="text-emerald-400 text-sm font-bold uppercase tracking-wide">+ Info sexo gratis</p>
        <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
          ¿Buscas sexo gratis? Publica tu perfil gratuito en Caperucitas.com y conecta con
          personas cerca de ti
        </h1>
        <p className="text-gray-300 text-sm leading-relaxed">
          ¿Quieres conocer gente, encontrar personas con gustos similares y descubrir quién está
          cerca de ti? En Caperucitas.com puedes publicar tu perfil gratuitamente, explorar otros
          usuarios y empezar a conversar sin necesidad de pagar por registrarte.
        </p>
        <p className="text-red-400 text-sm font-semibold bg-red-950/30 border border-red-700/40 rounded-xl px-3 py-2">
          Encuentros consentidos sin compensación económica. Si pides dinero o regalos, serás
          expulsado/a.
        </p>
      </div>

      <InfoSection title="🆓 Publica tu perfil gratis" accent="emerald">
        <p>Puedes publicar tu perfil sin pagar ni un céntimo. El proceso es sencillo:</p>
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>
            <strong className="text-white">Regístrate</strong> con email y contraseña.
          </li>
          <li>
            <strong className="text-white">Verifica tu email</strong> desde el correo.
          </li>
          <li>
            <strong className="text-white">Completa tu perfil:</strong> describe quién eres y qué
            buscas.
          </li>
          <li>
            <strong className="text-white">Sube tus fotografías:</strong> hasta siete fotos.
          </li>
          <li>
            <strong className="text-white">Empieza a explorar</strong> otros perfiles.
          </li>
        </ol>
      </InfoSection>

      <InfoSection title="📍 Encuentra perfiles cercanos a tu ubicación">
        <p>
          Los perfiles pueden mostrarse ordenados por proximidad. Así exploras usuarios de tu zona
          sin revisar anuncios de lugares que no te interesan. También puedes cambiar ciudad o
          provincia si viajas o quieres ampliar opciones.
        </p>
      </InfoSection>

      <InfoSection title="🎁 Consigue Premium gratis recomendando" accent="amber">
        <p>
          Al crear tu perfil por primera vez te saldrá la promoción de conseguir Premium solo por
          recomendarnos a tus ami@s:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong className="text-white">10 amigos</strong> por WhatsApp → Premium hasta el{' '}
            <strong className="text-white">1 de abril de 2027</strong>
          </li>
          <li>
            <strong className="text-white">20 amigos</strong> por WhatsApp → Premium hasta el{' '}
            <strong className="text-white">1 de julio de 2027</strong>
          </li>
        </ul>
        <p className="text-gray-400 text-xs">Sujeto a las condiciones vigentes de Caperucitas.com.</p>
      </InfoSection>

      <InfoSection title="❓ ¿Qué ocurre cuando termina tu Premium?">
        <p>
          Siempre puedes usar las funciones gratuitas sin contratar suscripción. Con Premium,
          pueden contactarte por las opciones que hayas habilitado (llamadas, WhatsApp o mensajes
          internos). Cuando termine, sigues con funciones gratuitas, incluida la recepción de
          mensajes internos si está disponible.
        </p>
        <p>
          Te recomendamos entrar periódicamente y revisar tu bandeja: puede que alguien te haya
          escrito.
        </p>
        <p className="font-semibold text-white">
          No necesitas pagar para mantener tu perfil gratuito ni para usar las funciones básicas.
        </p>
      </InfoSection>

      <InfoSection title="🔒 Controla tu privacidad" accent="pink">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Oculta la distancia exacta</li>
          <li>Pausa tu perfil cuando no quieras contactos</li>
          <li>Cambia tu ubicación al desplazarte</li>
          <li>Personaliza tu descripción</li>
          <li>Gestiona tus fotografías</li>
        </ul>
      </InfoSection>

      <InfoSection title="✍️ Describe quién eres y qué estás buscando">
        <p>
          Un perfil completo ayuda a expresar tu personalidad. Explica qué te gusta, qué
          conversaciones te interesan y qué esperas encontrar. Cuanto más clara sea tu
          presentación, más fácil será conectar.
        </p>
      </InfoSection>

      <InfoSection title="💬 Entra en el chat y conversa con usuarios conectados" accent="emerald">
        <p>
          Usa el chat para interactuar con usuarios conectados, descubrir intereses en común y, si
          hay interés mutuo, valorar quedar. Estar conectado no garantiza respuesta inmediata. Los
          encuentros deben acordarse libremente entre personas adultas.
        </p>
      </InfoSection>

      <InfoSection title="🚀 ¿A qué esperas para publicar tu perfil gratis?">
        <p>
          Regístrate, verifica tu cuenta, completa tu descripción y empieza a descubrir opciones.
          Aprovecha la promoción Premium vigente si deseas funciones adicionales temporalmente.
        </p>
      </InfoSection>

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <InfoCta label="Publicar perfil gratis" to="/register" variant="emerald" />
        <button
          type="button"
          onClick={() => {
            localStorage.setItem('cap_profileSection', 'sexo_gratis')
            window.location.href = '/perfiles'
          }}
          className="inline-flex items-center justify-center w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white font-black px-6 py-3.5 rounded-xl transition-colors"
        >
          Ver sexo gratis
        </button>
      </div>
    </InfoPageLayout>
  )
}
