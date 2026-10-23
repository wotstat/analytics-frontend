import type { MetricDateField } from '../vehicleMetricSelector/utils/metricTypes'
import type { Slot } from '../vehicleMetricSelector/vehicleMetrics/vehicleMetrics'

type VehicleMetricValues = Partial<Record<Slot, number | null>>

export type VehicleStatistics = {
  rowKey: string
  tankTag: string | null
  tankLevel: number | null
  tankType: string | null
  region: string
  day: string
  isActual: boolean
} & Partial<Record<MetricDateField, string>> & Record<'battles' | 'playerCount', number> & Partial<Record<Slot, number | null>>

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
