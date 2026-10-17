import { baseSlot, defaultSlots, orderSlots, type Slot } from '../../vehicleMetricSelector/vehicleMetrics'
import type { SortOrder } from '../../vehicleListTable/useVehicleSorting'

const priorities = new Map(defaultSlots.map((slot, index) => [baseSlot(slot), index]))

export function selectMetaSlots(selected: readonly Slot[], sort: readonly SortOrder[]) {
  const required = sort.flatMap(({ key }) => {
    if (key === 'name' || key === 'tankLevel' || key === 'tankType') return []
    return [key]
  })

  const prioritized = orderSlots(selected).sort((left, right) =>
    (priorities.get(baseSlot(left)) ?? defaultSlots.length) - (priorities.get(baseSlot(right)) ?? defaultSlots.length))
  const slots = [...new Set([...required, ...prioritized])].slice(0, 4)
  return orderSlots(slots)
}
