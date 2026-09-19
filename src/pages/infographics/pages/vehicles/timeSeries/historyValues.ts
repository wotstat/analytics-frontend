import type { Slot } from '../shared/vehicleMetrics'
import type { VehicleHistoryPeriod, VehicleThresholds } from '../shared/types'

export function applyHistoryThresholds(rows: readonly VehicleHistoryPeriod[], slot: Slot, thresholds: VehicleThresholds) {
  return rows.map(row => {
    if ((row.battles ?? 0) > thresholds.minBattles && (row.playerCount ?? 0) > thresholds.minPlayers) return row
    return { ...row, [slot]: null }
  })
}

export function hasHistoryValues(rows: readonly VehicleHistoryPeriod[], slot: Slot) {
  return rows.some(row => row[slot] !== null && Number.isFinite(row[slot]))
}
