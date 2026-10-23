import { DAILY_CACHE, LONG_CACHE } from '@/db/cache'
import type { MetricDateField } from '../../vehicleMetricSelector/utils/metricTypes'
import { quote } from '../utils/sql'
import type { MetricColumnData, MetricData } from './utils/types'
import { vehicleHistoryRanges } from './utils/historyRanges'

// Планки с датой API начинают действовать в игре через два дня.
const historyDayOffset = 2

export function snapshotMetricData<Key extends string>(key: string, tables: { history: string, latest: string },
  metrics: readonly { key: Key, column: string }[], updatedDayField: MetricDateField): Record<Key, MetricData> {
  const expressions = metrics.map(metric => `${metric.column} as ${metric.key}`)
  const columnData: MetricColumnData = {
    key,
    query: ({ filters, grouping, rows }) => {
      if (!rows.length || filters.regions.length !== 1 || grouping !== 'tanks') return null
      return {
        cache: LONG_CACHE,
        sql: `
          select
            tag as rowKey,
            ${expressions.join(',\n            ')},
            toDate(updatedAt, 'UTC') as ${updatedDayField}
          from ${tables.latest} final
          where region = ${quote(filters.regions[0])}
          order by tag
        `,
      }
    },
  }

  return Object.fromEntries(metrics.map(({ key, column }) => [key, {
    column: columnData,
    history: ({ filters, selection, step, beforeDay }) => {
      if (filters.regions.length !== 1 || !selection.tankTag) return []

      const day = `toDate(updatedAt, 'UTC') + ${historyDayOffset}`
      const period = { day, week: `toMonday(${day})`, month: `toStartOfMonth(${day})` }[step]
      const until = new Date(`${beforeDay}T00:00:00Z`)
      if (step === 'day') until.setUTCDate(until.getUTCDate() + 1)
      const historyUntil = until.toISOString().slice(0, 10)

      return vehicleHistoryRanges(historyUntil, step).map(range => ({
        ...range,
        // Сегодняшняя готовая планка может появиться позже; архив допускает исторический backfill.
        cache: step === 'day' && range.until === historyUntil ? LONG_CACHE : DAILY_CACHE,
        base: `
          select
            ${period} as periodStart,
            argMax(${column}, tuple(updatedAt, dateTime)) as ${key}
          from ${tables.history}
          where region = ${quote(filters.regions[0])}
            and tag = ${quote(selection.tankTag!)}
            and updatedAt < toDateTime(${quote(range.until)}, 'UTC') - toIntervalDay(${historyDayOffset})${range.from === null ? '' : `
            and updatedAt >= toDateTime(${quote(range.from)}, 'UTC') - toIntervalDay(${historyDayOffset})`}
          group by periodStart
          order by periodStart
        `,
        metric: null,
      }))
    },
  } satisfies MetricData])) as Record<Key, MetricData>
}
