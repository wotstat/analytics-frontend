import { DAILY_CACHE, LONG_CACHE } from '@/db/cache'
import type { MetricDateField } from '../../../vehicleMetricSelector/utils/metricTypes'
import { quote } from '../../utils/sql'
import type { MetricColumnData, MetricData } from '../utils/types'
import { vehicleHistoryRanges } from '../utils/historyRanges'
import { weightedSnapshotColumns, weightedSnapshotHistory } from './weightedSnapshots'

// Планки с датой API начинают действовать в игре через два дня.
const historyDayOffset = 2

export function snapshotMetricData<Key extends string>(key: string, tables: { history: string, latest: string },
  metrics: readonly { key: Key, column: string }[], updatedDayField: MetricDateField): Record<Key, MetricData> {
  const expressions = metrics.map(metric => `${metric.column} as ${metric.key}`)
  const keys = metrics.map(metric => metric.key)
  const columnData: MetricColumnData = {
    key,
    query: context => {
      const { filters, grouping, rows } = context
      if (!rows.length || filters.regions.length !== 1) return null
      const snapshots = `
        select
          tag as rowKey,
          ${expressions.join(',\n          ')},
          toDate(updatedAt, 'UTC') as ${updatedDayField}
        from ${tables.latest} final
        where region = ${quote(filters.regions[0])}
        order by tag
      `
      return {
        cache: LONG_CACHE,
        sql: grouping === 'tanks' ? snapshots : weightedSnapshotColumns(context, snapshots, keys, updatedDayField),
      }
    },
  }

  return Object.fromEntries(metrics.map(({ key, column }) => [key, {
    column: columnData,
    history: context => {
      const { filters, selection, step, beforeDay } = context
      if (filters.regions.length !== 1) return []

      const day = `toDate(updatedAt, 'UTC') + ${historyDayOffset}`
      const period = { day, week: `toMonday(${day})`, month: `toStartOfMonth(${day})` }[step]
      const until = new Date(`${beforeDay}T00:00:00Z`)
      if (step === 'day' && selection.tankTag) until.setUTCDate(until.getUTCDate() + 1)
      const historyUntil = until.toISOString().slice(0, 10)

      return vehicleHistoryRanges(historyUntil, step).map(range => {
        const where = `region = ${quote(filters.regions[0])}
            and updatedAt < toDateTime(${quote(range.until)}, 'UTC') - toIntervalDay(${historyDayOffset})${range.from === null ? '' : `
            and updatedAt >= toDateTime(${quote(range.from)}, 'UTC') - toIntervalDay(${historyDayOffset})`}`

        if (!selection.tankTag) {
          // Один снимок на танк и день; веса соединяются с ним уже после подсчёта боёв.
          const snapshots = `
            select tag as tankTag, ${day} as day,
              ${metrics.map(metric => `argMax(${metric.column}, tuple(updatedAt, dateTime)) as ${metric.key}`).join(',\n              ')}
            from ${tables.history}
            where ${where}
            group by tankTag, day
          `
          return { ...range, cache: DAILY_CACHE, base: weightedSnapshotHistory(context, range, snapshots, keys), metric: null }
        }

        return {
          ...range,
          // Сегодняшняя готовая планка может появиться позже; архив допускает исторический backfill.
          cache: step === 'day' && range.until === historyUntil ? LONG_CACHE : DAILY_CACHE,
          base: `
            select
              ${period} as periodStart,
              argMax(${column}, tuple(updatedAt, dateTime)) as ${key}
            from ${tables.history}
            where ${where}
              and tag = ${quote(selection.tankTag)}
            group by periodStart
            order by periodStart
          `,
          metric: null,
        }
      })
    },
  } satisfies MetricData])) as Record<Key, MetricData>
}
