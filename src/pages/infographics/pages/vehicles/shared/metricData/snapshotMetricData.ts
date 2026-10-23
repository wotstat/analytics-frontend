import { DAILY_CACHE, LONG_CACHE } from '@/db/cache'
import type { MetricDateField } from '../../vehicleMetricSelector/utils/metricTypes'
import { quote } from '../utils/sql'
import type { MetricData } from './utils/types'
import { vehicleHistoryRanges } from './utils/historyRanges'

export function snapshotMetricData(key: string, table: string, column: string, updatedDayField: MetricDateField): MetricData {
  return {
    key,
    column: ({ filters, grouping, beforeDay, rows }) => {
      if (!rows.length || filters.regions.length !== 1 || grouping !== 'tanks') return null
      return {
        cache: LONG_CACHE,
        sql: `
          select
            tag as rowKey,
            argMax(${column}, tuple(updatedAt, dateTime)) as ${key},
            toDate(max(updatedAt), 'UTC') as ${updatedDayField}
          from ${table}
          where region = ${quote(filters.regions[0])}
            and updatedAt < toDateTime(${quote(beforeDay)}, 'UTC')
          group by tag
          order by tag
        `,
      }
    },
    history: ({ filters, selection, step, beforeDay }) => {
      if (filters.regions.length !== 1 || !selection.tankTag) return []

      const day = "toDate(updatedAt, 'UTC')"
      const period = { day, week: `toMonday(${day})`, month: `toStartOfMonth(${day})` }[step]
      return vehicleHistoryRanges(beforeDay, step).map(range => ({
        ...range,
        // В эти таблицы ещё может поступать исторический backfill из событий мода.
        cache: DAILY_CACHE,
        base: `
          select
            ${period} as periodStart,
            argMax(${column}, tuple(updatedAt, dateTime)) as ${key}
          from ${table}
          where region = ${quote(filters.regions[0])}
            and tag = ${quote(selection.tankTag!)}
            and updatedAt < toDateTime(${quote(range.until)}, 'UTC')${range.from === null ? '' : `
            and updatedAt >= toDateTime(${quote(range.from)}, 'UTC')`}
          group by periodStart
          order by periodStart
        `,
        metric: null,
      }))
    },
  }
}
