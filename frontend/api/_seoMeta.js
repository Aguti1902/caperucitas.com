/**
 * Genera title/description/canonical a partir de la URL.
 * Usado por el middleware Edge (sin depender del bundle React).
 */

const CATEGORIES = {
  chicas: { label: 'Chicas', gender: 'chica' },
  chicos: { label: 'Chicos', gender: 'chico' },
  gays: { label: 'Gays', gender: 'gay' },
  trans: { label: 'Trans', gender: 'trans' },
  masajes: { label: 'Masajes', gender: 'masajes' },
  casas: { label: 'Casas/Pisos', gender: 'casa' },
}

function slugToName(slug) {
  return slug
    .split('-')
    .filter((p) => !/^p\d+$/.test(p))
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/**
 * @param {string} pathname
 * @returns {{ title: string, description: string, canonical: string, section: string, cityName: string, categorySlug: string|null } | null}
 */
export function metaFromPathname(pathname) {
  const site = 'https://www.caperucitas.com'
  const parts = pathname.replace(/\/+$/, '').split('/').filter(Boolean)
  if (parts.length < 2) return null

  const section = parts[0]
  if (section !== 'putas' && section !== 'sexo-gratis') return null

  let categorySlug = null
  let citySlug = null

  // /putas/barcelona  OR  /putas/chicas/en/barcelona
  if (parts.length === 2) {
    citySlug = parts[1]
  } else if (parts.length === 4 && parts[2] === 'en') {
    categorySlug = parts[1]
    citySlug = parts[3]
  } else if (parts.length === 3 && parts[1] in CATEGORIES) {
    // fallback: /putas/chicas/barcelona
    categorySlug = parts[1]
    citySlug = parts[2]
  } else {
    citySlug = parts[parts.length - 1]
  }

  if (!citySlug) return null

  const cityName = slugToName(citySlug)
  const cat = categorySlug ? CATEGORIES[categorySlug] : null
  const isGratis = section === 'sexo-gratis'

  let title
  let description

  if (isGratis) {
    if (cat) {
      title = `Sexo gratis ${cat.label.toLowerCase()} en ${cityName} | Caperucitas.com`
      description = `Sexo gratis ${cat.label.toLowerCase()} en ${cityName}. Contactos consensuados sin compensación económica. Conoce personas cerca de ti en Caperucitas.com.`
    } else {
      title = `Sexo gratis en ${cityName} | Caperucitas.com`
      description = `Sexo gratis en ${cityName}. Contactos consensuados sin compensación económica. Crea tu perfil y conecta con personas cercanas en Caperucitas.com.`
    }
  } else if (cat) {
    title = `Putas y escorts ${cat.label.toLowerCase()} en ${cityName} | Caperucitas.com`
    description = `Putas y escorts ${cat.label.toLowerCase()} en ${cityName}. Perfiles con fotos y contacto directo por WhatsApp y teléfono en Caperucitas.com.`
  } else {
    title = `Putas y escorts en ${cityName} | Caperucitas.com`
    description = `Putas y escorts en ${cityName} cerca de ti. Perfiles con fotos, contacto directo por WhatsApp y teléfono. Encuentra compañía en ${cityName} en Caperucitas.com.`
  }

  const path =
    categorySlug && cat
      ? `/${section}/${categorySlug}/en/${citySlug}`
      : `/${section}/${citySlug}`

  return {
    title,
    description,
    canonical: `${site}${path}`,
    section,
    cityName,
    categorySlug: cat ? categorySlug : null,
  }
}

/**
 * Inyecta meta SEO en el HTML de index.html
 * @param {string} html
 * @param {ReturnType<metaFromPathname>} meta
 */
export function injectSeoIntoHtml(html, meta) {
  if (!meta) return html

  let out = html
  out = out.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(meta.title)}</title>`)

  out = replaceMeta(out, 'name', 'description', meta.description)
  out = replaceMeta(out, 'property', 'og:title', meta.title)
  out = replaceMeta(out, 'property', 'og:description', meta.description)
  out = replaceMeta(out, 'property', 'og:url', meta.canonical)
  out = replaceMeta(out, 'name', 'twitter:title', meta.title)
  out = replaceMeta(out, 'name', 'twitter:description', meta.description)

  // Canonical
  if (/<link[^>]+rel=["']canonical["']/i.test(out)) {
    out = out.replace(
      /<link[^>]+rel=["']canonical["'][^>]*>/i,
      `<link rel="canonical" href="${escapeHtml(meta.canonical)}" />`
    )
  } else {
    out = out.replace(
      '</head>',
      `    <link rel="canonical" href="${escapeHtml(meta.canonical)}" />\n  </head>`
    )
  }

  // Noscript fallback H1 for crawlers that don't run JS well
  const noscript = `<noscript><div style="padding:16px;font-family:sans-serif"><h1>${escapeHtml(meta.title.replace(' | Caperucitas.com', ''))}</h1><p>${escapeHtml(meta.description)}</p></div></noscript>`
  if (!out.includes('<noscript>')) {
    out = out.replace('<div id="root"></div>', `<div id="root"></div>\n    ${noscript}`)
  }

  return out
}

function replaceMeta(html, attr, key, content) {
  const re = new RegExp(`<meta[^>]+${attr}=["']${key}["'][^>]*>`, 'i')
  const tag = `<meta ${attr}="${key}" content="${escapeHtml(content)}" />`
  if (re.test(html)) return html.replace(re, tag)
  return html.replace('</head>', `    ${tag}\n  </head>`)
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
