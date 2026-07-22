import { api } from '@/services/api'

const PAGE_SIZE = 500

export interface PublicSearchResult {
  profiles: any[]
  total: number
}

/** Carga perfiles públicos paginando. Devuelve también el total del backend. */
export async function fetchPublicProfiles(
  params: Record<string, string> = {}
): Promise<PublicSearchResult> {
  const all: any[] = []
  let page = 1
  let total = 0

  while (true) {
    const response = await api.get('/profile/public-search', {
      params: { ...params, page, limit: PAGE_SIZE },
    })

    const batch: any[] = response.data.profiles || []
    total = response.data.total ?? batch.length

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

  return { profiles: all, total: Math.max(total, all.length) }
}

/** @deprecated usar fetchPublicProfiles */
export async function fetchAllPublicProfiles(params: Record<string, string> = {}): Promise<any[]> {
  const { profiles } = await fetchPublicProfiles(params)
  return profiles
}
