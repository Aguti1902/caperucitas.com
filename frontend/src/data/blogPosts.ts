export interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  citySlug?: string
  tags: string[]
  /** Párrafos del cuerpo */
  body: string[]
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'putas-en-barcelona-2026',
    title: 'Putas y escorts en Barcelona 2026: guía práctica',
    description:
      'Cómo encontrar putas y escorts en Barcelona con contacto directo, filtros por zona y consejos de seguridad en Caperucitas.com.',
    date: '2026-07-01',
    citySlug: 'barcelona',
    tags: ['barcelona', 'escorts', 'guía'],
    body: [
      'Buscar putas o escorts en Barcelona ya no depende solo de foros antiguos: las páginas locales con el nombre de la ciudad rankean mejor en Google y te llevan a perfiles cercanos.',
      'En Caperucitas.com la URL /putas/barcelona lista anuncios activos con WhatsApp y teléfono. Puedes filtrar por chicas, chicos, trans, gays o masajes; al hacerlo cambia también el título SEO de la página.',
      'Si estás en el área metropolitana (Badalona, L’Hospitalet, Cornellà, Sabadell), usa la página de tu municipio: Google entiende mejor “putas Cornellà” que un listado genérico.',
      'Consejo de seguridad: contacta, verifica fotos y usa el botón de denuncia si detectas estafa o fotos falsas. Nunca adelantes dinero sin garantías claras.',
      'También existe la sección Sexo gratis (/sexo-gratis/barcelona) para contactos consensuados sin compensación económica. Son secciones separadas a propósito.',
    ],
  },
  {
    slug: 'putas-en-madrid-2026',
    title: 'Putas en Madrid 2026: cómo encontrar escorts cerca de ti',
    description:
      'Guía para encontrar putas y escorts en Madrid capital y área metropolitana con Caperucitas.com.',
    date: '2026-07-01',
    citySlug: 'madrid',
    tags: ['madrid', 'escorts', 'guía'],
    body: [
      'Madrid es la ciudad con más búsquedas de escorts en España. Para posicionarte (y para encontrar resultados útiles) conviene usar URLs locales: /putas/madrid.',
      'Activa la ubicación o elige tu distrito/municipio (Móstoles, Getafe, Alcalá…). Cada ciudad del sur y este de Madrid tiene página propia.',
      'El contador de “perfiles activos ahora” te dice si hay oferta real en ese momento. Si está a cero, verás perfiles cercanos y puedes publicar el tuyo.',
      'Filtra por categoría: /putas/chicas/en/madrid o /putas/gays/en/madrid cambian título y descripción para búsquedas long-tail.',
    ],
  },
  {
    slug: 'sexo-gratis-barcelona',
    title: 'Sexo gratis en Barcelona: qué es y cómo funciona',
    description:
      'Explicamos la sección Sexo gratis de Caperucitas en Barcelona: contactos consensuados sin pagar y normas claras.',
    date: '2026-07-05',
    citySlug: 'barcelona',
    tags: ['sexo gratis', 'barcelona'],
    body: [
      'Sexo gratis en Caperucitas no es un eufemismo de escort barata: es una sección aparte donde está prohibido pedir o aceptar dinero, regalos o beneficios.',
      'Entra en /sexo-gratis/barcelona. Si filtras por gays, la URL pasa a /sexo-gratis/gays/en/barcelona con contenido propio.',
      'Si no hay perfiles aún, no verás un muro vacío: hay texto explicativo, invitación a registrarte y perfiles cercanos de la misma sección.',
      'Incumplir las normas (pedir dinero) supone expulsión permanente. Puedes denunciar con el motivo “Pide dinero o regalos”.',
    ],
  },
  {
    slug: 'sexo-gratis-madrid',
    title: 'Sexo gratis en Madrid: contactos sin compensación',
    description:
      'Cómo usar la sección Sexo gratis en Madrid para conocer gente cerca sin pagar.',
    date: '2026-07-05',
    citySlug: 'madrid',
    tags: ['sexo gratis', 'madrid'],
    body: [
      'La sección /sexo-gratis/madrid está pensada para quien busca quedar sin intercambio económico.',
      'Crea un perfil eligiendo “Sexo gratis”, acepta el compromiso y publica fotos reales. Aparecerás solo en esa sección, no mezclado con escorts.',
      'Es un embudo distinto al de putas/escorts: atrae otro tipo de tráfico y, si no encaja, el usuario puede pasar a la sección de escorts.',
    ],
  },
  {
    slug: 'como-funciona-caperucitas',
    title: 'Cómo funciona Caperucitas.com (escorts y sexo gratis)',
    description:
      'Explicación clara de las dos secciones, ROAM, denuncias y cómo publicar un perfil.',
    date: '2026-07-08',
    tags: ['guía', 'caperucitas'],
    body: [
      'Caperucitas.com es un directorio para adultos con dos secciones: Escorts (compañía profesional) y Sexo gratis (sin compensación).',
      'No hace falta cuenta para ver perfiles y contactar por WhatsApp o teléfono. Para publicar sí: registro, perfil, fotos y elegir tipo.',
      'ROAM destaca tu anuncio temporalmente cerca de quien te busca. Las normas y denuncias están en /normas.',
      'El SEO local genera una página por municipio (/putas/ciudad) para que Google muestre resultados de tu zona al buscar “putas” + ciudad.',
    ],
  },
  {
    slug: 'putas-cerca-de-mi-ubicacion',
    title: 'Putas cerca de mí: ubicación y páginas por ciudad',
    description:
      'Por qué las páginas /putas/[ciudad] funcionan mejor que un listado único y cómo usar la geolocalización.',
    date: '2026-07-10',
    tags: ['seo local', 'ubicación'],
    body: [
      'Cuando buscas “putas” en Google, el buscador usa tu ubicación y prioriza páginas que mencionan tu ciudad en el título.',
      'Por eso Caperucitas tiene URLs como /putas/cornella-de-llobregat o /putas/figueres: compiten en long-tail frente a directorios genéricos.',
      'Si permites la ubicación en /perfiles, te redirigimos a la página de tu municipio automáticamente.',
      'Tip: comparte el enlace de TU ciudad en WhatsApp, no solo la home. Mejora clics y señales locales.',
    ],
  },
]

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug)
}
