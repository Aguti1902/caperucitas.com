import { Link, useParams, Navigate } from 'react-router-dom'
import SeoHead from '@/components/common/SeoHead'
import BackNavBar from '@/components/common/BackNavBar'
import { getPostBySlug } from '@/data/blogPosts'
import { SITE_URL, getCityPath, getCityBySlug } from '@/utils/citySeo'

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const post = slug ? getPostBySlug(slug) : undefined

  if (!post) return <Navigate to="/blog" replace />

  return (
    <div className="min-h-screen bg-gray-950">
      <SeoHead
        title={`${post.title} | Caperucitas.com`}
        description={post.description}
        canonical={`${SITE_URL}/blog/${post.slug}`}
        keywords={post.tags.join(', ')}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          datePublished: post.date,
          description: post.description,
          url: `${SITE_URL}/blog/${post.slug}`,
        }}
      />
      <BackNavBar title="Artículo" backTo="/blog" />

      <article className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <header className="space-y-2">
          <p className="text-gray-500 text-xs">{post.date}</p>
          <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">{post.title}</h1>
          <p className="text-gray-400 text-sm">{post.description}</p>
        </header>

        <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
          {post.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {post.citySlug && (
          <div className="flex flex-wrap gap-2 pt-2">
            <Link
              to={getCityPath('escort', getCityBySlug(post.citySlug) || { name: post.citySlug, slug: post.citySlug })}
              className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-4 py-2 rounded-xl"
            >
              Ver putas / escorts
            </Link>
            <Link
              to={getCityPath('sexo_gratis', getCityBySlug(post.citySlug) || { name: post.citySlug, slug: post.citySlug })}
              className="bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-bold px-4 py-2 rounded-xl"
            >
              Ver sexo gratis
            </Link>
          </div>
        )}

        <p className="text-xs text-gray-600 pt-4">
          <Link to="/blog" className="underline hover:text-gray-400">← Volver al blog</Link>
          {' · '}
          <Link to="/ciudades" className="underline hover:text-gray-400">Todas las ciudades</Link>
        </p>
      </article>
    </div>
  )
}
