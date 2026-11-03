import type { VehicleFilters } from '../filters/types'
import type { VehicleSelection } from '../shared/vehicleGrouping'
import { availableSlots, type Slot } from '../vehicleMetricSelector/vehicleMetrics/vehicleMetrics'
import type { HistoryStep } from './period/historyStep'
import type { VehicleHistorySplit } from './split/historySplit'

export function vehicleHistoryQueries(filters: VehicleFilters, selection: VehicleSelection, beforeDay: string,
  step: HistoryStep, split: VehicleHistorySplit | null, slot: Slot) {
  return availableSlots[slot].data.history({ filters, selection, beforeDay, step, split })
}

export type VehicleHistoryQueries = ReturnType<typeof vehicleHistoryQueries>
