import type { MetricHistoryContext, HistoryRange, MetricHistoryQuery } from '../utils/types'
import { vehicleHistoryRanges } from '../utils/historyRanges'
import type { VehicleHistorySplit } from '../../../timeSeries/split/historySplit'
import { vehicleDailyStatisticsTable, vehicleSelectionWhere, vehicleStatisticsWhere } from './filters'
import { sampleExpressions, selectExpressions, type StatisticExpressions } from './expressions'

export function battleHistoryQueries({ filters, selection, beforeDay, step, split }: MetricHistoryContext,
  expressions: StatisticExpressions, sampleOnly: boolean): MetricHistoryQuery[] {
  const period = { day: 'stats.day', week: 'toMonday(stats.day)', month: 'toStartOfMonth(stats.day)' }[step]
  const splitExpressions: Record<VehicleHistorySplit, string> = {
    arena: 'stats.arenaTag',
    platoon: "multiIf(stats.squadmatesCount = 0, 'solo', stats.squadmatesCount = 1, 'duo', stats.squadmatesCount = 2, 'trio', 'large')",
    result: 'toString(stats.result)',
    battleLevel: 'toString(stats.battleLevel)',
  }
  const splitSelect = split === null ? '' : `,\n      ${splitExpressions[split]} as splitKey`
  const splitGroup = split === null ? '' : ', splitKey'
  const dailyTable = split === null ? vehicleDailyStatisticsTable(filters, selection) : null

  function sql(range: HistoryRange, fields: StatisticExpressions) {
    // 42 дня в витринах покрывают и начало недели в предыдущем месяце.
    // До ежедневного refresh график использует тот же срез, что и таблица.
    const daily = range.recent ? dailyTable : null
    return `
    select
      ${period} as periodStart${splitSelect},
      ${selectExpressions(fields, daily !== null).join(',\n      ')}
    from ${daily ?? 'PlayerBattleResults'} as stats
    prewhere ${vehicleStatisticsWhere(filters, range.until)}${vehicleSelectionWhere(selection)}${range.from === null ? '' : `\n      and stats.day >= toDate('${range.from}')`}
    group by periodStart${splitGroup}
    order by periodStart${splitGroup}
  `
  }

  return vehicleHistoryRanges(beforeDay, step).map(range => ({
    ...range,
    base: sql(range, sampleExpressions),
    metric: sampleOnly ? null : sql(range, expressions),
  }))
}
