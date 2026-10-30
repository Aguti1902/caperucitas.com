import InfoPageLayout, { InfoSection, InfoCta } from '@/components/common/InfoPageLayout'

export const PUBLICISTA_CONTACT_MESSAGE =
  '¡Hola!\n\n' +
  'Me gustaría recibir información sobre cómo puedo participar como publicista en vuestra web. ' +
  'Os envío algunos enlaces de anuncios que tengo publicados como ejemplo de mi trabajo.\n\n' +
  'Muchas gracias. ¡Quedo a la espera de vuestra respuesta!'

const mailtoHref = `mailto:soporte@caperucitas.com?subject=${encodeURIComponent(
  'Quiero participar como publicista'
)}&body=${encodeURIComponent(PUBLICISTA_CONTACT_MESSAGE)}`

const waHref = `https://wa.me/?text=${encodeURIComponent(PUBLICISTA_CONTACT_MESSAGE)}`

export default function InfoPublicistasPage() {
  return (
    <InfoPageLayout
      title="Publicistas de Escorts: Anuncia en Caperucitas.com"
      description="¿Eres publicista de escorts? Descubre Caperucitas.com: perfiles con geolocalización, categorías variadas y nuevas oportunidades de visibilidad."
      canonicalPath="/publicistas-escorts"
      keywords="publicistas de escorts, anunciar escorts, publicidad para escorts, plataformas de anuncios para escorts, publicar perfiles de escorts, anuncios de escorts online, web de escorts con geolocalización, promoción de escorts, captar clientes para escorts"
    >
      <div className="space-y-2 text-center sm:text-left">
        <p className="text-amber-400 text-sm font-bold uppercase tracking-wide">+ Info publicistas</p>
        <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
          ¿Te dedicas a la publicidad para escorts? Descubre una nueva forma de conseguir clientes
          con Caperucitas.com
        </h1>
        <p className="text-gray-300 text-sm leading-relaxed">
          Si te dedicas al mundo de la publicidad y trabajas publicando anuncios en plataformas
          especializadas para escorts, seguramente conoces sitios como Loquosex.com,
          Destacamos.com, Nuevapasion.com, Nuevoloquo.ch, Milpasiones.com, Emasex.com, Pasion.net,
          Escort-Advisor.xxx, Citapasion.com, Choosescorts.com, Milcitas.com, Anunciosex.com o
          Mundosexanuncio.com.
        </p>
        <p className="text-gray-300 text-sm leading-relaxed">
          Si ya gestionas anuncios para profesionales del sector y buscas nuevas oportunidades para
          dar mayor visibilidad a tus clientes, ha llegado el momento de descubrir una alternativa
          diferente: <strong className="text-white">Caperucitas.com</strong>.
        </p>
      </div>

      <div className="bg-amber-950/40 border border-amber-700/50 rounded-2xl p-5 space-y-3">
        <p className="text-amber-200 text-sm font-semibold">
          Necesitaremos que nos envíes algún enlace a un anuncio que hayas publicado como
          publicista para poder verificarlo.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <InfoCta label="Contactar por email" to={mailtoHref} variant="red" />
          <InfoCta label="Enviar mensaje (WhatsApp)" to={waHref} variant="whatsapp" />
        </div>
      </div>

      <InfoSection title="🦊 Caperucitas.com: una nueva manera de conectar escorts con clientes">
        <p>
          Estamos comenzando nuestra andadura con una propuesta innovadora. A diferencia de los
          portales tradicionales, donde el anuncio suele ser el protagonista, en Caperucitas.com
          apostamos por un sistema basado en <strong className="text-white">perfiles y geolocalización</strong>,
          pensado para que los visitantes encuentren personas cerca de su ubicación.
        </p>
        <p>
          Gracias a este enfoque, los visitantes exploran perfiles según proximidad, descubren
          nuevas opciones y encuentran profesionales en su zona, sin necesidad de desplazarse
          grandes distancias.
        </p>
      </InfoSection>

      <InfoSection title="📍 Perfiles con geolocalización: visibilidad por proximidad" accent="emerald">
        <p>
          La geolocalización orienta las búsquedas hacia personas cerca del visitante. Además,
          hay categorías organizadas:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong className="text-white">Chicas</strong> — perfiles femeninos
          </li>
          <li>
            <strong className="text-white">Chicos</strong> — perfiles masculinos
          </li>
          <li>
            <strong className="text-white">Gays</strong> — perfiles orientados al público gay
          </li>
          <li>
            <strong className="text-white">Trans</strong> — perfiles de personas trans
          </li>
        </ul>
      </InfoSection>

      <InfoSection title="👁️ Vista rápida o vista extensa" accent="amber">
        <p>
          La <strong className="text-white">vista rápida</strong> permite explorar de forma ágil; la{' '}
          <strong className="text-white">vista extensa</strong> ofrece más detalle antes de decidir.
          Para anunciantes y agencias, distintas formas de visualizar perfiles son una
          oportunidad adicional de presentar a sus clientes.
        </p>
      </InfoSection>

      <InfoSection title="🔥 Sexo gratis y escorts en una misma plataforma" accent="pink">
        <p>
          Combinamos una sección de sexo gratis con un espacio de escorts. Algunos visitantes
          llegan buscando encuentros gratuitos; otros buscan profesionales. Si no encuentran lo
          que buscan en la sección gratuita, pueden explorar categorías profesionales — generando
          más oportunidades de visibilidad.
        </p>
      </InfoSection>

      <InfoSection title="💡 ¿Por qué anunciar a tus clientes en Caperucitas.com?">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong className="text-white">Perfiles</strong> en lugar de anuncios tradicionales
          </li>
          <li>
            <strong className="text-white">Búsqueda por proximidad</strong> (geolocalización)
          </li>
          <li>
            <strong className="text-white">Categorías organizadas</strong>
          </li>
          <li>
            <strong className="text-white">Vista rápida y vista extensa</strong>
          </li>
          <li>
            <strong className="text-white">Sección de sexo gratis</strong> para atraer más visitantes
          </li>
          <li>
            <strong className="text-white">Entorno especializado</strong> en contactos para adultos
          </li>
        </ul>
        <p>
          Para quienes ya gestionan campañas en otros portales, Caperucitas.com puede ser un canal
          complementario que merece la pena conocer y evaluar.
        </p>
      </InfoSection>

      <InfoSection title="🚀 Una oportunidad para agencias y anunciantes" accent="emerald">
        <p>
          El sector evoluciona constantemente. Explorar nuevas plataformas y formatos ayuda a
          diversificar estrategias. La combinación de perfiles, geolocalización y categorías
          ofrece una propuesta distinta a los portales centrados solo en anuncios convencionales.
        </p>
        <p className="text-gray-400 text-xs">
          Los resultados dependen de la visibilidad de los perfiles, la demanda de cada zona, la
          calidad de la información y el comportamiento de los visitantes.
        </p>
      </InfoSection>

      <InfoSection title="✨ Descubre una nueva forma de anunciar">
        <p>
          Estamos dando nuestros primeros pasos y queremos seguir desarrollando una plataforma que
          aporte nuevas posibilidades. Si te dedicas a la publicidad para escorts, te invitamos a
          descubrir Caperucitas.com.
        </p>
        <p className="font-semibold text-white">
          Caperucitas.com: perfiles, proximidad y nuevas oportunidades de visibilidad para el
          sector de los contactos para adultos.
        </p>
      </InfoSection>

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <InfoCta label="Quiero ser publicista (email)" to={mailtoHref} />
        <InfoCta label="Enviar por WhatsApp" to={waHref} variant="whatsapp" />
      </div>
    </InfoPageLayout>
  )
}
