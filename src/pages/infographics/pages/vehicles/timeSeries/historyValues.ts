import type { Slot } from '../shared/vehicleMetrics'
import type { VehicleHistoryPeriod, VehicleThresholds } from '../shared/types'
import type { HistoryStep } from './historyStep'
import { hasServerOutageOver } from '@/shared/wotstat/serverOutages'

const INCOMPLETE_DAY_THRESHOLD_MS = 3 * 60 * 60 * 1000

export function applyHistoryFilters(rows: readonly VehicleHistoryPeriod[], slot: Slot, thresholds: VehicleThresholds,
  step: HistoryStep, skipIncompleteDays: boolean) {
  return rows.map(row => {
    const incompleteDay = skipIncompleteDays && step === 'day' && hasServerOutageOver(row.periodStart, INCOMPLETE_DAY_THRESHOLD_MS)
    if (!incompleteDay && (row.battles ?? 0) > thresholds.minBattles && (row.playerCount ?? 0) > thresholds.minPlayers) return row
    return { ...row, [slot]: null }
  })
}

export function hasHistoryValues(rows: readonly VehicleHistoryPeriod[], slot: Slot) {
  return rows.some(row => row[slot] !== null && Number.isFinite(row[slot]))
}
