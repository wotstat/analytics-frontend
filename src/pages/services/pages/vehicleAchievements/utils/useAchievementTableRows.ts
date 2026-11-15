import { computed, ref, watch, type Ref } from 'vue'
import { createVehicleNameFilter } from '@/shared/game/components/vehicles/vehicleSearch'
import { vehicleName } from '../../vehicles/shared/vehicleName'
import type { VehicleSelection } from '../../vehicles/shared/vehicleGrouping'
import { useVehicleSorting, type SortOrder } from '../../vehicles/vehicleListTable/utils/useVehicleSorting'
import type { Slot } from '../../vehicles/vehicleMetricSelector/vehicleMetrics/vehicleMetrics'
import { achievementDelta, achievements, type AchievementKind, type AchievementDeltaSelection, type AchievementStatisticsRow } from './achievements'

type Filters = VehicleSelection & { search: string, onlyActual: boolean, deltaPeriod: AchievementDeltaSelection, sortByDelta: boolean }

export function useAchievementTableRows(kind: AchievementKind, vehicles: () => AchievementStatisticsRow[],
  sort: Ref<SortOrder[]>, filters: () => Filters) {
  const definition = achievements[kind]
  const slots = [...definition.slots].reverse()
  const settings = computed(filters)
  const sortByDelta = computed(() => settings.value.sortByDelta && settings.value.deltaPeriod !== 'none')
  const sorting = useVehicleSorting<AchievementStatisticsRow>(ref('tanks'), ref(slots), sort, (vehicle, slot) => {
    if (sortByDelta.value) return achievementDelta(vehicle, slot, settings.value.deltaPeriod)
    return vehicle[slot] ?? null
  })

  watch(sortByDelta, enabled => {
    if (!enabled || sort.value.some(({ key }) => slots.includes(key as Slot))) return
    sort.value = [{ key: definition.defaultSortSlot, ascending: false }]
  }, { immediate: true })

  const rows = computed(() => {
    const { search, levels, types, nations, onlyActual } = settings.value
    const match = createVehicleNameFilter(search)

    return vehicles().filter(vehicle => {
      if (onlyActual && !vehicle.isActual) return false
      if (match(vehicleName(vehicle)) === null) return false
      if (levels.length && !levels.some(level => level === vehicle.tankLevel)) return false
      if (types.length && !types.some(type => type === vehicle.tankType)) return false
      return !nations.length || nations.some(nation => nation === vehicle.tankTag?.split(':')[0])
    }).sort(sorting.compare)
  })

  return { rows, slots, sorting }
}
