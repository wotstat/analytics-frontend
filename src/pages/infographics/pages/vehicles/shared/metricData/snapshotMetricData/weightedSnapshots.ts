import type { MetricDateField } from '../../../vehicleMetricSelector/utils/metricTypes'
import { quote } from '../../utils/sql'
import { vehicleDailyStatisticsTable, vehicleSelectionWhere, vehicleStatisticsWhere } from '../battle/filters'
import { vehicleGroupingSql } from '../utils/groupingSql'
import type { HistoryRange, MetricColumnContext, MetricHistoryContext } from '../utils/types'

const weightedExpressions = (keys: readonly string[]) => keys.map(key =>
  `sum(toFloat64(snapshots.${key}) * weights.battles) / nullIf(sum(weights.battles), 0) as ${key}`)

export function weightedSnapshotColumns({ filters, grouping, selection, beforeDay }: MetricColumnContext,
  snapshots: string, keys: readonly string[], updatedDayField: MetricDateField) {
  const daily = vehicleDailyStatisticsTable(filters, selection, true)
  const { rowKey } = vehicleGroupingSql(grouping)
  return `
    with snapshots as (${snapshots}),
    weights as (
      select ${rowKey} as rowKey, stats.tankTag,
        ${daily ? 'sum(stats.battles)' : 'count()'} as battles
      from ${daily ?? 'PlayerBattleResults'} as stats
      prewhere ${vehicleStatisticsWhere(filters, beforeDay)}${vehicleSelectionWhere(selection)}
        and stats.day = toDate(${quote(beforeDay)}) - 1
      group by rowKey, stats.tankTag
    )
    select weights.rowKey as rowKey,
      ${weightedExpressions(keys).join(',\n      ')},
      max(snapshots.${updatedDayField}) as ${updatedDayField}
    from weights
    inner join snapshots on weights.tankTag = snapshots.rowKey
    where snapshots.${updatedDayField} = (select max(${updatedDayField}) from snapshots)
    group by weights.rowKey
    order by rowKey
  `
}

export function weightedSnapshotHistory({ filters, selection, step }: MetricHistoryContext,
  range: HistoryRange, snapshots: string, keys: readonly string[]) {
  const daily = range.recent ? vehicleDailyStatisticsTable(filters, selection, true) : null
  const period = { day: 'day', week: 'toMonday(day)', month: 'toStartOfMonth(day)' }[step]
  return `
    with snapshots as (${snapshots}),
    weights as (
      select stats.tankTag, stats.day,
        ${daily ? 'sum(stats.battles)' : 'count()'} as battles
      from ${daily ?? 'PlayerBattleResults'} as stats
      prewhere ${vehicleStatisticsWhere(filters, range.until)}${vehicleSelectionWhere(selection)}${range.from === null ? '' : `
        and stats.day >= toDate(${quote(range.from)})`}
        and stats.day in (select day from snapshots)
      group by stats.tankTag, stats.day
    ),
    daily as (
      select day,
        ${weightedExpressions(keys).join(',\n        ')}
      from weights
      inner join snapshots using (tankTag, day)
      group by day
    )
    select ${period} as periodStart,
      ${keys.map(key => `argMax(${key}, day) as ${key}`).join(',\n      ')}
    from daily
    group by periodStart
    order by periodStart
  `
}
