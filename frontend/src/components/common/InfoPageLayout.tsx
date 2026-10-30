import { ReactNode } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Logo from '@/components/common/Logo'
import SeoHead from '@/components/common/SeoHead'
import { SITE_URL } from '@/utils/citySeo'

interface Props {
  title: string
  description: string
  canonicalPath: string
  keywords?: string
  children: ReactNode
  cta?: ReactNode
}

export default function InfoPageLayout({
  title,
  description,
  canonicalPath,
  keywords,
  children,
  cta,
}: Props) {
  const navigate = useNavigate()
  const canonical = `${SITE_URL}${canonicalPath}`

  return (
    <div className="min-h-screen bg-gray-950">
      <SeoHead title={title} description={description} canonical={canonical} keywords={keywords} />

      <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between h-14">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Link to="/">
            <Logo size="sm" />
          </Link>
          <Link
            to="/perfiles"
            className="text-red-400 hover:text-red-300 text-sm font-bold"
          >
            Entrar
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {children}
        {cta}
        <div className="pt-4 border-t border-gray-800 flex flex-wrap gap-3 text-xs text-gray-500">
          <Link to="/como-funciona-caperucitas-y-sus-ventajas" className="hover:text-gray-300">
            Visitantes
          </Link>
          <Link to="/info-escorts" className="hover:text-gray-300">
            Escorts
          </Link>
          <Link to="/info-sexo-gratis" className="hover:text-gray-300">
            Sexo gratis
          </Link>
          <Link to="/publicistas-escorts" className="hover:text-gray-300">
            Publicistas
          </Link>
          <Link to="/perfiles" className="hover:text-gray-300">
            Ver perfiles
          </Link>
        </div>
      </main>
    </div>
  )
}

export function InfoSection({
  title,
  children,
  accent = 'red',
}: {
  title: string
  children: ReactNode
  accent?: 'red' | 'emerald' | 'amber' | 'pink'
}) {
  const border =
    accent === 'emerald'
      ? 'border-emerald-800/50'
      : accent === 'amber'
        ? 'border-amber-800/50'
        : accent === 'pink'
          ? 'border-pink-800/50'
          : 'border-gray-800'
  return (
    <section className={`bg-gray-900 rounded-2xl p-5 sm:p-6 border ${border} space-y-3`}>
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <div className="text-gray-300 text-sm leading-relaxed space-y-3">{children}</div>
    </section>
  )
}

export function InfoCta({
  label,
  to,
  variant = 'red',
}: {
  label: string
  to: string
  variant?: 'red' | 'emerald' | 'whatsapp'
}) {
  const cls =
    variant === 'emerald'
      ? 'bg-emerald-600 hover:bg-emerald-500'
      : variant === 'whatsapp'
        ? 'bg-[#25D366] hover:bg-[#1ebe5d]'
        : 'bg-red-600 hover:bg-red-500'
  const isExternal = to.startsWith('http') || to.startsWith('mailto:')
  if (isExternal) {
    return (
      <a
        href={to}
        target={to.startsWith('http') ? '_blank' : undefined}
        rel={to.startsWith('http') ? 'noopener noreferrer' : undefined}
        className={`inline-flex items-center justify-center w-full sm:w-auto ${cls} text-white font-black px-6 py-3.5 rounded-xl transition-colors`}
      >
        {label}
      </a>
    )
  }
  return (
    <Link
      to={to}
      className={`inline-flex items-center justify-center w-full sm:w-auto ${cls} text-white font-black px-6 py-3.5 rounded-xl transition-colors`}
    >
      {label}
    </Link>
  )
}
