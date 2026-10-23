import { availableSlots, type Slot } from '../vehicleMetricSelector/vehicleMetrics/vehicleMetrics'
import type { VehicleHistoryPeriod, VehicleThresholds } from '../shared/types'
import { historyDayStart, nextHistoryPeriod, type HistoryStep } from './period/historyStep'
import { hasServerOutageOver } from '@/shared/wotstat/serverOutages'

const INCOMPLETE_DAY_THRESHOLD_MS = 3 * 60 * 60 * 1000

export function applyHistoryFilters(rows: readonly VehicleHistoryPeriod[], slot: Slot, thresholds: VehicleThresholds,
  step: HistoryStep, fromDay: string | null = null) {
  const from = fromDay === null ? null : historyDayStart(fromDay)
  const visibleRows = from === null ? rows : rows.filter(row => nextHistoryPeriod(historyDayStart(row.periodStart), step) > from)
  const history = availableSlots[slot].history
  if (!history.battleSample && !history.outages) return [...visibleRows]

  return visibleRows.map(row => {
    const incompleteDay = history.outages && step === 'day' && hasServerOutageOver(row.periodStart, INCOMPLETE_DAY_THRESHOLD_MS)
    const insufficientSample = history.battleSample && ((row.battles ?? 0) <= thresholds.minBattles || (row.playerCount ?? 0) <= thresholds.minPlayers)
    if (!incompleteDay && !insufficientSample) return row
    return { ...row, [slot]: null }
  })
}

export function hasHistoryValues(rows: readonly VehicleHistoryPeriod[], slot: Slot) {
  return rows.some(row => row[slot] !== null && Number.isFinite(row[slot]))
}
