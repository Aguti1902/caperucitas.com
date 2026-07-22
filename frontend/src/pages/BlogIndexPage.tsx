import { Link } from 'react-router-dom'
import SeoHead from '@/components/common/SeoHead'
import BackNavBar from '@/components/common/BackNavBar'
import { BLOG_POSTS } from '@/data/blogPosts'
import { SITE_URL } from '@/utils/citySeo'

export default function BlogIndexPage() {
  const posts = [...BLOG_POSTS].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="min-h-screen bg-gray-950">
      <SeoHead
        title="Blog | Guías de escorts y sexo gratis | Caperucitas.com"
        description="Guías prácticas: putas en Barcelona y Madrid 2026, sexo gratis, ubicación y cómo funciona Caperucitas.com."
        canonical={`${SITE_URL}/blog`}
        keywords="putas barcelona, escorts madrid, sexo gratis, guía caperucitas"
      />
      <BackNavBar title="Blog" backTo="/" />

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <header>
          <h1 className="text-2xl font-black text-white">Blog Caperucitas</h1>
          <p className="text-gray-400 text-sm mt-1">
            Guías locales y consejos para encontrar escorts o sexo gratis cerca de ti.
          </p>
        </header>

        <div className="space-y-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="block bg-gray-900 border border-gray-800 hover:border-red-700 rounded-xl p-4 transition-colors"
            >
              <p className="text-gray-500 text-xs">{post.date}</p>
              <h2 className="text-white font-bold text-lg mt-1">{post.title}</h2>
              <p className="text-gray-400 text-sm mt-1 line-clamp-2">{post.description}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {post.tags.map((t) => (
                  <span key={t} className="text-[10px] font-bold uppercase bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                    {t}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
