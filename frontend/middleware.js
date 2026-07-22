import { metaFromPathname, injectSeoIntoHtml } from './api/_seoMeta.js'

export const config = {
  matcher: ['/putas/:path*', '/sexo-gratis/:path*'],
}

/**
 * Inyecta title/description/canonical en el HTML ANTES de que cargue React.
 * Así Google y herramientas SEO ven los metadatos correctos de cada ciudad
 * (no los de la home).
 */
export default async function middleware(request) {
  const url = new URL(request.url)
  const meta = metaFromPathname(url.pathname)

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
      'x-seo-path': url.pathname,
    },
  })
}
