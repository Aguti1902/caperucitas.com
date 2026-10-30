import { Link } from 'react-router-dom'
import InfoPageLayout, { InfoSection, InfoCta } from '@/components/common/InfoPageLayout'

export default function InfoVisitantesPage() {
  return (
    <InfoPageLayout
      title="Caperucitas.com: encuentra perfiles cerca de ti"
      description="Descubre Caperucitas.com: busca escorts y perfiles de sexo gratis cerca de ti, utiliza filtros por edad y distancia, y contacta directamente."
      canonicalPath="/como-funciona-caperucitas-y-sus-ventajas"
      keywords="perfiles cerca de ti, buscar escorts por ubicación, perfiles de sexo gratis, anuncios de escorts, buscar personas por distancia, perfiles en línea, contactos por ciudad, chat para conocer gente, alquiler de habitaciones y plazas"
    >
      <div className="space-y-2 text-center sm:text-left">
        <p className="text-pink-400 text-sm font-bold uppercase tracking-wide">+ Info visitantes</p>
        <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
          Descubre todo lo que puedes hacer en Caperucitas.com: explora, busca y conecta con
          personas cerca de ti
        </h1>
        <p className="text-gray-300 text-sm leading-relaxed">
          ¡Bienvenido a Caperucitas.com! Si estás explorando nuestra web por primera vez, queremos
          enseñarte todas las posibilidades que tienes a tu alcance. Hemos creado un espacio para
          que puedas buscar perfiles, descubrir anunciantes, contactar con otras personas y
          encontrar nuevas oportunidades de conocer gente de una forma sencilla y adaptada a tus
          preferencias.
        </p>
        <p className="text-gray-400 text-sm leading-relaxed">
          Tanto si buscas servicios de escorts como si prefieres conocer usuarios interesados en
          encuentros y relaciones consensuadas, en Caperucitas.com encontrarás secciones
          diferenciadas para que puedas navegar por la web según lo que estés buscando.
        </p>
      </div>

      <InfoSection title="🧭 Dos secciones para encontrar lo que buscas">
        <p>
          En Caperucitas.com distinguimos entre las secciones de <strong className="text-white">Escorts</strong> y{' '}
          <strong className="text-white">Sexo Gratis</strong>, para que puedas explorar diferentes tipos de
          perfiles y elegir la opción que mejor se adapte a tus intereses.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className="text-white">Escorts:</strong> descubre perfiles de anunciantes que ofrecen
            sus servicios y consulta la información publicada en cada anuncio.
          </li>
          <li>
            <strong className="text-white">Sexo Gratis:</strong> encuentra perfiles de usuarios que buscan
            conocer a otras personas y establecer contactos de forma voluntaria y consensuada.
          </li>
        </ul>
        <p>
          Buscar y contactar con los anunciantes y perfiles es <strong className="text-white">gratuito</strong>.
          Podrás consultar los anuncios y utilizar las opciones de contacto que tenga disponibles
          cada perfil.
        </p>
      </InfoSection>

      <InfoSection title="📍 Encuentra personas cerca de ti gracias a la búsqueda por ubicación" accent="emerald">
        <p>
          Una de las principales características de Caperucitas.com es su sistema de búsqueda por
          proximidad. La plataforma te permite explorar perfiles según su ubicación disponible,
          para que puedas descubrir personas que se encuentren cerca de ti en ese momento.
        </p>
        <p>
          ¿Quieres conocer gente en tu ciudad? ¿Prefieres buscar en un municipio cercano? ¿Estás
          preparando un viaje y quieres explorar las opciones que encontrarás en tu destino?
        </p>
        <p>
          Puedes cambiar la ubicación de búsqueda y descubrir perfiles de otras ciudades o
          municipios. Así tendrás la posibilidad de consultar los anuncios de tu próximo destino
          antes de llegar y, si ambas partes están interesadas, organizar una cita con antelación.
        </p>
      </InfoSection>

      <InfoSection title="🎛️ Filtros para personalizar tu búsqueda">
        <p>Según la sección y los filtros disponibles, podrás buscar por:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong className="text-white">Género y orientación sexual:</strong> mujeres, hombres,
            personas gais y personas trans, entre otras opciones.
          </li>
          <li>
            <strong className="text-white">Categorías:</strong> escorts, masajes, pisos y plazas, y
            otras categorías publicadas.
          </li>
          <li>
            <strong className="text-white">Edad:</strong> delimita un rango a tus preferencias.
          </li>
          <li>
            <strong className="text-white">Distancia:</strong> prioriza perfiles a una distancia
            determinada.
          </li>
          <li>
            <strong className="text-white">Nombre o palabra clave:</strong> localiza perfiles con
            términos concretos.
          </li>
          <li>
            <strong className="text-white">Estado de conexión:</strong> consulta perfiles en línea.
          </li>
        </ul>
        <p>
          También podrás elegir cómo mostrar los resultados: todos los perfiles, premium, en línea
          o publicados durante los últimos dos o cuatro meses.
        </p>
      </InfoSection>

      <InfoSection title="👁️ Vista rápida o vista extensa: tú eliges" accent="amber">
        <p>
          <strong className="text-white">Vista rápida:</strong> ideal si quieres revisar los perfiles de
          forma ágil y localizar rápidamente las opciones que te interesan.
        </p>
        <p>
          <strong className="text-white">Vista extensa:</strong> pensada para quienes prefieren consultar
          más detalles de cada anuncio antes de acceder al perfil completo.
        </p>
      </InfoSection>

      <InfoSection title="📞 Contacta directamente con los perfiles">
        <p>
          Cuando encuentres un anuncio interesante, podrás utilizar las opciones de contacto que el
          anunciante o usuario haya habilitado: mensaje directo, teléfono o WhatsApp si están
          disponibles.
        </p>
        <p>
          Si buscas una conversación inmediata, los perfiles en línea pueden ayudarte a identificar
          usuarios conectados. Recuerda: estar en línea no garantiza respuesta inmediata ni
          disponibilidad para quedar. Cualquier contacto o encuentro debe ser voluntario y acordado
          por ambas partes.
        </p>
      </InfoSection>

      <InfoSection title="🏠 Habitaciones, pisos/plazas y publicistas" accent="pink">
        <p>
          En pisos y plazas puedes encontrar habitaciones en alquiler y espacios que buscan
          profesionales. También puedes buscar publicistas que ofrezcan servicios de publicación o
          gestión publicitaria.
        </p>
      </InfoSection>

      <InfoSection title="💬 Entra en el chat y empieza a conversar" accent="emerald">
        <p>
          ¿Te apetece conocer gente sin búsquedas interminables? Dispones de un chat en el que los
          visitantes pueden participar gratuitamente. Podrás iniciar conversaciones, intercambiar
          mensajes y, si hay interés mutuo, valorar organizar una cita.
        </p>
        <Link to="/chat-global" className="text-pink-400 font-bold hover:underline">
          Abrir chat global →
        </Link>
      </InfoSection>

      <InfoSection title="✨ Explora a tu manera y conecta con tu entorno">
        <p>
          Utiliza los filtros, compara los anuncios, consulta los perfiles que te interesan y elige
          el medio de contacto que prefieras. Tu próxima conversación puede comenzar con una
          búsqueda.
        </p>
      </InfoSection>

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <InfoCta label="Explorar perfiles" to="/perfiles" />
        <InfoCta label="Chat global" to="/chat-global" variant="emerald" />
      </div>
    </InfoPageLayout>
  )
}
