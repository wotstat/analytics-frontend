import { LONG_CACHE } from '@/db/cache'
import type { VehicleFilters } from '../filters/types'
import type { VehicleGrouping, VehicleSelection } from './vehicleGrouping'
import type { VehicleStatisticsPeriod } from './vehicleStatisticsPeriod'
import type { VehicleStatistics } from './types'
import type { MetricColumnData } from './metricData/utils/types'
import { battleRowQueries } from './metricData/battle/tableQueries'

export const VEHICLE_STATISTICS_QUERY_OPTIONS = {
  cache: LONG_CACHE,
  proxyCache: true,
  format: 'JSONCompact',
  settings: {
    use_query_cache: 1,
    query_cache_nondeterministic_function_handling: 'save',
  },
} as const

export function vehicleStatisticsQueries(filters: VehicleFilters, grouping: VehicleGrouping = 'tanks',
  days: VehicleStatisticsPeriod = 30, selection?: VehicleSelection,
  beforeDay = new Date().toISOString().slice(0, 10)) {
  const context = { filters, grouping, days, selection, beforeDay }
  return {
    ...battleRowQueries(context),
    column: (data: MetricColumnData, rows: readonly VehicleStatistics[]) => data.query({ ...context, rows }),
  }
}

export type VehicleStatisticsQueries = ReturnType<typeof vehicleStatisticsQueries>
