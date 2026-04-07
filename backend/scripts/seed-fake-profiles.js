const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Imágenes de mujeres de picsum.photos (IDs específicos que lucen bien)
const FEMALE_PHOTO_SETS = [
  [
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80',
    'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&q=80',
  ],
  [
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80',
    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80',
  ],
  [
    'https://images.unsplash.com/photo-1541823709867-1b206113eafd?w=600&q=80',
    'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=600&q=80',
    'https://images.unsplash.com/photo-1521146764736-56c929d59c83?w=600&q=80',
  ],
  [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&q=80',
    'https://images.unsplash.com/photo-1463453091185-61582044d556?w=600&q=80',
  ],
  [
    'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&q=80',
    'https://images.unsplash.com/photo-1485893086445-ed75865251e0?w=600&q=80',
    'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&q=80',
  ],
  [
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
    'https://images.unsplash.com/photo-1481214110143-ed630356e1bb?w=600&q=80',
  ],
  [
    'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=600&q=80',
    'https://images.unsplash.com/photo-1598550874175-4d0ef436c909?w=600&q=80',
    'https://images.unsplash.com/photo-1503104834685-7205e8607eb9?w=600&q=80',
  ],
];

const MALE_PHOTO_SETS = [
  [
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&q=80',
    'https://images.unsplash.com/photo-1522556189639-b150ed9c4330?w=600&q=80',
  ],
  [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80',
  ],
];

const CITIES = [
  { name: 'Madrid', lat: 40.4168, lng: -3.7038 },
  { name: 'Barcelona', lat: 41.3851, lng: 2.1734 },
  { name: 'Valencia', lat: 39.4699, lng: -0.3763 },
  { name: 'Sevilla', lat: 37.3891, lng: -5.9845 },
  { name: 'Zaragoza', lat: 41.6488, lng: -0.8891 },
  { name: 'Málaga', lat: 36.7213, lng: -4.4214 },
  { name: 'Bilbao', lat: 43.2630, lng: -2.9350 },
  { name: 'Alicante', lat: 38.3452, lng: -0.4810 },
  { name: 'Murcia', lat: 37.9922, lng: -1.1307 },
  { name: 'Palma', lat: 39.5696, lng: 2.6502 },
];

const PROFILES_DATA = [
  // === CHICAS ===
  {
    name: 'Sofía',
    email: 'sofia.escort@fake.com',
    gender: 'chica',
    age: 24,
    city: 'Madrid',
    phone: '+34 612 345 678',
    whatsapp: '+34 612 345 678',
    title: 'Sofía - Madrid VIP',
    aboutMe: 'Soy una chica sofisticada y elegante, me encanta disfrutar de buena compañía. Discreta, educada y muy cariñosa. Disponible para citas en hoteles o domicilio.',
    lookingFor: 'Caballeros educados que busquen una experiencia única y memorable.',
    height: 168,
    bodyType: 'atlético',
    photos: FEMALE_PHOTO_SETS[0],
    roaming: true,
  },
  {
    name: 'Valentina',
    email: 'valentina.escort@fake.com',
    gender: 'chica',
    age: 26,
    city: 'Barcelona',
    phone: '+34 623 456 789',
    whatsapp: '+34 623 456 789',
    title: 'Valentina BCN',
    aboutMe: 'Brasileña apasionada y sensual. Me encanta hacer sentir especiales a mis clientes. Totalmente natural, sin prisas.',
    lookingFor: 'Hombres que valoren la calidad y la discreción.',
    height: 172,
    bodyType: 'delgado',
    photos: FEMALE_PHOTO_SETS[1],
  },
  {
    name: 'Isabella',
    email: 'isabella.escort@fake.com',
    gender: 'chica',
    age: 22,
    city: 'Valencia',
    phone: '+34 634 567 890',
    whatsapp: '+34 634 567 890',
    title: 'Isabella Valencia',
    aboutMe: 'Joven universitaria buscando experiencias especiales. Soy muy femenina, cariñosa y divertida. Primera vez en esto, aprendo rápido 😊',
    lookingFor: 'Hombres maduros y con experiencia que sepan tratar bien a una chica.',
    height: 162,
    bodyType: 'delgado',
    photos: FEMALE_PHOTO_SETS[2],
  },
  {
    name: 'Daniela',
    email: 'daniela.escort@fake.com',
    gender: 'chica',
    age: 29,
    city: 'Sevilla',
    phone: '+34 645 678 901',
    whatsapp: '+34 645 678 901',
    title: 'Daniela - Sevilla',
    aboutMe: 'Morena sevillana de pura cepa. Apasionada, ardiente y con mucho arte. Si buscas algo diferente, aquí estoy.',
    lookingFor: 'Hombres con ganas de pasarlo bien sin complicaciones.',
    height: 165,
    bodyType: 'atlético',
    photos: FEMALE_PHOTO_SETS[3],
    roaming: true,
  },
  {
    name: 'Camila',
    email: 'camila.escort@fake.com',
    gender: 'chica',
    age: 25,
    city: 'Madrid',
    phone: '+34 656 789 012',
    whatsapp: '+34 656 789 012',
    title: 'Camila Premium',
    aboutMe: 'Colombiana explosiva y muy profesional. Atención al detalle, siempre impecable. Hablo inglés perfectamente para clientes internacionales.',
    lookingFor: 'Caballeros que busquen una experiencia de primera clase.',
    height: 170,
    bodyType: 'atlético',
    photos: FEMALE_PHOTO_SETS[4],
  },
  {
    name: 'Natalia',
    email: 'natalia.escort@fake.com',
    gender: 'chica',
    age: 31,
    city: 'Zaragoza',
    phone: '+34 667 890 123',
    whatsapp: '+34 667 890 123',
    title: 'Natalia - Zaragoza',
    aboutMe: 'Mujer independiente y segura de mí misma. Experiencia y madurez para brindarte momentos únicos. Muy versátil y sin tabúes.',
    lookingFor: 'Hombres de negocios o viajeros que busquen compañía de calidad.',
    height: 167,
    bodyType: 'promedio',
    photos: FEMALE_PHOTO_SETS[5],
  },
  {
    name: 'Luna',
    email: 'luna.escort@fake.com',
    gender: 'chica',
    age: 23,
    city: 'Málaga',
    phone: '+34 678 901 234',
    whatsapp: '+34 678 901 234',
    title: 'Luna - Málaga Beach',
    aboutMe: 'Chica de playa, alegre y desenfadada. Perfecta para acompañarte en tus vacaciones o escapadas a Málaga. Sin complicaciones.',
    lookingFor: 'Turistas y locales que quieran disfrutar del sol y la compañía.',
    height: 163,
    bodyType: 'atlético',
    photos: FEMALE_PHOTO_SETS[6],
    roaming: true,
  },
  // === CHICOS ===
  {
    name: 'Alejandro',
    email: 'alejandro.escort@fake.com',
    gender: 'chico',
    age: 27,
    city: 'Barcelona',
    phone: '+34 689 012 345',
    whatsapp: '+34 689 012 345',
    title: 'Alejandro - BCN',
    aboutMe: 'Chico joven, atlético y muy discreto. Para mujeres y parejas que busquen algo diferente. Elegante, educado y sin prisa.',
    lookingFor: 'Mujeres o parejas abiertas que quieran vivir nuevas experiencias.',
    height: 182,
    bodyType: 'atlético',
    photos: MALE_PHOTO_SETS[0],
  },
  {
    name: 'Marcos',
    email: 'marcos.escort@fake.com',
    gender: 'chico',
    age: 30,
    city: 'Madrid',
    phone: '+34 690 123 456',
    whatsapp: '+34 690 123 456',
    title: 'Marcos - Madrid',
    aboutMe: 'Hombre maduro, seguro y con experiencia. Sé cómo hacer sentir bien a una mujer. Disponible para cenas, eventos y más.',
    lookingFor: 'Mujeres que busquen un hombre de verdad, sin prisa.',
    height: 178,
    bodyType: 'atlético',
    photos: MALE_PHOTO_SETS[1],
  },
  // === TRANS ===
  {
    name: 'Valentina T.',
    email: 'valentina.trans@fake.com',
    gender: 'trans',
    age: 25,
    city: 'Madrid',
    phone: '+34 601 234 567',
    whatsapp: '+34 601 234 567',
    title: 'Valentina Trans',
    aboutMe: 'Chica trans venezolana, muy femenina y discreta. Siempre impecable y muy cariñosa. Operada, sin sorpresas.',
    lookingFor: 'Hombres abiertos de mente y respetuosos.',
    height: 173,
    bodyType: 'delgado',
    photos: [
      'https://images.unsplash.com/photo-1502323703975-b9a8f7d44bf3?w=600&q=80',
      'https://images.unsplash.com/photo-1545912452-8aea7e25a3d3?w=600&q=80',
    ],
    roaming: true,
  },
  {
    name: 'Bianca',
    email: 'bianca.trans@fake.com',
    gender: 'trans',
    age: 28,
    city: 'Barcelona',
    phone: '+34 602 345 678',
    whatsapp: '+34 602 345 678',
    title: 'Bianca Trans BCN',
    aboutMe: 'Brasileña trans de visita en Barcelona. Muy explosiva y divertida. No te arrepentirás.',
    lookingFor: 'Hombres curiosos y abiertos a explorar.',
    height: 175,
    bodyType: 'atlético',
    photos: [
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&q=80',
      'https://images.unsplash.com/photo-1479936343636-73cdc5aae0c3?w=600&q=80',
    ],
  },
  // === CASAS / PISOS ===
  {
    name: 'Club Éxtasis',
    email: 'club.extasis@fake.com',
    gender: 'casa',
    age: 0,
    city: 'Madrid',
    phone: '+34 910 123 456',
    whatsapp: '+34 910 123 456',
    title: 'Club Éxtasis',
    aboutMe: 'Lujoso club en el centro de Madrid. Ambiente exclusivo, chicas internacionales, bar privado y toda la discreción del mundo. Abierto todos los días de 14h a 6h.',
    lookingFor: 'Caballeros distinguidos que busquen el mejor servicio de la ciudad.',
    height: null,
    bodyType: null,
    photos: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80',
      'https://images.unsplash.com/photo-1560472355-536de3962603?w=600&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80',
    ],
  },
  {
    name: 'Piso Valentía',
    email: 'piso.valentina@fake.com',
    gender: 'casa',
    age: 0,
    city: 'Barcelona',
    phone: '+34 932 234 567',
    whatsapp: '+34 932 234 567',
    title: 'Piso Valentía BCN',
    aboutMe: 'Piso privado en zona Eixample. Ambiente cálido, limpio y discreto. Dos chicas disponibles para visitas sin cita previa.',
    lookingFor: 'Clientes respetuosos y puntuales.',
    height: null,
    bodyType: null,
    photos: [
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',
    ],
    roaming: true,
  },
];

async function seedFakeProfiles() {
  console.log('🌱 ========================================');
  console.log('🌱 CREANDO PERFILES FALSOS - CAPERUCITAS');
  console.log('🌱 ========================================\n');

  const passwordHash = await bcrypt.hash('FakePass123!', 10);

  let created = 0;
  let skipped = 0;

  for (const data of PROFILES_DATA) {
    try {
      // Verificar si ya existe
      const existing = await prisma.user.findUnique({ where: { email: data.email } });
      if (existing) {
        console.log(`⏭️  Saltando ${data.name} (ya existe)`);
        skipped++;
        continue;
      }

      const city = CITIES.find(c => c.name === data.city) || CITIES[0];
      
      // Añadir ligera variación en coordenadas para que no se amontonen
      const latVariation = (Math.random() - 0.5) * 0.1;
      const lngVariation = (Math.random() - 0.5) * 0.1;

      // Crear usuario sin email real (fake)
      const user = await prisma.user.create({
        data: {
          email: data.email,
          passwordHash,
          emailVerified: true,
        },
      });

      // Crear perfil
      const profile = await prisma.profile.create({
        data: {
          userId: user.id,
          orientation: 'hetero',
          gender: data.gender,
          title: data.title,
          aboutMe: data.aboutMe,
          lookingFor: data.lookingFor,
          age: data.age || 25,
          height: data.height || null,
          bodyType: data.bodyType || null,
          city: data.city,
          latitude: city.lat + latVariation,
          longitude: city.lng + lngVariation,
          phone: data.phone,
          whatsapp: data.whatsapp,
          isOnline: Math.random() > 0.4,
          lastSeenAt: new Date(),
          isFake: true,
          isVerified: Math.random() > 0.5,
          isPaused: false,
          isRoaming: data.roaming || false,
          roamingUntil: data.roaming ? new Date(Date.now() + 3 * 60 * 60 * 1000) : null,
        },
      });

      // Crear fotos
      const photos = data.photos || [];
      for (let i = 0; i < photos.length; i++) {
        await prisma.photo.create({
          data: {
            profileId: profile.id,
            url: photos[i],
            type: i === 0 ? 'cover' : 'public',
          },
        });
      }

      console.log(`✅ ${data.gender.toUpperCase()} - ${data.name} (${data.city}) - ${photos.length} fotos`);
      created++;

    } catch (error) {
      console.error(`❌ Error creando ${data.name}:`, error.message);
    }
  }

  console.log(`\n🎉 ========================================`);
  console.log(`✅ Creados: ${created} perfiles`);
  console.log(`⏭️  Saltados: ${skipped} perfiles (ya existían)`);
  console.log(`🎉 ========================================\n`);
}

seedFakeProfiles()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
