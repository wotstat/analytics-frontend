import type { VehicleFilters } from '../filters/types'
import type { VehicleSelection } from '../shared/vehicleGrouping'
import { vehicleDailyStatisticsTable, vehicleSelectionWhere, vehicleStatisticsWhere } from '../shared/vehicleStatisticsQuery'
import { availableSlots, metricQuerySlots, type Slot } from '../vehicleMetricSelector/vehicleMetrics'
import type { HistoryStep } from './period/historyStep'
import type { VehicleHistorySplit } from './split/historySplit'

type HistoryRange = { from: string | null, until: string, cacheTtl: number, recent: boolean }

function periodStart(day: string, step: HistoryStep) {
  const date = new Date(`${day}T00:00:00Z`)
  if (step === 'week') date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7)
  if (step === 'month') date.setUTCDate(1)
  return date.toISOString().slice(0, 10)
}

export function vehicleHistoryRanges(beforeDay: string, step: HistoryStep): HistoryRange[] {
  // Границы недель сдвигаются к понедельнику: один период всегда считается
  // целиком в БД, без объединения готовых квантилей или числа игроков в браузере.
  const year = periodStart(`${beforeDay.slice(0, 4)}-01-01`, step)
  const month = periodStart(`${beforeDay.slice(0, 7)}-01`, step)
  const until = periodStart(beforeDay, step)
  const ranges: HistoryRange[] = [{ from: null, until: year, cacheTtl: 30 * 24 * 60 * 60, recent: false }]
  if (year < month) ranges.push({ from: year, until: month, cacheTtl: 30 * 24 * 60 * 60, recent: false })
  if (month < until) ranges.push({ from: month, until, cacheTtl: 24 * 60 * 60, recent: true })
  return ranges
}

export function vehicleHistoryQueries(filters: VehicleFilters, selection: VehicleSelection, beforeDay: string,
  step: HistoryStep, split: VehicleHistorySplit | null, slot: Slot) {
  const period = { day: 'stats.day', week: 'toMonday(stats.day)', month: 'toStartOfMonth(stats.day)' }[step]
  const splitExpressions: Record<VehicleHistorySplit, string> = {
    arena: 'stats.arenaTag',
    platoon: "multiIf(stats.squadmatesCount = 0, 'solo', stats.squadmatesCount = 1, 'duo', stats.squadmatesCount = 2, 'trio', 'large')",
    result: 'toString(stats.result)',
    battleLevel: 'toString(stats.battleLevel)',
  }
  const splitSelect = split === null ? '' : `,\n      ${splitExpressions[split]} as splitKey`
  const splitGroup = split === null ? '' : ', splitKey'
  const slots = slot === 'battles' || slot === 'playerCount' ? [] : metricQuerySlots(slot)
  const dailyTable = split === null ? vehicleDailyStatisticsTable(filters, selection) : null

  function sql(range: HistoryRange, slots: readonly Slot[]) {
    // 42 дня в витринах покрывают и начало недели в предыдущем месяце.
    // До ежедневного refresh график использует тот же срез, что и таблица.
    const daily = range.recent ? dailyTable : null
    return `
    select
      ${period} as periodStart${splitSelect},
      ${slots.map(key => `${availableSlots[key][daily ? 'dailySql' : 'sql']} as ${key}`).join(',\n      ')}
    from ${daily ?? 'PlayerBattleResults'} as stats
    prewhere ${vehicleStatisticsWhere(filters, range.until)}${vehicleSelectionWhere(selection)}${range.from === null ? '' : `\n      and stats.day >= toDate('${range.from}')`}
    group by periodStart${splitGroup}
    order by periodStart${splitGroup}
  `
  }

  return vehicleHistoryRanges(beforeDay, step).map(range => ({
    ...range,
    base: sql(range, ['battles', 'playerCount']),
    metric: slots.length ? sql(range, slots) : null,
  }))
}

export type VehicleHistoryQueries = ReturnType<typeof vehicleHistoryQueries>
