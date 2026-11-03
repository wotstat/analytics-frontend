import { computed } from 'vue'
import { defineParams, useQueryStorage, type QueryParam } from '@/shared/uiKit/queryStorage/useQueryStorage'
import { arrayParam, booleanParam, oneOfParam, setOfParam, setParam, stringParam } from '@/shared/uiKit/queryStorage/params'
import { nations } from '@/shared/game/domain/vehicles/nations'
import { vehicleTypes } from '@/shared/game/domain/vehicles/types'
import { vehicleRegions, type VehicleFilters, type VehicleRegion } from '../../vehicles/filters/types'
import { createLocalVehicleFilters, vehicleLevels, type LocalVehicleFilters } from '../../vehicles/vehicleListTable/filters/localFilters'
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
const levelOptions: readonly number[] = vehicleLevels

function achievementFilters(region: VehicleRegion = 'RU'): VehicleFilters {
  return { ...unrestrictedComparisonFilters(), regions: [region] }
}

function createAchievementQueryParams(kind: AchievementKind) {
  const key = `achievements.${kind}`
  const slots = achievements[kind].slots

  const regionParam = oneOfParam(vehicleRegions, 'RU', { label: 'region', key: `${key}.region`, priority: 100 })
  const compareParam = {
    label: 'compare', key: `${key}.compare`, priority: -10,
    default: [] as SavedComparisonSource[],
    context: { region: regionParam },
    serialize: (sources: SavedComparisonSource[], context?: { region: VehicleRegion }) =>
      serializeComparison(sources, achievementFilters(context?.region)),
    deserialize: (raw: string, context?: { region: VehicleRegion }) => {
      const sources = deserializeComparison(raw, achievementFilters(context?.region))
      const seen = new Set<string>()
      return sources.flatMap(source => {
        const region = source.filters.regions[0]
        if (!('tank' in source.target) || source.filters.regions.length !== 1 || !vehicleRegions.includes(region)) return []

        const identity = JSON.stringify([region, source.target.tank])
        if (seen.has(identity)) return []
        seen.add(identity)
        return [{ ...source, filters: achievementFilters(region) }]
      })
    },
  } satisfies QueryParam<SavedComparisonSource[], { region: VehicleRegion }>
  const comparisonAvailability = {
    context: { compare: compareParam },
    enabled: ({ compare }: { compare: SavedComparisonSource[] }) => compare.length > 0,
  }

  return defineParams({
    region: regionParam,
    search: stringParam('', { key: `${key}.search`, history: 'replace', debounce: 300, priority: 90 }),
    types: setOfParam(vehicleTypes, [], { label: 'type', key: `${key}.types`, priority: 80 }),
    nations: setOfParam(nations, [], { label: 'nation', key: `${key}.nations`, priority: 70 }),
    levels: setOfParam(levelOptions, [], { label: 'level', key: `${key}.levels`, priority: 60 }),
    onlyActual: booleanParam(defaults.onlyActual, { label: 'only-actual', key: `${key}.onlyActual`, priority: 50 }),
    sort: arrayParam(sortOrderSerializer, [{ key: slots[0], ascending: false }] as SortOrder[], {
      key: `${key}.sort`, priority: 10,
      validate: ({ key }) => key === 'name' || key === 'tankLevel' || key === 'tankType' || slots.includes(key),
    }),
    metrics: setParam(slotSerializer, slots, {
      label: 'metric', key: `${key}.metrics`, priority: -1, validate: slot => slots.includes(slot),
      ...comparisonAvailability,
    }),
    step: { ...comparisonSettingsParams.step, key: `${key}.step`, ...comparisonAvailability },
    averageWindow: { ...comparisonSettingsParams.averageWindow, key: `${key}.averageWindow`, ...comparisonAvailability },
    annotations: { ...comparisonAnnotationsParam, key: `${key}.annotations`, ...comparisonAvailability },
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
  const filters = computed(() => achievementFilters(p.region.value))
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
    region: p.region, search: p.search, sort: p.sort, localFilters, filters, comparison,
    metrics, step: p.step, averageWindow: p.averageWindow, annotations,
  }
}
