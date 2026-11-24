import type { VehicleFilters } from '../filters/types'
import type { VehicleSelection } from '../shared/vehicleGrouping'
import { availableSlots, type Slot } from '../metrics/catalog/vehicleMetrics'
import type { HistoryStep } from '../../shared/history/period/historyStep'
import type { VehicleHistorySplit } from './split/historySplit'

export function vehicleHistoryQueries(filters: VehicleFilters, selection: VehicleSelection, beforeDay: string,
  step: HistoryStep, split: VehicleHistorySplit | null, slot: Slot) {
  return availableSlots[slot].data.history({ filters, selection, beforeDay, step, split })
}

export type VehicleHistoryQueries = ReturnType<typeof vehicleHistoryQueries>
