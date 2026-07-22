import { metaFromPathname, injectSeoIntoHtml } from './_seoMeta.js'

export const config = {
  runtime: 'edge',
}

/**
 * Fallback SEO HTML (si el middleware no aplica).
 * Rewrite: /putas/:path* → /api/seo-html?path=/putas/:path*
 */
export default async function handler(request) {
  const url = new URL(request.url)
  let path = url.searchParams.get('path') || ''

  // Vercel a veces deja el placeholder sin expandir; reconstruir desde URL
  if (!path || path.includes(':path')) {
    const referer = request.headers.get('x-forwarded-uri') || request.headers.get('x-invoke-path') || ''
    path = referer || path
  }

  // Decodificar path tipo /putas/chicas/en/barcelona
  try {
    path = decodeURIComponent(path)
  } catch {
    /* keep */
  }

  if (!path.startsWith('/')) path = `/${path}`

  const meta = metaFromPathname(path)
  const indexRes = await fetch(new URL('/index.html', url.origin))
  let html = await indexRes.text()

  if (meta) {
    html = injectSeoIntoHtml(html, meta)
  }

  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, s-maxage=300, stale-while-revalidate=86400',
      'x-seo-injected': meta ? '1' : '0',
      'x-seo-path': path,
    },
  })
}
