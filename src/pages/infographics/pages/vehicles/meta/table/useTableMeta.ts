import { computed, ref } from 'vue'
import type { Status } from '@/db'
import { vehicleCatalog } from '@/shared/game/domain/vehicles/catalog'
import { arenaCatalog } from '@/shared/game/domain/arenas/catalog'
import { createVehicleNameFilter } from '@/shared/game/components/vehicles/vehicleSearch'
import { vehicleName } from '../../shared/vehicleName'
import { vehicleStatisticsQueries } from '../../shared/vehicleStatisticsQuery'
import { defaultVehicleStatisticsFromDay } from '../../shared/vehicleStatisticsPeriod'
import { useVehicleTableStatistics } from '../../vehicleListTable/useVehicleTableStatistics'
import { useVehicleSorting } from '../../vehicleListTable/useVehicleSorting'
import type { Slot } from '../../vehicleMetricSelector/vehicleMetrics'
import type { VehiclesMetaParams } from '../utils/params'
import { useVehiclesMetaReady } from '../utils/readiness'
import { selectMetaSlots } from './selectMetaSlots'

export function useTableMeta(params: VehiclesMetaParams, beforeDay: string) {
  const { table, filters } = params
  const sorting = useVehicleSorting(ref(table.grouping), ref(table.slots), ref(table.sort))
  const slots = computed(() => selectMetaSlots(table.slots, sorting.sortOrders.value))
  const querySlots = computed<Slot[]>(() => [...new Set<Slot>([
    ...slots.value,
    ...sorting.sortOrders.value.flatMap(({ key }) => {
      if (key === 'name' || key === 'tankLevel' || key === 'tankType') return []
      return [key]
    }),
  ])])

  const plan = vehicleStatisticsQueries(filters, table.grouping, table.period, undefined, beforeDay)
  const statistics = useVehicleTableStatistics(plan, querySlots, table.grouping === 'tanks' && table.onlyActual, 0)

  const state = useVehiclesMetaReady(() => {
    const statuses: Status[] = [statistics.value.status]
    if (table.grouping === 'tanks') statuses.push(vehicleCatalog.value.status)
    if (filters.arenas.length) statuses.push(arenaCatalog.value.status)
    return statuses
  })

  const rows = computed(() => {
    const match = createVehicleNameFilter(table.search)
    return statistics.value.data.filter(row => {
      if (row.day < defaultVehicleStatisticsFromDay || match(vehicleName(row)) === null) return false
      if (table.levels.size && !table.levels.has(row.tankLevel!)) return false
      if (table.types.size && ![...table.types].some(type => type === row.tankType)) return false
      if (table.nations.size && ![...table.nations].some(nation => nation === row.tankTag?.split(':')[0])) return false
      return row.battles > table.minBattles && row.playerCount > table.minPlayers
    }).sort(sorting.compare)
  })

  return { rows, state, slots, sort: sorting.sortOrders }
}
