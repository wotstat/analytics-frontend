import { computed } from 'vue'
import { error, loading, success, type Status } from '@/db'
import { vehicleCatalog } from '@/shared/game/domain/vehicles/catalog'
import { arenaCatalog } from '@/shared/game/domain/arenas/catalog'
import { singleRegion } from '@/shared/game/domain/regions'
import { vehicleCompactor } from '@/shared/game/encoding/vehicles'
import { arenaCompactor } from '@/shared/game/encoding/arenas'
import type { VehicleSelection } from '../../shared/vehicleGrouping'
import { vehicleName } from '../../shared/vehicleName'
import { defaultVehicleStatisticsFromDay } from '../../shared/vehicleStatisticsPeriod'
import { useVehicleHistories } from '../../timeSeries/useVehicleHistories'
import { applyHistoryFilters } from '../../timeSeries/historyValues'
import { comparisonColor } from '../../timeSeriesCompare/query/palette'
import { useVehiclesMetaReady } from '../utils/readiness'
import type { VehiclesMetaParams } from '../utils/params'
import { selectionLabels } from '../utils/labels'

export function useCompareMeta(params: VehiclesMetaParams, beforeDay: string) {
  const sources = computed(() => params.sources.filter(source => source.enabled).map((source, index) => {
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
  const { states } = useVehicleHistories(readySources, { beforeDay, step: 'day', slot: params.settings.slot })

  const state = useVehiclesMetaReady(() => {
    const statuses = sources.value.flatMap((source): Status[] => [source.status, states.get(source.tag)?.status ?? loading])
    if (params.sources.some(source => 'tank' in source.target)) statuses.push(vehicleCatalog.value.status)
    if (params.filters.arenas.length || params.sources.some(source => source.filters.arenas.length)) statuses.push(arenaCatalog.value.status)
    return statuses
  })

  const series = computed(() => sources.value.map(source => ({
    ...source,
    history: applyHistoryFilters(states.get(source.tag)?.data ?? [], params.settings.slot, params.table, 'day', defaultVehicleStatisticsFromDay),
  })))

  return { series, state }
}
