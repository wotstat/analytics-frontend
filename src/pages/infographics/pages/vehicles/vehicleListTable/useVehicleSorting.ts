import { watch, type Ref } from 'vue'
import { vehicleTypes } from '@/shared/game/domain/vehicles/types'
import type { Slot } from '../vehicleMetricSelector/vehicleMetrics'
import type { VehicleStatistics } from '../shared/types'
import type { VehicleGrouping } from '../shared/vehicleGrouping'
import { vehicleName } from '../shared/vehicleName'

export type SortKey = Slot | 'name' | 'tankLevel' | 'tankType'
export type SortOrder = { key: SortKey, ascending: boolean }

const typeOrder = new Map<string, number>(vehicleTypes.map((type, index) => [type, vehicleTypes.length - index]))

function compareDescending(left: number | null, right: number | null) {
  if (left === null) return right === null ? 0 : 1
  if (right === null) return -1
  return right - left
}

export function useVehicleSorting(grouping: Ref<VehicleGrouping>, slots: Ref<Slot[]>, sortOrders: Ref<SortOrder[]>) {
  function compare(a: VehicleStatistics, b: VehicleStatistics) {
    for (const { key, ascending } of sortOrders.value) {
      if (key === 'name') {
        const comparison = vehicleName(a).localeCompare(vehicleName(b), 'ru')
        if (comparison) return ascending ? comparison : -comparison
        continue
      }

      const left = key === 'tankType' ? typeOrder.get(a.tankType ?? '') ?? null : a[key] ?? null
      const right = key === 'tankType' ? typeOrder.get(b.tankType ?? '') ?? null : b[key] ?? null

      // Отсутствующие значения всегда идут последними, в том числе при сортировке по возрастанию.
      if (left === null && right !== null) return 1
      if (right === null && left !== null) return -1

      const comparison = (left ?? 0) - (right ?? 0)
      if (comparison) return ascending ? comparison : -comparison
    }

    if (sortOrders.value.some(({ key }) => key !== 'name' && key !== 'tankLevel' && key !== 'tankType')) {
      const secondary = compareDescending(a.battles, b.battles)
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

  function toggle(key: SortKey, multiple = false) {
    const index = sortPosition(key) - 1

    if (!multiple) {
      const ascending = sortOrders.value.length === 1 && index === 0
        ? !sortOrders.value[0].ascending : defaultAscending(key)

      sortOrders.value = [{ key, ascending }]
      return
    }

    if (index < 0) {
      sortOrders.value = [...sortOrders.value, { key, ascending: defaultAscending(key) }]
      return
    }

    if (sortOrders.value[index].ascending === defaultAscending(key)) {
      sortOrders.value = sortOrders.value.map((order, position) =>
        position === index ? { key, ascending: !defaultAscending(key) } : order)
    } else sortOrders.value = sortOrders.value.filter((_, position) => position !== index)
  }

  watch([grouping, slots, sortOrders], ([group, selected, orders]) => {
    const available = orders.filter(({ key }) => {
      if (key === 'tankLevel') return group !== 'classes'
      if (key === 'tankType') return group !== 'levels'
      if (key === 'name') return group === 'tanks'
      return selected.includes(key)
    })

    let next = available
    if (!next.length && selected.length) {
      const key = selected.includes('battles') ? 'battles' : selected[0]
      next = [{ key, ascending: false }]
    }

    if (next.length === orders.length && next.every((order, index) =>
      order.key === orders[index].key && order.ascending === orders[index].ascending)) return
    sortOrders.value = next
  }, { immediate: true })

  return { compare, toggle, sortOrders }
}
