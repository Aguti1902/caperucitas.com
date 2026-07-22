import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getCityPath, SITE_URL } from '@/utils/citySeo'
import SeoHead from '@/components/common/SeoHead'
import BackNavBar from '@/components/common/BackNavBar'
import LoadingSpinner from '@/components/common/LoadingSpinner'

type MunEntry = { slug: string; name: string; provinciaId: string }

export default function CitiesDirectoryPage() {
  const [search, setSearch] = useState('')
  const [municipalities, setMunicipalities] = useState<MunEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    import('@/data/spanishMunicipalitiesIndex')
      .then((mod) => {
        if (!cancelled) {
          setMunicipalities(mod.SPANISH_MUNICIPALITIES)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return municipalities.slice(0, 80)
    return municipalities
      .filter((m) => m.name.toLowerCase().includes(q) || m.slug.includes(q.replace(/\s+/g, '-')))
      .slice(0, 100)
  }, [search, municipalities])

  return (
    <div className="min-h-screen bg-gray-950">
      <SeoHead
        title="Putas y escorts por ciudad en España | Caperucitas.com"
        description="Directorio de putas, escorts y sexo gratis por ciudad en España. Encuentra perfiles cerca de ti en Madrid, Barcelona, Valencia y más de 8.000 municipios."
        canonical={`${SITE_URL}/ciudades`}
        keywords="putas españa, escorts por ciudad, putas madrid, putas barcelona"
      />
      <BackNavBar title="Ciudades" backTo="/perfiles" />

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-black text-white">
            Putas, escorts y sexo gratis por ciudad
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Más de 8.100 municipios de España. Busca tu ciudad para ver perfiles cerca de ti.
          </p>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar municipio... (ej. Cornellà, Vilafant, Lucena)"
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500"
          />
          <p className="text-gray-600 text-xs">
            {loading
              ? 'Cargando municipios…'
              : search
                ? `${filtered.length} resultados`
                : `Mostrando 80 de ${municipalities.length} municipios — escribe para buscar`}
          </p>
        </header>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filtered.map((city) => (
              <div
                key={city.slug}
                className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-center justify-between gap-2"
              >
                <span className="text-white font-semibold text-sm">{city.name}</span>
                <div className="flex gap-2 flex-shrink-0">
                  <Link
                    to={getCityPath('escort', city)}
                    className="text-xs font-bold text-red-400 hover:text-red-300 px-2 py-1 rounded-lg bg-red-900/30"
                  >
                    Putas
                  </Link>
                  <Link
                    to={getCityPath('sexo_gratis', city)}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded-lg bg-emerald-900/30"
                  >
                    Gratis
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
