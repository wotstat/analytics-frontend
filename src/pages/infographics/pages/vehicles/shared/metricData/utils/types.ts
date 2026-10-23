import type { CachePolicy } from '@/db/cache'
import type { VehicleFilters } from '../../../filters/types'
import type { VehicleStatistics } from '../../types'
import type { VehicleGrouping, VehicleSelection } from '../../vehicleGrouping'
import type { VehicleStatisticsPeriod } from '../../vehicleStatisticsPeriod'
import type { HistoryStep } from '../../../timeSeries/period/historyStep'
import type { VehicleHistorySplit } from '../../../timeSeries/split/historySplit'

export type MetricQuery = { sql: string, cache: CachePolicy }
export type HistoryRange = { from: string | null, until: string, cache: CachePolicy, recent: boolean }
export type MetricHistoryQuery = HistoryRange & { base: string, metric: string | null }

export type MetricTableContext = {
  filters: VehicleFilters
  grouping: VehicleGrouping
  days: VehicleStatisticsPeriod
  selection?: VehicleSelection
  beforeDay: string
}

export type MetricColumnContext = MetricTableContext & { rows: readonly VehicleStatistics[] }
export type MetricHistoryContext = {
  filters: VehicleFilters
  selection: VehicleSelection
  beforeDay: string
  step: HistoryStep
  split: VehicleHistorySplit | null
}

// Один объект на группу совместной загрузки, независимо от числа плиток и выбранных вариантов.
export type MetricData = {
  key: string
  column?: (context: MetricColumnContext) => MetricQuery | null
  history: (context: MetricHistoryContext) => MetricHistoryQuery[]
}
