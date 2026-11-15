import { computed } from 'vue'
import { error, loading, success, type Status } from '@/db'
import { vehicleCatalog } from '@/shared/game/domain/vehicles/catalog'
import { arenaCatalog } from '@/shared/game/domain/arenas/catalog'
import { singleRegion } from '@/shared/game/domain/region/regions'
import { vehicleCompactor } from '@/shared/game/encoding/vehicles'
import { arenaCompactor } from '@/shared/game/encoding/arenas'
import type { VehicleSelection } from '../../shared/vehicleGrouping'
import { vehicleName } from '../../shared/vehicleName'
import { defaultVehicleStatisticsFromDay } from '../../shared/vehicleStatisticsPeriod'
import { useVehicleHistories } from '../../timeSeries/useVehicleHistories'
import { applyHistoryFilters } from '../../timeSeries/historyValues'
import { comparisonColor } from '../../timeSeriesCompare/query/palette'
import { useVehiclesMetaReady } from './readiness'
import type { SavedComparisonSource } from '../../timeSeriesCompare/query/state'
import type { VehicleThresholds } from '../../shared/types'
import type { Slot } from '../../vehicleMetricSelector/vehicleMetrics/vehicleMetrics'
import type { HistoryStep } from '../../timeSeries/period/historyStep'
import { selectionLabels } from './selectionLabels'

export function useCompareMeta(saved: SavedComparisonSource[], slot: Slot, beforeDay: string,
  { step = 'day', thresholds }: { step?: HistoryStep, thresholds?: VehicleThresholds } = {}) {
  const sources = computed(() => saved.filter(source => source.enabled).map((source, index) => {
    const region = singleRegion(source.filters.regions)
    const arenas = arenaCompactor.expandMany(source.filters.arenas, region)
    const tank = 'tank' in source.target ? vehicleCompactor.expand(source.target.tank, region) : null
    const unavailable = [arenas, tank].find(value => value?.status === 'unresolved')
      ?? [arenas, tank].find(value => value?.status === 'loading')

    let status: Status = success
    if (unavailable?.status === 'loading') status = loading
    if (unavailable?.status === 'unresolved') status = { status: error, reason: 'Не удалось восстановить источник сравнения' }

    let selection: VehicleSelection = { levels: [], types: [], nations: [] }
    let selectionDetails: string[] = []
    let name = 'Источник сравнения'
    if (tank?.status === 'ready') {
      selection = { ...selection, tankTag: tank.value }
      name = vehicleName({ tankTag: tank.value, tankLevel: null, tankType: null })
    } else if ('category' in source.target) {
      const { category } = source.target
      selection = source.target.selection
      selectionDetails = selectionLabels({
        levels: category.level === undefined ? selection.levels : [],
        types: category.type === undefined ? selection.types : [], nations: selection.nations,
      })
      name = vehicleName({ tankTag: null, tankLevel: category.level ?? null, tankType: category.type ?? null })
    }

    return {
      tag: String(index), name, selection, selectionDetails, status: status as Status, color: comparisonColor(source.color),
      filters: { ...source.filters, arenas: arenas.status === 'ready' ? arenas.value : [] },
    }
  }))

  const readySources = computed(() => sources.value.filter(source => source.status === success))
  const { states } = useVehicleHistories(readySources, { beforeDay, step, slot })

  const state = useVehiclesMetaReady(() => {
    const statuses = sources.value.flatMap((source): Status[] => [source.status, states.get(source.tag)?.status ?? loading])
    if (saved.some(source => source.enabled && 'tank' in source.target)) statuses.push(vehicleCatalog.value.status)
    if (saved.some(source => source.enabled && source.filters.arenas.length)) statuses.push(arenaCatalog.value.status)
    return statuses
  })

  const series = computed(() => sources.value.map(source => {
    let history = states.get(source.tag)?.data ?? []
    if (thresholds) history = applyHistoryFilters(history, slot, thresholds, step, defaultVehicleStatisticsFromDay)
    return { ...source, history }
  }))

  return { series, state }
}
