import { useEffect } from 'react'

interface SeoHeadProps {
  title: string
  description: string
  canonical?: string
  keywords?: string
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}

function upsertLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
  }
  el.href = href
}

export default function SeoHead({ title, description, canonical, keywords, jsonLd }: SeoHeadProps) {
  useEffect(() => {
    document.title = title
    upsertMeta('name', 'description', description)
    if (keywords) upsertMeta('name', 'keywords', keywords)

    upsertMeta('property', 'og:title', title)
    upsertMeta('property', 'og:description', description)
    upsertMeta('name', 'twitter:title', title)
    upsertMeta('name', 'twitter:description', description)

    if (canonical) {
      upsertLink('canonical', canonical)
      upsertMeta('property', 'og:url', canonical)
    }

    const scriptId = 'seo-json-ld'
    const existing = document.getElementById(scriptId)
    if (existing) existing.remove()

    if (jsonLd) {
      const script = document.createElement('script')
      script.id = scriptId
      script.type = 'application/ld+json'
      script.textContent = JSON.stringify(jsonLd)
      document.head.appendChild(script)
    }

    return () => {
      document.getElementById(scriptId)?.remove()
    }
  }, [title, description, canonical, keywords, jsonLd])

  return null
}
