# SEO automático — Caperucitas.com

## ¿Qué se hacía antes?

**No había un job mensual/diario de mejora SEO.**  
Solo en cada **deploy de Vercel** (build):

1. Regenerar `sitemap.xml` (~17.000 URLs de municipios)
2. Índice de municipios INE
3. Prerender HTML/metas de ciudades top
4. En runtime: metas edge (`/api/seo-html`), canonical, JSON-LD, robots.txt, 410 de perfiles borrados

Eso ayuda, pero **no refresca señales a diario** ni avisa a buscadores cuando hay anuncios nuevos.

---

## Qué corre ahora **cada día** (automático)

| Hora (UTC) | Dónde | Qué hace |
|---|---|---|
| **06:15** | Railway (backend `node-cron`) | Job SEO diario |
| **06:20** | Vercel Cron → `/api/seo-daily-cron` | Refuerzo: llama al mismo job por si Railway falló |

### Acciones del job diario

1. **Analiza** perfiles activos (no pausados) y los agrupa por ciudad  
2. **Prioriza URLs** con contenido real (Madrid, Barcelona, etc. + ciudades con anuncios)  
3. **IndexNow**: notifica a Bing / Yandex / Naver / Seznam las URLs prioritarias (hasta 200/día)  
4. Publica **`/api/seo/sitemap-priority.xml`** con `lastmod` de hoy  
5. Guarda informe en **`/api/seo/report`**

### Endpoints útiles

- `GET /api/seo/plan` — plan en JSON  
- `GET /api/seo/report` — último informe  
- `GET /api/seo/sitemap-priority.xml` — sitemap prioritario dinámico  
- `POST /api/seo/run` — disparo manual (proteger con `SEO_CRON_SECRET`)

---

## Variables de entorno recomendadas

**Railway (backend)**

```
INDEXNOW_KEY=caperucitas-seo-indexnow-key-2026
SEO_CRON_SECRET=elige-un-secreto-largo
```

**Vercel (frontend)**

```
SEO_CRON_SECRET=el-mismo-secreto
BACKEND_URL=https://caperucitascom-production.up.railway.app
```

El fichero público de IndexNow debe existir en:

`https://www.caperucitas.com/caperucitas-seo-indexnow-key-2026.txt`

(ya está en `frontend/public/`)

---

## Qué NO se hace (a propósito)

- No se generan textos spam / doorways automáticos  
- No se clonan miles de páginas vacías  
- No se hace scraping de Google Search Console (haría falta OAuth)

Mejoras editoriales (blog, copy por ciudad) siguen siendo **manuales** o por deploy.
