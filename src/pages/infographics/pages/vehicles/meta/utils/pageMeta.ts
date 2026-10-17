import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { loading } from '@/db'
import { usePageMeta } from '@/meta/pageMeta'
import { vehicleCatalog } from '@/shared/game/domain/vehicles/catalog'
import { arenaCatalog } from '@/shared/game/domain/arenas/catalog'
import { createVehiclesMetaCatalog } from './catalog'
import { readVehiclesMetaParams } from './params'
import { vehiclesCompareMetaTags, vehiclesTableMetaTags } from './tags'

export function useVehiclesPageMeta() {
  const route = useRoute()
  const catalog = computed(() => createVehiclesMetaCatalog(vehicleCatalog.value.data, arenaCatalog.value.data))

  usePageMeta(() => {
    const url = new URL(route.fullPath, location.origin)
    const params = readVehiclesMetaParams(url)
    const comparing = Boolean(url.searchParams.get('compare')?.trim())

    const sources = params.sources.filter(source => source.enabled)
    const filters = comparing ? sources.map(source => source.filters) : [params.filters]
    const needsVehicles = sources.some(source => 'tank' in source.target)
    const needsArenas = filters.some(filter => filter.arenas.length)
    if (needsVehicles && vehicleCatalog.value.status === loading) return null
    if (needsArenas && arenaCatalog.value.status === loading) return null

    if (comparing) return vehiclesCompareMetaTags(url, catalog.value)
    return vehiclesTableMetaTags(url, catalog.value)
  })
}
