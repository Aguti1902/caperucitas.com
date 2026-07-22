/** Textos SEO únicos para top ciudades — evita thin/doorway content */

export interface CitySeoCopy {
  slug: string
  name: string
  /** Párrafo principal (escorts) */
  escortIntro: string
  /** Párrafo principal (sexo gratis) */
  gratisIntro: string
  /** Dato local / gancho */
  localNote: string
  /** FAQ corta */
  faq: { q: string; a: string }[]
}

export const TOP_CITY_SEO_COPY: Record<string, CitySeoCopy> = {
  madrid: {
    slug: 'madrid',
    name: 'Madrid',
    escortIntro:
      'Madrid concentra la mayor oferta de putas y escorts de España. En Caperucitas encuentras perfiles verificados por zonas (Centro, Chamberí, Salamanca, Latina) con WhatsApp y teléfono a un toque. Filtra por chicas, chicos, trans o masajes y contacta de forma discreta.',
    gratisIntro:
      'La sección Sexo gratis en Madrid está pensada para contactos consensuados sin pagar. Publica tu perfil o busca personas cerca de ti en la capital. Si no hay nadie activo aún en tu barrio, verás perfiles cercanos y podrás ser de los primeros en aparecer.',
    localNote: 'Cobertura en toda la Comunidad de Madrid: capital y municipios limítrofes.',
    faq: [
      { q: '¿Cómo contacto en Madrid?', a: 'Abre el perfil y usa Llamar o WhatsApp. No hace falta crear cuenta para contactar.' },
      { q: '¿Hay escorts en mi zona?', a: 'Usa el filtro de ciudad o activa la ubicación para ordenar por cercanía.' },
    ],
  },
  barcelona: {
    slug: 'barcelona',
    name: 'Barcelona',
    escortIntro:
      'Putas y escorts en Barcelona y área metropolitana (Badalona, L’Hospitalet, Cornellà, Sabadell). Perfiles con fotos, contacto directo y anuncios cerca de ti. Ideal si buscas compañía en BCN, el Eixample o la zona portuaria.',
    gratisIntro:
      'Sexo gratis en Barcelona: encuentros consensuados sin compensación económica. Caperucitas conecta personas en BCN y alrededores. Regístrate gratis y aparece cuando haya gente cerca de tu ubicación.',
    localNote: 'Incluye área metropolitana de Barcelona y comarcas limítrofes.',
    faq: [
      { q: '¿Funciona en Cornellà o Badalona?', a: 'Sí. Cada municipio tiene su propia página SEO; también puedes explorar perfiles cercanos.' },
      { q: '¿Es discreto?', a: 'El contacto es directo entre usuarios. No publicamos tu teléfono en listados abiertos sin tu perfil.' },
    ],
  },
  valencia: {
    slug: 'valencia',
    name: 'Valencia',
    escortIntro:
      'Escorts y putas en Valencia capital y provincia. Encuentra anuncios con fotos reales y contacto inmediato. Desde el centro histórico hasta la playa de la Malvarrosa y pueblos cercanos.',
    gratisIntro:
      'Sexo gratis en Valencia para quien busca quedar sin pagar. Crea perfil, indícate cerca de la ciudad y conecta cuando haya personas activas en tu zona.',
    localNote: 'Ciudad y área metropolitana del Turia.',
    faq: [
      { q: '¿Puedo filtrar por chicas o gays?', a: 'Sí. Al filtrar cambia la URL (ej. /putas/chicas/en/valencia) y el título de la página.' },
    ],
  },
  sevilla: {
    slug: 'sevilla',
    name: 'Sevilla',
    escortIntro:
      'Putas y escorts en Sevilla: perfiles locales con WhatsApp y teléfono. Busca compañía en Triana, Nervión, el centro o municipios del área metropolitana.',
    gratisIntro:
      'Contactos de sexo gratis en Sevilla sin compensación. Si aún hay pocos perfiles, explora cercanos o publica el tuyo para salir en los primeros resultados de la ciudad.',
    localNote: 'Andalucía occidental — Sevilla y alrededores.',
    faq: [
      { q: '¿Hay que pagar por usar la web?', a: 'Navegar y contactar es gratis. Las escorts gestionan sus propias condiciones.' },
    ],
  },
  malaga: {
    slug: 'malaga',
    name: 'Málaga',
    escortIntro:
      'Escorts en Málaga capital y Costa del Sol cercana. Anuncios con fotos y contacto directo para residentes y visitantes. Combina bien con Marbella, Torremolinos y Fuengirola en páginas vecinas.',
    gratisIntro:
      'Sexo gratis en Málaga: queda con gente cerca sin pagar. Ideal si estás de paso o vives en la capital malagueña.',
    localNote: 'Costa del Sol oriental y capital.',
    faq: [
      { q: '¿Cubís la Costa del Sol?', a: 'Sí: Marbella, Torremolinos, Fuengirola y más tienen páginas propias enlazadas.' },
    ],
  },
  bilbao: {
    slug: 'bilbao',
    name: 'Bilbao',
    escortIntro:
      'Putas y escorts en Bilbao y Gran Bilbao. Perfiles en euskera/castellano según cada anuncio, contacto por WhatsApp y teléfono.',
    gratisIntro:
      'Sexo gratis en Bilbao para contactos consensuados en Bizkaia. Publica o busca sin compensación económica.',
    localNote: 'Bizkaia — capital y margen izquierda/derecha.',
    faq: [
      { q: '¿Solo Bilbao ciudad?', a: 'Verás perfiles de la ciudad y, si no hay, sugerencias cercanas del área.' },
    ],
  },
  zaragoza: {
    slug: 'zaragoza',
    name: 'Zaragoza',
    escortIntro:
      'Escorts en Zaragoza: directorio local con anuncios activos, fotos y contacto directo. Del Casco Histórico a Delicias y Actur.',
    gratisIntro:
      'Sexo gratis en Zaragoza sin pagar. Conecta con personas de la ciudad o alrededores cuando haya actividad.',
    localNote: 'Aragón — principal polo urbano.',
    faq: [
      { q: '¿Cómo publico?', a: 'Regístrate, elige Escort o Sexo gratis, sube fotos y activa el perfil.' },
    ],
  },
  murcia: {
    slug: 'murcia',
    name: 'Murcia',
    escortIntro:
      'Putas y escorts en Murcia capital y entorno. Contacto inmediato y perfiles ordenados por cercanía si activas la ubicación.',
    gratisIntro:
      'Sexo gratis en Murcia: encuentros consensuados sin compensación. Sé de los primeros perfiles activos de la zona.',
    localNote: 'Región de Murcia.',
    faq: [{ q: '¿Hay masajes?', a: 'Sí, usa el filtro Masajes o la URL /putas/masajes/en/murcia.' }],
  },
  'palma-de-mallorca': {
    slug: 'palma-de-mallorca',
    name: 'Palma de Mallorca',
    escortIntro:
      'Escorts en Palma de Mallorca para residentes y turismo. Anuncios discretos con WhatsApp. Explora también Calvià e Ibiza en el directorio de ciudades.',
    gratisIntro:
      'Sexo gratis en Palma: contactos sin pagar en Mallorca. Publica tu perfil si buscas quedar de forma consensuada.',
    localNote: 'Islas Baleares — Mallorca.',
    faq: [{ q: '¿Ibiza también?', a: 'Sí, Ibiza tiene página propia en /putas/ibiza.' }],
  },
  'las-palmas-de-gran-canaria': {
    slug: 'las-palmas-de-gran-canaria',
    name: 'Las Palmas de Gran Canaria',
    escortIntro:
      'Putas y escorts en Las Palmas de Gran Canaria. Perfiles locales y de la isla con contacto directo.',
    gratisIntro:
      'Sexo gratis en Las Palmas: conecta sin compensación económica en Gran Canaria.',
    localNote: 'Canarias — Gran Canaria.',
    faq: [{ q: '¿Tenerife?', a: 'Santa Cruz de Tenerife y otros municipios canarios tienen URLs propias.' }],
  },
  alicante: {
    slug: 'alicante',
    name: 'Alicante',
    escortIntro:
      'Escorts en Alicante ciudad y costa (Benidorm, Torrevieja, Elche cerca). Contacto WhatsApp y listados por distancia.',
    gratisIntro:
      'Sexo gratis en Alicante para quedar sin pagar. Ideal capital y área metropolitana.',
    localNote: 'Costa Blanca.',
    faq: [{ q: '¿Benidorm?', a: 'Sí: /putas/benidorm y /sexo-gratis/benidorm.' }],
  },
  cordoba: {
    slug: 'cordoba',
    name: 'Córdoba',
    escortIntro: 'Putas y escorts en Córdoba. Anuncios con fotos y teléfono/WhatsApp para contacto discreto en la ciudad califal.',
    gratisIntro: 'Sexo gratis en Córdoba: contactos consensuados sin compensación económica.',
    localNote: 'Andalucía — Córdoba.',
    faq: [{ q: '¿Es gratis registrarse?', a: 'Sí, crear perfil es gratuito.' }],
  },
  granada: {
    slug: 'granada',
    name: 'Granada',
    escortIntro: 'Escorts en Granada capital. Perfiles cerca del centro, Zaidín y área metropolitana con contacto directo.',
    gratisIntro: 'Sexo gratis en Granada para encuentros consensuados sin pagar.',
    localNote: 'Andalucía oriental.',
    faq: [{ q: '¿Hay perfiles ahora?', a: 'El contador de la página indica cuántos hay activos en Granada.' }],
  },
  'a-coruna': {
    slug: 'a-coruna',
    name: 'A Coruña',
    escortIntro: 'Putas y escorts en A Coruña. Directorio gallego con contacto WhatsApp y orden por cercanía.',
    gratisIntro: 'Sexo gratis en A Coruña: conecta sin compensación en Galicia.',
    localNote: 'Galicia — A Coruña.',
    faq: [{ q: '¿Vigo o Santiago?', a: 'También tienen páginas: /putas/vigo y /putas/santiago-de-compostela.' }],
  },
  vigo: {
    slug: 'vigo',
    name: 'Vigo',
    escortIntro: 'Escorts en Vigo, la ciudad más poblada de Galicia. Anuncios locales y contacto inmediato.',
    gratisIntro: 'Sexo gratis en Vigo sin pagar. Publica o busca personas cercanas.',
    localNote: 'Pontevedra — Vigo.',
    faq: [{ q: '¿Cómo denuncio un perfil?', a: 'Desde la ficha del perfil, botón denunciar.' }],
  },
  gijon: {
    slug: 'gijon',
    name: 'Gijón',
    escortIntro: 'Putas y escorts en Gijón. Perfiles asturianos con WhatsApp y teléfono.',
    gratisIntro: 'Sexo gratis en Gijón para contactos consensuados en Asturias.',
    localNote: 'Asturias — Gijón.',
    faq: [{ q: '¿Oviedo?', a: 'Sí: /putas/oviedo.' }],
  },
  oviedo: {
    slug: 'oviedo',
    name: 'Oviedo',
    escortIntro: 'Escorts en Oviedo capital. Contacto directo y perfiles cerca del centro asturiano.',
    gratisIntro: 'Sexo gratis en Oviedo sin compensación económica.',
    localNote: 'Asturias — capital.',
    faq: [{ q: '¿Normas sexo gratis?', a: 'Prohibido pedir o aceptar dinero; el incumplimiento supone baneo.' }],
  },
  pamplona: {
    slug: 'pamplona',
    name: 'Pamplona',
    escortIntro: 'Putas y escorts en Pamplona / Iruña. Anuncios locales con contacto discreto.',
    gratisIntro: 'Sexo gratis en Pamplona: queda sin pagar de forma consensuada.',
    localNote: 'Navarra.',
    faq: [{ q: '¿Solo capital?', a: 'Ciudad y sugerencias cercanas si hay poca actividad.' }],
  },
  'san-sebastian': {
    slug: 'san-sebastian',
    name: 'San Sebastián',
    escortIntro: 'Escorts en San Sebastián / Donostia. Perfiles en la costa guipuzcoana con WhatsApp.',
    gratisIntro: 'Sexo gratis en San Sebastián para contactos sin compensación.',
    localNote: 'Gipuzkoa.',
    faq: [{ q: '¿Bilbao cerca?', a: 'Enlazamos ciudades cercanas al final de cada página.' }],
  },
  santander: {
    slug: 'santander',
    name: 'Santander',
    escortIntro: 'Putas y escorts en Santander. Directorio cántabro con contacto inmediato.',
    gratisIntro: 'Sexo gratis en Santander sin pagar.',
    localNote: 'Cantabria.',
    faq: [{ q: '¿ROAM qué es?', a: 'Destaca tu perfil temporalmente en las primeras posiciones de tu zona.' }],
  },
  valladolid: {
    slug: 'valladolid',
    name: 'Valladolid',
    escortIntro: 'Escorts en Valladolid. Anuncios del centro de Castilla y León con fotos y WhatsApp.',
    gratisIntro: 'Sexo gratis en Valladolid: contactos consensuados sin compensación.',
    localNote: 'Castilla y León.',
    faq: [{ q: '¿Filtro por edad?', a: 'Sí, en la barra superior del listado.' }],
  },
  badalona: {
    slug: 'badalona',
    name: 'Badalona',
    escortIntro: 'Putas y escorts en Badalona, junto a Barcelona. Perfiles del Barcelonès Nord con contacto directo.',
    gratisIntro: 'Sexo gratis en Badalona. Si hay pocos perfiles, verás cercanos de Barcelona y alrededores.',
    localNote: 'Área metropolitana de Barcelona.',
    faq: [{ q: '¿Mejor buscar Barcelona?', a: 'Puedes usar ambas: Badalona es más local; Barcelona da más volumen.' }],
  },
  'hospitalet-de-llobregat': {
    slug: 'hospitalet-de-llobregat',
    name: 'Hospitalet de Llobregat',
    escortIntro: 'Escorts en L’Hospitalet de Llobregat. Segunda ciudad de Cataluña con anuncios locales y enlace a Barcelona.',
    gratisIntro: 'Sexo gratis en L’Hospitalet. Contactos sin pagar junto a Barcelona.',
    localNote: 'Barcelonès.',
    faq: [{ q: '¿Nombre en la URL?', a: 'Usamos hospitalet-de-llobregat como slug SEO.' }],
  },
  'cornella-de-llobregat': {
    slug: 'cornella-de-llobregat',
    name: 'Cornellà de Llobregat',
    escortIntro: 'Putas y escorts en Cornellà de Llobregat. Página local del Baix Llobregat con contacto WhatsApp; ideal frente a buscadores genéricos de Barcelona.',
    gratisIntro: 'Sexo gratis en Cornellà. Queda cerca sin compensación económica.',
    localNote: 'Baix Llobregat — long tail SEO.',
    faq: [{ q: '¿Por qué una página solo de Cornellà?', a: 'Google posiciona mejor URLs locales específicas que solo “Barcelona”.' }],
  },
  terrassa: {
    slug: 'terrassa',
    name: 'Terrassa',
    escortIntro: 'Escorts en Terrassa (Vallès Occidental). Anuncios locales y perfiles cercanos a Sabadell/Barcelona.',
    gratisIntro: 'Sexo gratis en Terrassa sin pagar.',
    localNote: 'Vallès Occidental.',
    faq: [{ q: '¿Sabadell?', a: 'Sí: /putas/sabadell.' }],
  },
  sabadell: {
    slug: 'sabadell',
    name: 'Sabadell',
    escortIntro: 'Putas y escorts en Sabadell. Directorio del Vallès con contacto directo.',
    gratisIntro: 'Sexo gratis en Sabadell para contactos consensuados.',
    localNote: 'Vallès Occidental.',
    faq: [{ q: '¿Cómo ordenáis?', a: 'Por distancia si hay ubicación; si no, por actividad reciente.' }],
  },
  mataro: {
    slug: 'mataro',
    name: 'Mataró',
    escortIntro: 'Escorts en Mataró (Maresme). Perfiles costeros cerca de Barcelona con WhatsApp.',
    gratisIntro: 'Sexo gratis en Mataró sin compensación.',
    localNote: 'Maresme.',
    faq: [{ q: '¿Hay poca gente?', a: 'Mostramos perfiles cercanos y te invitamos a publicar el tuyo.' }],
  },
  girona: {
    slug: 'girona',
    name: 'Girona',
    escortIntro: 'Putas y escorts en Girona ciudad. Anuncios de las comarcas gerundenses con contacto directo.',
    gratisIntro: 'Sexo gratis en Girona. Ideal también si estás en Figueres u otras zonas cercanas.',
    localNote: 'Provincia de Girona.',
    faq: [{ q: '¿Figueres?', a: 'Sí: /putas/figueres y /sexo-gratis/figueres.' }],
  },
  figueres: {
    slug: 'figueres',
    name: 'Figueres',
    escortIntro: 'Escorts en Figueres (Alt Empordà). Página local para búsquedas de putas cerca de Figueres, no solo Barcelona.',
    gratisIntro: 'Sexo gratis en Figueres: contactos consensuados sin pagar. Filtra por gays, chicas, etc. y la URL cambia.',
    localNote: 'Alt Empordà — long tail.',
    faq: [
      { q: '¿Gays en Figueres?', a: 'Usa /sexo-gratis/gays/en/figueres para esa categoría con título propio.' },
    ],
  },
  tarragona: {
    slug: 'tarragona',
    name: 'Tarragona',
    escortIntro: 'Putas y escorts en Tarragona. Costa dorada con anuncios y contacto WhatsApp.',
    gratisIntro: 'Sexo gratis en Tarragona sin compensación económica.',
    localNote: 'Tarragonès.',
    faq: [{ q: '¿Reus?', a: 'Sí: /putas/reus.' }],
  },
  marbella: {
    slug: 'marbella',
    name: 'Marbella',
    escortIntro: 'Escorts en Marbella y Golden Mile. Perfiles orientados a residentes y turismo de lujo en la Costa del Sol.',
    gratisIntro: 'Sexo gratis en Marbella: contactos consensuados sin pagar.',
    localNote: 'Costa del Sol — alto turismo.',
    faq: [{ q: '¿Solo Marbella?', a: 'También Estepona, Fuengirola y Málaga tienen páginas propias.' }],
  },
  benidorm: {
    slug: 'benidorm',
    name: 'Benidorm',
    escortIntro: 'Putas y escorts en Benidorm. Alta demanda turística; anuncios con contacto inmediato.',
    gratisIntro: 'Sexo gratis en Benidorm sin compensación.',
    localNote: 'Costa Blanca — turismo.',
    faq: [{ q: '¿Idioma?', a: 'Los perfiles escriben en el idioma que elijan; muchos en español e inglés.' }],
  },
  torrevieja: {
    slug: 'torrevieja',
    name: 'Torrevieja',
    escortIntro: 'Escorts en Torrevieja. Costa alicantina con perfiles locales y de residentes europeos.',
    gratisIntro: 'Sexo gratis en Torrevieja para quedar sin pagar.',
    localNote: 'Vega Baja del Segura.',
    faq: [{ q: '¿Alicante cerca?', a: 'Sí, enlazada como ciudad cercana.' }],
  },
  ibiza: {
    slug: 'ibiza',
    name: 'Ibiza',
    escortIntro: 'Putas y escorts en Ibiza. Temporada alta y residentes: contacto WhatsApp discreto.',
    gratisIntro: 'Sexo gratis en Ibiza sin compensación económica.',
    localNote: 'Baleares — Ibiza.',
    faq: [{ q: '¿Todo el año?', a: 'La oferta varía por temporada; el contador refleja perfiles activos ahora.' }],
  },
  elche: {
    slug: 'elche',
    name: 'Elche',
    escortIntro: 'Escorts en Elche. Segunda ciudad de Alicante con anuncios locales.',
    gratisIntro: 'Sexo gratis en Elche sin pagar.',
    localNote: 'Baix Vinalopó.',
    faq: [{ q: '¿Cómo activo ROAM?', a: 'Desde tu cuenta, sección Plus/ROAM.' }],
  },
  cartagena: {
    slug: 'cartagena',
    name: 'Cartagena',
    escortIntro: 'Putas y escorts en Cartagena (Murcia). Puerto y ciudad con contacto directo.',
    gratisIntro: 'Sexo gratis en Cartagena consensuado y sin compensación.',
    localNote: 'Región de Murcia.',
    faq: [{ q: '¿Denuncias?', a: 'Puedes denunciar estafas o fotos falsas desde el perfil.' }],
  },
  almeria: {
    slug: 'almeria',
    name: 'Almería',
    escortIntro: 'Escorts en Almería capital. Anuncios del sureste andaluz con WhatsApp.',
    gratisIntro: 'Sexo gratis en Almería sin compensación.',
    localNote: 'Andalucía — Almería.',
    faq: [{ q: '¿Roquetas?', a: 'Sí: /putas/roquetas-de-mar.' }],
  },
  cadiz: {
    slug: 'cadiz',
    name: 'Cádiz',
    escortIntro: 'Putas y escorts en Cádiz. Perfiles de la bahía gaditana con contacto inmediato.',
    gratisIntro: 'Sexo gratis en Cádiz para contactos sin pagar.',
    localNote: 'Bahía de Cádiz.',
    faq: [{ q: '¿Jerez?', a: 'Sí: /putas/jerez-de-la-frontera.' }],
  },
  'jerez-de-la-frontera': {
    slug: 'jerez-de-la-frontera',
    name: 'Jerez de la Frontera',
    escortIntro: 'Escorts en Jerez de la Frontera. Anuncios locales con fotos y WhatsApp.',
    gratisIntro: 'Sexo gratis en Jerez sin compensación económica.',
    localNote: 'Cádiz — Jerez.',
    faq: [{ q: '¿Slug largo?', a: 'jerez-de-la-frontera es el nombre SEO oficial del municipio.' }],
  },
  logroño: {
    slug: 'logrono',
    name: 'Logroño',
    escortIntro: 'Putas y escorts en Logroño. Capital riojana con contacto directo.',
    gratisIntro: 'Sexo gratis en Logroño consensuado y sin pagar.',
    localNote: 'La Rioja.',
    faq: [{ q: '¿Poca oferta?', a: 'Mostramos cercanos y animamos a publicar para crecer el listado.' }],
  },
  badajoz: {
    slug: 'badajoz',
    name: 'Badajoz',
    escortIntro: 'Escorts en Badajoz. Extremadura con anuncios y WhatsApp.',
    gratisIntro: 'Sexo gratis en Badajoz sin compensación.',
    localNote: 'Extremadura.',
    faq: [{ q: '¿Cáceres?', a: 'Sí: /putas/caceres.' }],
  },
  salamanca: {
    slug: 'salamanca',
    name: 'Salamanca',
    escortIntro: 'Putas y escorts en Salamanca. Ciudad universitaria con perfiles locales.',
    gratisIntro: 'Sexo gratis en Salamanca para contactos consensuados.',
    localNote: 'Castilla y León.',
    faq: [{ q: '¿Estudiantes?', a: 'Solo mayores de 18. Verificamos normas de comunidad.' }],
  },
  leon: {
    slug: 'leon',
    name: 'León',
    escortIntro: 'Escorts en León. Anuncios de la capital leonesa con contacto directo.',
    gratisIntro: 'Sexo gratis en León sin pagar.',
    localNote: 'Castilla y León — León.',
    faq: [{ q: '¿Cómo cambio a Sexo gratis?', a: 'En editar perfil elige el tipo Sexo gratis y acepta las normas.' }],
  },
  burgos: {
    slug: 'burgos',
    name: 'Burgos',
    escortIntro: 'Putas y escorts en Burgos. Directorio local castellano.',
    gratisIntro: 'Sexo gratis en Burgos consensuado.',
    localNote: 'Castilla y León — Burgos.',
    faq: [{ q: '¿Ciudades cercanas?', a: 'Al final de la página hay enlaces a municipios de la provincia.' }],
  },
  albacete: {
    slug: 'albacete',
    name: 'Albacete',
    escortIntro: 'Escorts en Albacete. Mancha oriental con WhatsApp y teléfono.',
    gratisIntro: 'Sexo gratis en Albacete sin compensación.',
    localNote: 'Castilla-La Mancha.',
    faq: [{ q: '¿Toledo?', a: 'Sí: /putas/toledo.' }],
  },
  toledo: {
    slug: 'toledo',
    name: 'Toledo',
    escortIntro: 'Putas y escorts en Toledo. Cerca de Madrid; perfiles locales y de la provincia.',
    gratisIntro: 'Sexo gratis en Toledo para quedar sin pagar.',
    localNote: 'Castilla-La Mancha — capital.',
    faq: [{ q: '¿Madrid cerca?', a: 'Sí; mucha gente usa ambas páginas según desplazamiento.' }],
  },
  'castellon-de-la-plana': {
    slug: 'castellon-de-la-plana',
    name: 'Castellón de la Plana',
    escortIntro: 'Escorts en Castellón de la Plana. Costa mediterránea con contacto directo.',
    gratisIntro: 'Sexo gratis en Castellón sin compensación económica.',
    localNote: 'Comunidad Valenciana.',
    faq: [{ q: '¿Nombre corto?', a: 'El slug oficial es castellon-de-la-plana.' }],
  },
  'santa-cruz-de-tenerife': {
    slug: 'santa-cruz-de-tenerife',
    name: 'Santa Cruz de Tenerife',
    escortIntro: 'Putas y escorts en Santa Cruz de Tenerife. Capital tinerfeña con anuncios locales.',
    gratisIntro: 'Sexo gratis en Santa Cruz de Tenerife sin pagar.',
    localNote: 'Canarias — Tenerife.',
    faq: [{ q: '¿Las Palmas?', a: 'Otra isla, otra URL: /putas/las-palmas-de-gran-canaria.' }],
  },
  'vitoria-gasteiz': {
    slug: 'vitoria-gasteiz',
    name: 'Vitoria-Gasteiz',
    escortIntro: 'Escorts en Vitoria-Gasteiz. Capital alavesa con WhatsApp y teléfono.',
    gratisIntro: 'Sexo gratis en Vitoria-Gasteiz consensuado.',
    localNote: 'Álava / Araba.',
    faq: [{ q: '¿Nombre bilingüe?', a: 'Usamos vitoria-gasteiz como en el INE.' }],
  },
  ourense: {
    slug: 'ourense',
    name: 'Ourense',
    escortIntro: 'Putas y escorts en Ourense. Interior gallego con anuncios locales.',
    gratisIntro: 'Sexo gratis en Ourense sin compensación.',
    localNote: 'Galicia — Ourense.',
    faq: [{ q: '¿Lugo?', a: 'Sí: /putas/lugo.' }],
  },
  lugo: {
    slug: 'lugo',
    name: 'Lugo',
    escortIntro: 'Escorts en Lugo. Perfiles gallegos con contacto directo.',
    gratisIntro: 'Sexo gratis en Lugo para contactos consensuados.',
    localNote: 'Galicia — Lugo.',
    faq: [{ q: '¿A Coruña?', a: 'Enlazada como ciudad cercana / provincia vecina.' }],
  },
  huelva: {
    slug: 'huelva',
    name: 'Huelva',
    escortIntro: 'Putas y escorts en Huelva. Costa onubense con WhatsApp.',
    gratisIntro: 'Sexo gratis en Huelva sin pagar.',
    localNote: 'Andalucía — Huelva.',
    faq: [{ q: '¿Sevilla cerca?', a: 'Sí; mucha gente combina ambas búsquedas.' }],
  },
  jaen: {
    slug: 'jaen',
    name: 'Jaén',
    escortIntro: 'Escorts en Jaén. Capital jiennense con anuncios y contacto directo.',
    gratisIntro: 'Sexo gratis en Jaén consensuado y sin compensación.',
    localNote: 'Andalucía — Jaén.',
    faq: [{ q: '¿Cómo publico gratis?', a: 'Registro → crear perfil → tipo Escort o Sexo gratis.' }],
  },
  lleida: {
    slug: 'lleida',
    name: 'Lleida',
    escortIntro: 'Putas y escorts en Lleida. Interior catalán con perfiles locales.',
    gratisIntro: 'Sexo gratis en Lleida sin compensación económica.',
    localNote: 'Cataluña — Lleida.',
    faq: [{ q: '¿Barcelona?', a: 'Distinta provincia; usa /putas/barcelona si te desplazas.' }],
  },
  'mostoles': {
    slug: 'mostoles',
    name: 'Móstoles',
    escortIntro: 'Escorts en Móstoles (sur de Madrid). Perfiles del área metropolitana con contacto WhatsApp.',
    gratisIntro: 'Sexo gratis en Móstoles. Si hay pocos, verás cercanos de Madrid.',
    localNote: 'Área metropolitana de Madrid.',
    faq: [{ q: '¿Mejor Madrid?', a: 'Madrid da más volumen; Móstoles rankea búsquedas locales del sur.' }],
  },
  getafe: {
    slug: 'getafe',
    name: 'Getafe',
    escortIntro: 'Putas y escorts en Getafe. Sur de Madrid con anuncios locales.',
    gratisIntro: 'Sexo gratis en Getafe sin pagar.',
    localNote: 'Área metropolitana de Madrid.',
    faq: [{ q: '¿Leganés?', a: 'Sí: /putas/leganes.' }],
  },
  fuenlabrada: {
    slug: 'fuenlabrada',
    name: 'Fuenlabrada',
    escortIntro: 'Escorts en Fuenlabrada. Perfiles del sur madrileño con WhatsApp.',
    gratisIntro: 'Sexo gratis en Fuenlabrada consensuado.',
    localNote: 'Sur de Madrid.',
    faq: [{ q: '¿Contador?', a: 'Arriba verás cuántos perfiles hay ahora en Fuenlabrada.' }],
  },
  'alcala-de-henares': {
    slug: 'alcala-de-henares',
    name: 'Alcalá de Henares',
    escortIntro: 'Putas y escorts en Alcalá de Henares. Corredor del Henares con contacto directo.',
    gratisIntro: 'Sexo gratis en Alcalá de Henares sin compensación.',
    localNote: 'Este de Madrid.',
    faq: [{ q: '¿Torrejón?', a: 'Sí: /putas/torrejon-de-ardoz.' }],
  },
}

export function getTopCityCopy(slug: string): CitySeoCopy | null {
  return TOP_CITY_SEO_COPY[slug] || null
}
