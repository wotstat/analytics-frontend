import type { MetricDateField } from '../metrics/utils/metricTypes'
import type { Slot } from '../metrics/catalog/vehicleMetrics'

type VehicleMetricValues = Partial<Record<Slot, number | null>>

export type VehicleStatisticsRow = {
  rowKey: string
  tankTag: string | null
  tankLevel: number | null
  tankType: string | null
  region: string
  day: string
  isActual: boolean
} & Partial<Record<MetricDateField, string>> & VehicleMetricValues

export type VehicleStatistics = VehicleStatisticsRow & Record<'battles' | 'playerCount', number>

export type VehicleHistoryPeriod = { periodStart: string, splitKey?: string } & VehicleMetricValues

export type VehicleHistorySeries = {
  tag: string
  history: VehicleHistoryPeriod[]
  slot?: Slot
  enabled?: boolean
}

export type VehicleThresholds = {
  minBattles: number
  minPlayers: number
}
