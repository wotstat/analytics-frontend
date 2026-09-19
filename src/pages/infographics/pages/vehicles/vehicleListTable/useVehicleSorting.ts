import { ref, watch, type Ref } from 'vue'
import { vehicleTypes } from '@/shared/game/vehicles/vehicle/utils'
import type { Slot } from '../shared/vehicleMetrics'
import type { VehicleStatistics } from '../shared/types'
import type { VehicleGrouping } from '../shared/vehicleGrouping'
import { vehicleName } from '../shared/vehicleName'

export type SortKey = Slot | 'name' | 'tankLevel' | 'tankType'
type SortOrder = { key: SortKey, ascending: boolean }

const typeOrder = new Map<string, number>(vehicleTypes.map((type, index) => [type, vehicleTypes.length - index]))

function compareDescending(left: number | null, right: number | null) {
  if (left === null) return right === null ? 0 : 1
  if (right === null) return -1
  return right - left
}

export function useVehicleSorting(grouping: Ref<VehicleGrouping>, slots: Ref<Slot[]>) {
  const sortOrders = ref<SortOrder[]>([{ key: 'battles', ascending: false }])

  function compare(a: VehicleStatistics, b: VehicleStatistics) {
    for (const { key, ascending } of sortOrders.value) {
      if (key === 'name') {
        const comparison = vehicleName(a).localeCompare(vehicleName(b), 'ru')
        if (comparison) return ascending ? comparison : -comparison
        continue
      }

      const left = key === 'tankType' ? typeOrder.get(a.tankType ?? '') ?? null : a[key]
      const right = key === 'tankType' ? typeOrder.get(b.tankType ?? '') ?? null : b[key]

      // Отсутствующие значения всегда идут последними, в том числе при сортировке по возрастанию.
      if (left === null && right !== null) return 1
      if (right === null && left !== null) return -1

      const comparison = (left ?? 0) - (right ?? 0)
      if (comparison) return ascending ? comparison : -comparison
    }

    if (sortOrders.value.some(({ key }) => key !== 'name' && key !== 'tankLevel' && key !== 'tankType')) {
      const secondary = compareDescending(a.battles, b.battles) || compareDescending(a.damage, b.damage)
      if (secondary) return secondary
    }

    return a.rowKey.localeCompare(b.rowKey)
  }

  function defaultAscending(key: SortKey) {
    return key === 'name'
  }

  function sortPosition(key: SortKey) {
    return sortOrders.value.findIndex(order => order.key === key) + 1
  }

  function state(key: SortKey) {
    const position = sortPosition(key)
    return { position, ascending: sortOrders.value[position - 1]?.ascending ?? false }
  }

  function toggle(key: SortKey, multiple = false) {
    const index = sortPosition(key) - 1

    if (!multiple) {
      const ascending = sortOrders.value.length === 1 && index === 0
        ? !sortOrders.value[0].ascending : defaultAscending(key)

      sortOrders.value = [{ key, ascending }]
      return
    }

    if (index < 0) sortOrders.value.push({ key, ascending: defaultAscending(key) })
    else if (sortOrders.value[index].ascending === defaultAscending(key)) {
      sortOrders.value[index].ascending = !defaultAscending(key)
    } else sortOrders.value.splice(index, 1)
  }

  watch(grouping, value => {
    sortOrders.value = sortOrders.value.filter(({ key }) => {
      if (key === 'tankLevel') return value !== 'classes'
      if (key === 'tankType') return value !== 'levels'
      if (key === 'name') return value === 'tanks'
      return true
    })

    if (!sortOrders.value.length) sortOrders.value = [{ key: 'battles', ascending: false }]
  })

  watch(slots, visible => {
    sortOrders.value = sortOrders.value.filter(({ key }) =>
      key === 'name' || key === 'tankLevel' || key === 'tankType' || visible.includes(key))
  })

  return { compare, toggle, state }
}
