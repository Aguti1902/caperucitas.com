import InfoPageLayout, { InfoSection, InfoCta } from '@/components/common/InfoPageLayout'

const SHARE_TEXT =
  '🔥 Novedad en Caperucitas.com: chat global para conocer gente, privados y más.\n\n' +
  'Encuentros consensuados, sexo gratis y escorts cerca de ti.\n\n' +
  '👉 https://www.caperucitas.com'

const waShareHref = `https://wa.me/?text=${encodeURIComponent(SHARE_TEXT)}`

export default function InfoChatPage() {
  return (
    <InfoPageLayout
      title="Chat global Caperucitas.com — conoce gente nueva"
      description="Descubre el chat de Caperucitas.com: habla con usuarios conectados, envía privados, fotos y conoce gente cerca de ti."
      canonicalPath="/info-chat"
      keywords="chat caperucitas, chat global, conocer gente, chat privado, sexo gratis chat"
    >
      <div className="space-y-2 text-center sm:text-left">
        <p className="text-pink-400 text-sm font-bold uppercase tracking-wide">ⓘ Chat</p>
        <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
          ¡Descubre nuestro chat y conoce gente nueva!
        </h1>
        <p className="text-gray-300 text-sm leading-relaxed">
          Con nuestro chat podrás pasar un rato entretenido hablando con otros usuarios que estén
          conectados en ese momento. Puedes charlar por diversión, conocer gente nueva, hacer
          amistades o, quién sabe, ¡encontrar una posible cita!
        </p>
        <p className="text-gray-300 text-sm leading-relaxed">
          Actualmente disponemos del <strong className="text-white">CHAT GLOBAL</strong>, abierto a
          todos los géneros y usuarios de cualquier punto de España.
        </p>
        <p className="text-gray-400 text-sm leading-relaxed">
          Si vemos que el chat tiene buena acogida, en el futuro podremos incorporar nuevas salas,
          por ejemplo por orientación (Hetero / Gay) o por ubicación (provincias o CCAA).
        </p>
      </div>

      <InfoSection title="¿Cómo funciona el chat?" accent="pink">
        <ol className="list-decimal pl-5 space-y-2 text-sm">
          <li>
            <strong className="text-white">Entra en el chat</strong> — Lo encontrarás a la derecha
            de la pantalla de perfiles (zona inferior derecha), en color rosa.
          </li>
          <li>
            <strong className="text-white">Elige tu nombre de usuario</strong> — Escribe el apodo
            que quieras (ej. luisxchica) y una contraseña/PIN de 3 números o letras (ej. 3h9).
            Recuérdalos para recibir tus privados.
          </li>
          <li>
            <strong className="text-white">Consulta quién está conectado</strong> — Arriba a la
            derecha verás usuarios online y si tienes privados sin leer.
          </li>
          <li>
            <strong className="text-white">Envía mensajes privados</strong> — Fotos, WhatsApp u otra
            info solo para esa persona.
          </li>
          <li>
            <strong className="text-white">Participa en el chat general</strong> — Escribe para
            todos, responde o abre un privado.
          </li>
        </ol>
        <div className="bg-gray-900 border border-pink-700/40 rounded-xl p-3 mt-3 space-y-1 text-sm">
          <p className="text-pink-300 font-bold">¡Recuerda la diferencia!</p>
          <p>
            <strong className="text-white">PRIVADO:</strong> solo lo lee la persona a la que se lo
            envías.
          </p>
          <p>
            <strong className="text-white">RESPONDER:</strong> tu respuesta la ven esa persona y el
            resto del chat.
          </p>
        </div>
      </InfoSection>

      <InfoSection title="¡Ayúdanos a seguir creciendo!" accent="amber">
        <p>
          Solo te pedimos una cosa: recomienda nuestra web a tus amigos y contactos por WhatsApp.
          Con tu ayuda podremos seguir creciendo y mantener la web gratuita para todos.
        </p>
        <p>
          Cada día incorporamos mejoras para que siempre tengas algo nuevo que descubrir.
        </p>
        <p className="font-semibold text-white">¡Gracias por formar parte de nuestra comunidad!</p>
      </InfoSection>

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <InfoCta label="Entrar al chat" to="/chat-global" variant="red" />
        <InfoCta label="Compartir por WhatsApp" to={waShareHref} variant="whatsapp" />
      </div>
    </InfoPageLayout>
  )
}
