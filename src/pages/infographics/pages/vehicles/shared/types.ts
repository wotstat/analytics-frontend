import type { AggregatedSlot, BaseSlot } from './vehicleMetrics'

type VehicleMetricValues = Record<BaseSlot, number | null> & Partial<Record<AggregatedSlot, number | null>>

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
