import { computed, watch } from 'vue'
import { useQueryStorage } from '@/shared/uiKit/queryStorage/useQueryStorage'
import { firstQueryRegion, useSingleRegion } from '@/shared/game/domain/region/regionQueryParam'
import { createLocalVehicleFilters, type LocalVehicleFilters } from '../../vehicles/table/filters/localFilters'
import type { Slot } from '../../vehicles/metrics/catalog/vehicleMetrics'
import type { VehicleRegion } from '../../vehicles/filters/types'
import type { SavedComparisonSource } from '../../vehicles/comparison/query/state'
import { serializeComparison } from '../../vehicles/comparison/query/codec/serialize'
import { useComparisonSources } from '../../vehicles/comparison/utils/useComparisonSources'
import { comparisonAnnotationKeys, comparisonAnnotationState } from '../../vehicles/comparison/query/annotations'
import { achievements, type AchievementKind } from '../utils/achievements'
import { achievementFilters, createAchievementQueryParams } from '../utils/achievementQueryParams'

const defaults = createLocalVehicleFilters()

// Упаковка ID использует браузерный каталог техники; для чтения URL он не нужен.
const serializeCompare = (sources: SavedComparisonSource[], context?: { regions: Set<VehicleRegion> }) =>
  serializeComparison(sources, achievementFilters(firstQueryRegion(context?.regions)))

const achievementQueryParams = {
  marks: createAchievementQueryParams('marks', serializeCompare),
  mastery: createAchievementQueryParams('mastery', serializeCompare),
}

export function useAchievementQueryStorage(kind: AchievementKind) {
  const slots = achievements[kind].slots
  const storage = useQueryStorage(achievementQueryParams[kind], { history: 'replace', debounce: 150 })
  const p = storage.params
  const region = useSingleRegion(p.regions)
  const filters = computed(() => achievementFilters(region.value))
  const comparison = useComparisonSources(filters, p.compare)

  const annotations = computed({
    get: () => comparisonAnnotationState(p.annotations.value),
    set: value => { p.annotations.value = comparisonAnnotationKeys(value) },
  })

  const metrics = computed<Slot[]>({
    get: () => slots.filter(slot => p.metrics.value.has(slot)),
    set: value => { p.metrics.value = new Set(slots.filter(slot => value.includes(slot))) },
  })

  const localFilters = computed<LocalVehicleFilters>({
    get: () => ({
      ...defaults,
      levels: [...p.levels.value],
      types: [...p.types.value],
      nations: [...p.nations.value],
      onlyActual: p.onlyActual.value,
    }),
    set: value => storage.patch({
      levels: new Set(value.levels), types: new Set(value.types), nations: new Set(value.nations), onlyActual: value.onlyActual,
    }),
  })

  watch(p.deltaPeriod, period => {
    if (period === 'none') p.sortByDelta.value = false
  }, { immediate: true })

  return {
    region,
    search: p.search,
    sort: p.sort,
    localFilters,
    filters,
    comparison,
    deltaPeriod: p.deltaPeriod,
    sortByDelta: p.sortByDelta,
    metrics,
    step: p.step,
    averageWindow: p.averageWindow,
    annotations,
  }
}
