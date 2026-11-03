import { computed } from 'vue'
import { defineParams, useQueryStorage, type QueryParam } from '@/shared/uiKit/queryStorage/useQueryStorage'
import { arrayParam, setParam } from '@/shared/uiKit/queryStorage/params'
import { firstQueryRegion, regionQueryParam, useSingleRegion } from '@/shared/game/domain/region/regionQueryParam'
import { queryRegions } from '@/shared/game/domain/region/regions'
import type { VehicleFilters, VehicleRegion } from '../../vehicles/filters/types'
import { createLocalVehicleFilters, type LocalVehicleFilters } from '../../vehicles/vehicleListTable/filters/localFilters'
import { vehicleListFilterParams } from '../../vehicles/vehicleListTable/query/filters'
import { sortOrderSerializer } from '../../vehicles/vehicleListTable/utils/sortOrderSerializer'
import type { SortOrder } from '../../vehicles/vehicleListTable/utils/useVehicleSorting'
import { slotSerializer } from '../../vehicles/vehicleMetricSelector/utils/slotSerializer'
import type { Slot } from '../../vehicles/vehicleMetricSelector/vehicleMetrics/vehicleMetrics'
import { useComparisonSources } from '../../vehicles/timeSeriesCompare/utils/useComparisonSources'
import { unrestrictedComparisonFilters, type SavedComparisonSource } from '../../vehicles/timeSeriesCompare/query/state'
import { serializeComparison } from '../../vehicles/timeSeriesCompare/query/codec/serialize'
import { deserializeComparison } from '../../vehicles/timeSeriesCompare/query/codec/codec'
import { comparisonSettingsParams } from '../../vehicles/timeSeriesCompare/query/settings'
import { comparisonAnnotationsParam, comparisonAnnotationKeys, comparisonAnnotationState } from '../../vehicles/timeSeriesCompare/query/annotations'
import { achievements, type AchievementKind } from '../utils/achievements'

const defaults = createLocalVehicleFilters()

function achievementFilters(region: VehicleRegion = 'RU'): VehicleFilters {
  return { ...unrestrictedComparisonFilters(), regions: [region] }
}

const achievementCompareParam = {
  label: 'compare', key: 'achievements.compare', priority: -10,
  default: [] as SavedComparisonSource[],
  serialize: (sources: SavedComparisonSource[], context?: { regions: Set<VehicleRegion> }) =>
    serializeComparison(sources, achievementFilters(firstQueryRegion(context?.regions))),
  deserialize: (raw: string, context?: { regions: Set<VehicleRegion> }) => {
    const sources = deserializeComparison(raw, achievementFilters(firstQueryRegion(context?.regions)))
    const seen = new Set<string>()
    return sources.flatMap(source => {
      const region = source.filters.regions[0]
      if (!('tank' in source.target) || source.filters.regions.length !== 1 || !queryRegions.includes(region)) return []

      const identity = JSON.stringify([region, source.target.tank])
      if (seen.has(identity)) return []
      seen.add(identity)
      return [{ ...source, filters: achievementFilters(region) }]
    })
  }
} satisfies QueryParam<SavedComparisonSource[], { regions: Set<VehicleRegion> }>
const hasComparison = ({ compare }: { compare: SavedComparisonSource[] }) => compare.length > 0

function createAchievementQueryParams(kind: AchievementKind) {
  const key = `achievements.${kind}`
  const slots = achievements[kind].slots
  const compareParam = { ...achievementCompareParam, context: { regions: regionQueryParam } }
  const comparisonContext = { compare: compareParam }

  return defineParams({
    regions: regionQueryParam,
    search: vehicleListFilterParams.search,
    types: vehicleListFilterParams.types,
    nations: vehicleListFilterParams.nations,
    levels: vehicleListFilterParams.levels,
    onlyActual: vehicleListFilterParams.onlyActual,
    sort: arrayParam(sortOrderSerializer, [{ key: slots[0], ascending: false }] as SortOrder[], {
      key: `${key}.sort`, priority: 10,
      validate: ({ key }) => key === 'name' || key === 'tankLevel' || key === 'tankType' || slots.includes(key),
    }),
    metrics: setParam(slotSerializer, slots, {
      label: 'metric', key: `${key}.metrics`, priority: -1, validate: slot => slots.includes(slot),
      context: comparisonContext, enabled: hasComparison,
    }),
    step: {
      ...comparisonSettingsParams.step,
      key: `${key}.step`, context: comparisonContext, enabled: hasComparison,
    },
    averageWindow: {
      ...comparisonSettingsParams.averageWindow,
      key: `${key}.averageWindow`, context: comparisonContext, enabled: hasComparison,
    },
    annotations: {
      ...comparisonAnnotationsParam,
      key: `${key}.annotations`, context: comparisonContext, enabled: hasComparison,
    },
    compare: compareParam,
  })
}

const achievementQueryParams = {
  marks: createAchievementQueryParams('marks'),
  mastery: createAchievementQueryParams('mastery'),
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

  return {
    region, search: p.search, sort: p.sort, localFilters, filters, comparison,
    metrics, step: p.step, averageWindow: p.averageWindow, annotations,
  }
}
