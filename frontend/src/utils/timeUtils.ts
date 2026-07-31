// Formatear tiempo relativo para última conexión / actividad
export const formatLastSeen = (lastSeenAt: string | Date | null | undefined): string => {
  if (!lastSeenAt) return 'Hace tiempo'

  const now = new Date()
  const lastSeen = new Date(lastSeenAt)
  const diffMs = now.getTime() - lastSeen.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) {
    return 'Ahora mismo'
  } else if (diffMinutes < 60) {
    return `Hace ${diffMinutes} ${diffMinutes === 1 ? 'minuto' : 'minutos'}`
  } else if (diffHours < 24) {
    return 'Activo hoy'
  } else if (diffDays === 1) {
    return 'Activo ayer'
  } else if (diffDays < 7) {
    return `hace ${diffDays} días`
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `Hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`
  } else {
    return 'Hace más de un año'
  }
}

