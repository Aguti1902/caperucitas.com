// Utilidades para formatear información de perfiles

/** Foto de portada para miniaturas: cover → primera pública → primera visible */
export function getProfileCoverPhoto(profile: any): { url: string; type?: string } | null {
  if (!profile) return null

  if (profile.coverPhoto) {
    return { url: profile.coverPhoto, type: 'cover' }
  }

  const photos: any[] = profile.photos || []
  const cover = photos.find((p) => p.type === 'cover')
  if (cover?.url) return cover

  const firstPublic = photos.find((p) => p.type === 'public')
  if (firstPublic?.url) return firstPublic

  const firstVisible = photos.find((p) => p.type !== 'private')
  return firstVisible?.url ? firstVisible : null
}

export const formatProfileType = (type: string | null | undefined): string => {
  if (type === 'sexo_gratis') return '💚 Sexo gratis';
  return '💼 Escort';
};

export const formatRelationshipGoal = (goal: string | null | undefined): string => {
  if (!goal) return '';
  
  const goals: Record<string, string> = {
    'amistad': '👥 Amistad',
    'relacion_seria': '❤️ Relación seria',
    'encuentros_casuales': '🔥 Encuentros casuales',
  };
  
  return goals[goal] || '';
};

export const formatGender = (gender: string | null | undefined): string => {
  if (!gender) return '';
  
  const genders: Record<string, string> = {
    'hombre': '👨 Hombre',
    'mujer': '👩 Mujer',
    'gay': '🏳️‍🌈 Gay',
    'trans': '🏳️‍⚧️ Trans',
  };
  
  return genders[gender] || '';
};

export const formatRole = (role: string | null | undefined): string => {
  if (!role) return '';
  
  const roles: Record<string, string> = {
    'activo': '🔵 Activo',
    'pasivo': '🔴 Pasivo',
    'versatil': '⚪ Versátil',
  };
  
  return roles[role] || '';
};

