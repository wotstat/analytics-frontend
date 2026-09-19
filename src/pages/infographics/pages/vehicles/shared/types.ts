import type { Slot } from './vehicleMetrics'

export type VehicleStatistics = {
  rowKey: string
  tankTag: string | null
  tankLevel: number | null
  tankType: string | null
  region: string
  day: string
} & Record<Slot, number | null>

export type VehicleHistoryPeriod = { periodStart: string } & Record<Slot, number | null>

export type VehicleHistorySeries = {
  tag: string
  name: string
  color: string
  history: VehicleHistoryPeriod[]
  enabled?: boolean
}

export type VehicleThresholds = {
  minBattles: number
  minPlayers: number
}
