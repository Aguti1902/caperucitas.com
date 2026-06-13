import { api } from '@/services/api'

const PAGE_SIZE = 500

/** Carga todos los perfiles públicos, paginando si el backend aplica límite. */
export async function fetchAllPublicProfiles(params: Record<string, string> = {}): Promise<any[]> {
  const all: any[] = []
  let page = 1

  while (true) {
    const response = await api.get('/profile/public-search', {
      params: { ...params, page, limit: PAGE_SIZE },
    })

    const batch: any[] = response.data.profiles || []
    const total: number = response.data.total ?? batch.length

    for (const profile of batch) {
      if (!all.some((p) => p.id === profile.id)) {
        all.push(profile)
      }
    }

    if (batch.length === 0 || all.length >= total || batch.length < PAGE_SIZE) {
      break
    }
    page++
  }

  return all
}
