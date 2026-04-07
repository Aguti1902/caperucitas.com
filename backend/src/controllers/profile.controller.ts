import { Response, Request } from 'express';
import prisma from '../lib/prisma';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth.middleware';
import { calculateDistance } from '../utils/distance.utils';
import { normalizeProfilesPhotos, normalizeProfilePhotos } from '../utils/photo.utils';


// Crear perfil
export const createProfile = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, aboutMe, lookingFor, age, orientation, gender, role, city, latitude, longitude, 
          height, bodyType, relationshipStatus, relationshipGoal, occupation, education, smoking, drinking,
          children, pets, zodiacSign, hobbies, languages, showExactLocation, phone, whatsapp } = req.body;

    // Verificar que no tenga ya un perfil
    const existingProfile = await prisma.profile.findUnique({
      where: { userId: req.userId },
    });

    if (existingProfile) {
      return res.status(400).json({ error: 'Ya tienes un perfil creado' });
    }

    // gender viene del campo orientation (chica/chico/trans/casa)
    const profileGender = gender || orientation || 'chica';

    // Crear perfil
    const profile = await prisma.profile.create({
      data: {
        userId: req.userId,
        title,
        aboutMe,
        lookingFor,
        age,
        orientation,
        gender: profileGender,
        role: role || null,
        city,
        latitude: latitude || null,
        longitude: longitude || null,
        showExactLocation: showExactLocation !== undefined ? showExactLocation : true,
        height: height || null,
        bodyType: bodyType || null,
        relationshipStatus: relationshipStatus || null,
        relationshipGoal: relationshipGoal || null,
        occupation: occupation || null,
        education: education || null,
        smoking: smoking || null,
        drinking: drinking || null,
        children: children || null,
        pets: pets || null,
        zodiacSign: zodiacSign || null,
        hobbies: hobbies || [],
        languages: languages || ['Español'],
        phone: phone || null,
        whatsapp: whatsapp || null,
        isOnline: true,
      },
    });

    res.status(201).json({
      message: 'Perfil creado exitosamente',
      profile,
    });
  } catch (error) {
    console.error('Error al crear perfil:', error);
    res.status(500).json({ error: 'Error al crear perfil' });
  }
};

// Obtener perfil propio
export const getMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.userId },
      include: {
        photos: true,
        user: {
          select: {
            email: true,
            subscription: true,
          },
        },
      },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};

// Actualizar perfil
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, aboutMe, lookingFor, age, orientation, gender, role, city, latitude, longitude,
          height, bodyType, relationshipStatus, relationshipGoal, occupation, education, smoking, drinking,
          children, pets, zodiacSign, hobbies, languages, showExactLocation } = req.body;

    const updatedProfile = await prisma.profile.update({
      where: { userId: req.userId },
      data: {
        title,
        aboutMe,
        lookingFor,
        age,
        orientation,
        gender, // Permitir cambiar género
        role: role !== undefined ? role : undefined, // Actualizar ROL si se proporciona
        city,
        latitude: latitude || null,
        longitude: longitude || null,
        showExactLocation: showExactLocation !== undefined ? showExactLocation : undefined, // Actualizar si se proporciona
        height: height || null,
        bodyType: bodyType || null,
        relationshipStatus: relationshipStatus || null,
        relationshipGoal: relationshipGoal || null, // Nuevo campo
        occupation: occupation || null,
        education: education || null,
        smoking: smoking || null,
        drinking: drinking || null,
        children: children || null,
        pets: pets || null,
        zodiacSign: zodiacSign || null,
        hobbies: hobbies || [],
        languages: languages || [],
        lastSeenAt: new Date(),
      },
    });

    res.json({
      message: 'Perfil actualizado exitosamente',
      profile: updatedProfile,
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
};

// Buscar perfiles (navegar) - SIMPLIFICADO AL MÁXIMO
export const searchProfiles = async (req: AuthRequest, res: Response) => {
  try {
    const { filter, city, ageMin, ageMax, distanceMin, distanceMax, page = 1, limit = 20, gender, relationshipGoal, role } = req.query;

    // Obtener perfil actual
    const myProfile = await prisma.profile.findUnique({
      where: { id: req.profileId },
      include: {
        user: {
          include: {
            subscription: true,
          },
        },
      },
    });

    if (!myProfile) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    const isPlus = myProfile.user?.subscription?.isActive || false;

    // Verificar género y orientación
    if (!myProfile.gender || !myProfile.orientation) {
      return res.status(400).json({ 
        error: 'Tu perfil no tiene género u orientación definidos. Por favor, actualiza tu perfil.',
      });
    }

    // NUEVA LÓGICA: Determinar qué género buscar
    let targetGender: string | null = null;
    
    if (myProfile.orientation === 'hetero') {
      // USUARIOS HETERO:
      if (isPlus && gender) {
        // 9PLUS: Puede filtrar por género específico
        targetGender = gender as string;
      } else if (isPlus && !gender) {
        // 9PLUS sin filtro: Ver TODOS los géneros (hombres + mujeres)
        targetGender = null;
      } else {
        // FREE: Ver TODOS los géneros (hombres + mujeres) - NO PUEDEN FILTRAR
        targetGender = null;
      }
    } else if (myProfile.orientation === 'gay') {
      // GAY: Ver TODOS los usuarios gay (gay y trans) - NO filtrar por género específico
      // Los usuarios gay pueden ver a otros usuarios gay independientemente de si son "gay" o "trans"
      if (isPlus && gender) {
        // 9PLUS: Puede filtrar por género específico (gay o trans)
        targetGender = gender as string;
      } else {
        // FREE o 9PLUS sin filtro: Ver TODOS los géneros dentro de orientación gay (gay + trans)
        targetGender = null;
      }
    } else {
      return res.status(400).json({ error: 'Orientación no válida' });
    }

    // Obtener IDs bloqueados y likes
    const blocks = await prisma.block.findMany({
      where: {
        OR: [
          { blockerProfileId: req.profileId! },
          { blockedProfileId: req.profileId! },
        ],
      },
    });
    const blockedIds = blocks.map(b =>
      b.blockerProfileId === req.profileId ? b.blockedProfileId : b.blockerProfileId
    );

    // IMPORTANTE: NO excluir perfiles con like para que se repitan
    // Los usuarios gratuitos solo ven 50 perfiles, necesitan que se repitan
    const excludedIds = [req.profileId!, ...blockedIds];

    console.log(`\n🔍 BÚSQUEDA: ${myProfile.title} (${myProfile.gender} ${myProfile.orientation})`);
    console.log(`   Buscando: ${targetGender || 'TODOS LOS GÉNEROS'} ${myProfile.orientation}`);
    console.log(`   Excluir: ${excludedIds.length} perfiles (propio + bloqueados)`);
    console.log(`   Plan: ${isPlus ? '9PLUS' : 'FREE'}`);

    // Construir where SIMPLE
    const where: any = {
      id: { notIn: excludedIds },
      orientation: myProfile.orientation,
      isFake: false, // Solo perfiles reales
      photos: {
        some: {
          type: 'cover',
        },
      },
    };

    // Agregar filtro de género SOLO si targetGender está definido
    if (targetGender) {
      where.gender = targetGender;
    }

    // Filtros solo para 9Plus
    if (isPlus) {
      if (city) where.city = city;
      if (ageMin || ageMax) {
        where.age = {};
        if (ageMin) where.age.gte = parseInt(ageMin as string);
        if (ageMax) where.age.lte = parseInt(ageMax as string);
      }
      if (filter === 'online') {
        // ONLINE: Solo usuarios conectados AHORA (isOnline = true)
        where.isOnline = true;
      }
      // NUEVO: Filtro de relationshipGoal (solo 9Plus)
      if (relationshipGoal) {
        where.relationshipGoal = relationshipGoal;
      }
      // NUEVO: Filtro de role (solo 9Plus, solo para usuarios gay)
      if (role && myProfile.orientation === 'gay') {
        where.role = role;
      }
    }
    
    // RECIENTES: Solo perfiles conectados hace 2 horas o menos
    if (filter === 'recent') {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 horas atrás
      where.lastSeenAt = {
        gte: twoHoursAgo, // Solo conectados en las últimas 2 horas
      };
    }

    // Buscar perfiles
    let profiles = await prisma.profile.findMany({
      where,
      include: {
        photos: {
          where: { 
            type: { not: 'private' } // Incluir cover y public, NO private
          },
        },
        receivedLikes: {
          where: { fromProfileId: req.profileId! },
        },
      },
      orderBy: {
        lastSeenAt: 'desc',
      },
      skip: (Number(page) - 1) * Number(limit),
      take: isPlus ? Number(limit) * 3 : Math.min(Number(limit) * 3, 150),
    });

    // Filtrar perfiles sin foto de portada
    profiles = profiles.filter(profile => profile.photos && profile.photos.length > 0);

    console.log(`   ✅ Encontrados: ${profiles.length} perfiles`);

    // Calcular distancia (solo si hay coordenadas)
    const profilesWithDistance = profiles.map(profile => {
      const distance =
        myProfile.latitude &&
        myProfile.longitude &&
        profile.latitude &&
        profile.longitude
          ? calculateDistance(
              myProfile.latitude,
              myProfile.longitude,
              profile.latitude,
              profile.longitude
            )
          : null;

      // Verificar si el perfil tiene RoAM activo
      const isRoaming = profile.isRoaming && profile.roamingUntil && new Date(profile.roamingUntil) > new Date();

      return {
        ...profile,
        distance,
        isLiked: profile.receivedLikes.length > 0,
        receivedLikes: undefined,
        isRoaming, // Añadir estado de RoAM
        roamingUntil: profile.roamingUntil, // Añadir fecha de expiración
      };
    });

    // Filtrar por distancia (solo 9Plus)
    let filteredProfiles = profilesWithDistance;
    if (isPlus && (distanceMin !== undefined || distanceMax !== undefined)) {
      const min = distanceMin !== undefined ? parseInt(distanceMin as string) : 0;
      const max = distanceMax !== undefined ? parseInt(distanceMax as string) : 500;
      filteredProfiles = profilesWithDistance.filter(profile => {
        if (profile.distance === null) return false;
        return profile.distance >= min && profile.distance <= max;
      });
    }

    // IMPORTANTE: Filtrar perfiles con RoAM activo - solo aparecen dentro de 20 km
    const ROAM_MAX_DISTANCE = 20; // km
    filteredProfiles = filteredProfiles.filter(profile => {
      // Si el perfil tiene RoAM activo
      if (profile.isRoaming && profile.roamingUntil && new Date(profile.roamingUntil) > new Date()) {
        // Solo mostrar si está dentro de 20 km
        if (profile.distance === null || profile.distance > ROAM_MAX_DISTANCE) {
          return false; // Ocultar perfiles con RoAM fuera del radio
        }
      }
      return true; // Mostrar todos los demás perfiles normalmente
    });

    // Eliminar duplicados
    const uniqueProfiles = filteredProfiles.filter((profile, index, self) =>
      index === self.findIndex(p => p.id === profile.id)
    );

    // Ordenar: PRIMERO perfiles con RoAM activo, luego el resto
    uniqueProfiles.sort((a, b) => {
      // Verificar si tienen RoAM activo
      const aHasRoam = a.isRoaming && a.roamingUntil && new Date(a.roamingUntil) > new Date()
      const bHasRoam = b.isRoaming && b.roamingUntil && new Date(b.roamingUntil) > new Date()

      // PRIORIDAD 1: Perfiles con RoAM activo van PRIMERO
      if (aHasRoam && !bHasRoam) return -1 // a va primero
      if (!aHasRoam && bHasRoam) return 1  // b va primero

      // Si ambos tienen RoAM o ambos no tienen, ordenar por distancia
      // PRIORIDAD 2: Perfiles con distancia van primero
      if (a.distance === null && b.distance === null) return 0
      if (a.distance === null) return 1 // Sin distancia al final
      if (b.distance === null) return -1 // Con distancia primero
      
      // PRIORIDAD 3: Ordenar por distancia (más cercano primero)
      return a.distance - b.distance
    })

    // Limitar resultados (50 para gratuitos)
    const maxProfilesForFree = 50;
    const finalProfiles = uniqueProfiles.slice(0, isPlus ? Number(limit) : Math.min(Number(limit), maxProfilesForFree));

    // Normalizar URLs de fotos
    const normalizedProfiles = normalizeProfilesPhotos(finalProfiles);

    console.log(`   📊 Resultado final: ${finalProfiles.length} perfiles`);
    console.log(`   📸 Fotos por perfil:`, normalizedProfiles.slice(0, 3).map((p: any) => ({
      id: p.id,
      title: p.title,
      photosCount: p.photos?.length || 0,
      photoTypes: p.photos?.map((ph: any) => ph.type)
    })));

    res.json({
      profiles: normalizedProfiles,
      hasMore: uniqueProfiles.length > finalProfiles.length,
      isPlus,
    });
  } catch (error: any) {
    console.error('❌ ERROR al buscar perfiles:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Error al buscar perfiles',
      message: error.message || 'Error desconocido',
    });
  }
};

// Obtener perfil por ID
export const getProfileById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar que no esté bloqueado
    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerProfileId: req.profileId!, blockedProfileId: id },
          { blockerProfileId: id, blockedProfileId: req.profileId! },
        ],
      },
    });

    if (block) {
      return res.status(403).json({ error: 'No puedes ver este perfil' });
    }

    // Obtener perfil
    const profile = await prisma.profile.findUnique({
      where: { id },
      include: {
        photos: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    // Verificar que no sea fake (a menos que sea el propio perfil)
    if (profile.isFake && profile.userId !== req.userId) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    // Incrementar contador de vistas si el perfil tiene Roam activo
    // Solo si no es el propio perfil
    if (req.profileId && req.profileId !== id) {
      const { incrementProfileView } = await import('../controllers/roam.controller')
      await incrementProfileView(id)
    }

    // Verificar acceso a fotos privadas
    const privatePhotoAccess = await prisma.privatePhotoAccess.findUnique({
      where: {
        ownerProfileId_viewerProfileId: {
          ownerProfileId: id,
          viewerProfileId: req.profileId!,
        },
      },
    });

    const hasPrivateAccess = privatePhotoAccess?.status === 'granted';

    // Verificar si hay match
    const match = await prisma.like.findFirst({
      where: {
        OR: [
          { fromProfileId: req.profileId!, toProfileId: id },
          { fromProfileId: id, toProfileId: req.profileId! },
        ],
      },
    });

    const isLiked = await prisma.like.findFirst({
      where: {
        fromProfileId: req.profileId!,
        toProfileId: id,
      },
    });

    // Normalizar fotos
    const normalizedProfile = normalizeProfilePhotos(profile);

    res.json({
      ...normalizedProfile,
      isLiked: !!isLiked,
      hasMatch: !!match,
      privatePhotoAccess: {
        hasAccess: hasPrivateAccess,
        status: privatePhotoAccess?.status || null,
      },
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};

// Actualizar ubicación
export const updateLocation = async (req: AuthRequest, res: Response) => {
  try {
    const { city, latitude, longitude } = req.body;

    await prisma.profile.update({
      where: { userId: req.userId },
      data: {
        city,
        latitude: latitude || null,
        longitude: longitude || null,
        lastSeenAt: new Date(),
      },
    });

    res.json({ message: 'Ubicación actualizada' });
  } catch (error) {
    console.error('Error al actualizar ubicación:', error);
    res.status(500).json({ error: 'Error al actualizar ubicación' });
  }
};

// ============================================================
// RUTAS PÚBLICAS (sin autenticación)
// ============================================================

const PUBLIC_PROFILE_INCLUDE = {
  photos: {
    where: { type: { in: ['cover', 'public'] } },
    orderBy: [{ type: 'asc' as const }, { createdAt: 'asc' as const }],
  },
};

// Búsqueda pública de perfiles (para visitantes sin cuenta)
export const publicSearchProfiles = async (req: Request, res: Response) => {
  try {
    const { gender, city, page = 1, limit = 40, q } = req.query;

    const where: any = {};

    if (gender && gender !== 'all') {
      where.gender = gender as string;
    }

    if (city && city !== 'Todas las ciudades') {
      where.city = { contains: city as string, mode: 'insensitive' };
    }

    if (q) {
      where.OR = [
        { title: { contains: q as string, mode: 'insensitive' } },
        { aboutMe: { contains: q as string, mode: 'insensitive' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const profiles = await prisma.profile.findMany({
      where,
      include: PUBLIC_PROFILE_INCLUDE,
      orderBy: [
        { isRoaming: 'desc' },
        { isOnline: 'desc' },
        { lastSeenAt: 'desc' },
      ],
      skip,
      take: Number(limit),
    });

    const normalized = profiles.map(p => ({
      ...p,
      coverPhoto: p.photos.find(ph => ph.type === 'cover')?.url || p.photos[0]?.url || null,
      publicPhotos: p.photos.filter(ph => ph.type === 'public').map(ph => ph.url),
    }));

    res.json({ profiles: normalized, total: normalized.length });
  } catch (error) {
    console.error('Error en búsqueda pública:', error);
    res.status(500).json({ error: 'Error al buscar perfiles' });
  }
};

// Obtener perfil público por ID
export const getPublicProfileById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const profile = await prisma.profile.findUnique({
      where: { id },
      include: PUBLIC_PROFILE_INCLUDE,
    });

    if (!profile) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    const normalized = {
      ...profile,
      coverPhoto: profile.photos.find(ph => ph.type === 'cover')?.url || profile.photos[0]?.url || null,
      publicPhotos: profile.photos.filter(ph => ph.type === 'public').map(ph => ph.url),
    };

    res.json(normalized);
  } catch (error) {
    console.error('Error al obtener perfil público:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};
