import { defineParams, type QueryParam } from '@/shared/uiKit/queryStorage/queryStorageTypes'
import { arrayParam, booleanParam, oneOfParam, setParam } from '@/shared/uiKit/queryStorage/params'
import { firstQueryRegion, regionQueryParam } from '@/shared/game/domain/region/regionQueryParam'
import { queryRegions } from '@/shared/game/domain/region/regions'
import type { VehicleFilters, VehicleRegion } from '../../vehicles/filters/types'
import { vehicleListFilterParams } from '../../vehicles/table/query/filters'
import { sortOrderSerializer } from '../../vehicles/table/utils/sortOrderSerializer'
import { slotSerializer } from '../../vehicles/metrics/utils/slotSerializer'
import { unrestrictedComparisonFilters, type SavedComparisonSource } from '../../vehicles/comparison/query/state'
import { deserializeComparison } from '../../vehicles/comparison/query/codec/codec'
import { comparisonSettingsParams } from '../../vehicles/comparison/query/settings'
import { comparisonAnnotationsParam } from '../../vehicles/comparison/query/annotations'
import { achievementDeltaPeriods, achievements, type AchievementKind } from './achievements'

const deltaPeriodParam = oneOfParam(['none', ...achievementDeltaPeriods], 'none', { label: 'delta', key: 'achievements.delta' })
const sortByDeltaParam = booleanParam(false, { label: 'delta-sort', key: 'achievements.delta-sort' })

export function achievementFilters(region: VehicleRegion = 'RU'): VehicleFilters {
  return { ...unrestrictedComparisonFilters(), regions: [region] }
}

const achievementCompareParam = {
  label: 'compare',
  key: 'achievements.compare',
  priority: -10,
  default: [] as SavedComparisonSource[],
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

type SerializeCompare = QueryParam<SavedComparisonSource[], { regions: Set<VehicleRegion> }>['serialize']

export function createAchievementQueryParams(kind: AchievementKind, serialize?: SerializeCompare) {
  const key = `achievements.${kind}`
  const slots = achievements[kind].slots
  const achievementSort = sortOrderSerializer({
    serialize: slot => slotSerializer.serialize(slot).slice(kind.length + 1),
    deserialize: raw => slotSerializer.deserialize(`${kind}-${raw}`),
  })

  const compareParam = { ...achievementCompareParam, serialize, context: { regions: regionQueryParam } }
  const comparisonContext = { compare: compareParam }

  return defineParams({
    regions: regionQueryParam,
    search: vehicleListFilterParams.search,
    types: vehicleListFilterParams.types,
    nations: vehicleListFilterParams.nations,
    levels: vehicleListFilterParams.levels,
    onlyActual: vehicleListFilterParams.onlyActual,
    deltaPeriod: deltaPeriodParam,
    sortByDelta: sortByDeltaParam,
    sort: arrayParam(achievementSort, [{ key: achievements[kind].defaultSortSlot, ascending: false }], {
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
