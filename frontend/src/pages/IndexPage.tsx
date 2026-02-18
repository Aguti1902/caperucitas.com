import { useNavigate } from 'react-router-dom'
import Logo from '@/components/common/Logo'
import Button from '@/components/common/Button'

export default function IndexPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-dark flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 animate-fade-in">
        {/* Logo */}
        <div className="text-center">
          <Logo size="md" className="mb-2" />
          <p className="text-gray-400 text-lg">
            Encuentra tu conexión perfecta
          </p>
        </div>

        {/* Video de YouTube */}
        <div className="mt-4">
          <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src="https://www.youtube.com/embed/6QwyBqZnNEg"
              title="9citas Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        {/* Opciones */}
        <div className="space-y-4">
          <Button
            fullWidth
            variant="primary"
            onClick={() => navigate('/login/hetero')}
            className="text-lg py-4"
          >
            Tengo 18 años y busco citas con heteros
          </Button>

          <Button
            fullWidth
            variant="secondary"
            onClick={() => navigate('/login/gay')}
            className="text-lg py-4"
          >
            Tengo 18 años y busco citas con gays
          </Button>

          <Button
            fullWidth
            variant="outline"
            onClick={() => window.location.href = 'https://google.com'}
            className="text-lg py-4"
          >
            No tengo 18 años
          </Button>
        </div>

        {/* Información sobre orientación */}
        <div className="bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 rounded-xl p-4 text-center">
          <p className="text-white font-semibold text-base leading-relaxed">
            Si te registras como <span className="text-primary">hetero</span>, encontrarás chicas y chicos buscando citas cerca de ti.
          </p>
          <p className="text-white font-semibold text-base leading-relaxed mt-2">
            Si te registras como <span className="text-secondary">gay</span>, encontrarás chicos gays o trans buscando citas cerca de ti.
          </p>
        </div>

        {/* Aviso legal */}
        <div className="text-center text-sm text-gray-500 space-y-2 pt-4">
          <p>
            Al continuar, confirmas que tienes al menos 18 años y aceptas nuestros{' '}
            <a href="/info" className="text-primary hover:underline">
              Términos y Condiciones
            </a>
            {' '}y{' '}
            <a href="/info" className="text-primary hover:underline">
              Política de Privacidad
            </a>
          </p>
        </div>

        {/* Texto descriptivo SEO */}
        <div className="text-center text-sm text-gray-400 space-y-3 pt-6 border-t border-gray-800 mt-6">
          <h2 className="text-lg font-bold text-white flex items-center justify-center gap-2">
            ⭐ 9citas.com – Conoce chicas y chicos cerca de ti
          </h2>
          <p className="text-gray-300">
            9citas.com es una opción gratuita para descubrir y conectar con personas cerca de ti, ya sean chicas o chicos, heterosexuales o gays. Nuestra plataforma está pensada para que puedas conocer gente nueva de forma rápida, sencilla y sin complicaciones.
          </p>
          <p className="text-gray-300">
            Crea tu perfil, explora usuarios cercanos y empieza a chatear con personas reales que buscan amistad, conversación o algo más. En 9citas.com, tú decides cómo y con quién conectar.
          </p>
          <p className="text-white font-semibold">
            Fácil, accesible y para todos.
          </p>
        </div>
      </div>
    </div>
  )
}

