import type { Slot } from '../vehicleMetricSelector/vehicleMetrics'

type VehicleMetricValues = Record<'battles' | 'playerCount', number> & Partial<Record<Slot, number | null>>

export type VehicleStatistics = {
  rowKey: string
  tankTag: string | null
  tankLevel: number | null
  tankType: string | null
  region: string
  day: string
  isActual: boolean
} & Record<'battles' | 'playerCount', number> & Partial<Record<Slot, number | null>>

export type VehicleHistoryPeriod = { periodStart: string, splitKey?: string } & VehicleMetricValues

export type VehicleHistorySeries = {
  tag: string
  history: VehicleHistoryPeriod[]
  enabled?: boolean
}

export type VehicleThresholds = {
  minBattles: number
  minPlayers: number
}
