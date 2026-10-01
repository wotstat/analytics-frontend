import type { PrimarySlot, Slot } from '../vehicleMetricSelector/vehicleMetrics'

type VehicleMetricValues = Record<PrimarySlot, number | null> & Partial<Record<Exclude<Slot, PrimarySlot>, number | null>>

export type VehicleStatistics = {
  rowKey: string
  tankTag: string | null
  tankLevel: number | null
  tankType: string | null
  region: string
  day: string
} & VehicleMetricValues

export type VehicleHistoryPeriod = { periodStart: string } & VehicleMetricValues

export type VehicleHistorySeries = {
  tag: string
  history: VehicleHistoryPeriod[]
  enabled?: boolean
}

export type VehicleThresholds = {
  minBattles: number
  minPlayers: number
}
