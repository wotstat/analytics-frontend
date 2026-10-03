import { battleModeSelection } from '@/shared/game/selectors/battleMode/catalog'
import type { VehicleFilters } from '../filters/types'
import { availableSlots, baseSlots, derivedSlots, type Slot } from '../vehicleMetricSelector/vehicleMetrics'
import type { HistoryStep } from '../timeSeries/period/historyStep'
import type { VehicleHistorySplit } from '../timeSeries/split/historySplit'
import type { VehicleGrouping, VehicleSelection } from './vehicleGrouping'
import type { VehicleStatisticsPeriod } from './vehicleStatisticsPeriod'

// any и TDigest зависят от порядка обработки строк. Их результат допустимо
// кешировать: запросы ограничены завершёнными днями с явной датой в SQL.
export const VEHICLE_STATISTICS_QUERY_OPTIONS = {
  settings: {
    use_query_cache: 1,
    query_cache_ttl: 24 * 60 * 60,
    query_cache_nondeterministic_function_handling: 'save',
  },
} as const

function quote(value: string) {
  return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`
}

function statisticsMetrics(slots: readonly Slot[]) {
  // Базовые и производные показатели приходят вместе; распределения — по запросу.
  // Порядок столбцов интерфейса не должен менять SQL и ключ кеша.
  return [...new Set([...Object.keys(baseSlots) as Slot[], ...Object.keys(derivedSlots) as Slot[], ...[...slots].sort()])]
    .map(key => `${availableSlots[key].sql} as ${key}`)
    .join(',\n      ')
}

export function vehicleStatisticsWhere(filters: VehicleFilters, beforeDay: string, dateColumn: 'day' | 'lastDay' = 'day') {
  const conditions: string[] = [`stats.${dateColumn} < toDate(${quote(beforeDay)})`]

  if (filters.regions.length) {
    conditions.push(`stats.region in (${[...filters.regions].sort().map(quote).join(', ')})`)
  }

  if (filters.battleModes.length) {
    const targets = filters.battleModes.flatMap(key => battleModeSelection(key).targets)
    const modes = [...new Set(targets.map(target => target.mode))].sort()
    conditions.push(`stats.battleMode in (${modes.map(quote).join(', ')})`)
    conditions.push(`(${targets.map(target => {
      return `(stats.battleMode = ${quote(target.mode)}${target.gameplay !== undefined ? ` and stats.battleGameplay = ${quote(target.gameplay)}` : ''})`
    }).join(' or ')})`)
  }

  if (filters.arenas.length) {
    const arenaTags = [...new Set(filters.arenas)].sort()
      .map(tag => quote(tag.startsWith('spaces/') ? tag : `spaces/${tag}`))
    conditions.push(`stats.arenaTag in (${arenaTags.join(', ')})`)
  }

  const platoons = { solo: '= 0', duo: '= 1', trio: '= 2', large: '>= 3' } as const
  if (filters.platoon !== 'any') conditions.push(`stats.squadmatesCount ${platoons[filters.platoon]}`)
  if (filters.result !== 'any') conditions.push(`stats.result = ${quote(filters.result)}`)

  if (filters.battleLevel !== 'any') conditions.push(`stats.battleLevel = ${quote(filters.battleLevel)}`)

  return conditions.length ? conditions.join('\n      and ') : '1'
}

function selectionWhere(selection?: VehicleSelection) {
  if (!selection) return ''
  const conditions: string[] = []
  if (selection.tankTag) conditions.push(`stats.tankTag = ${quote(selection.tankTag)}`)
  if (selection.levels.length) conditions.push(`stats.tankLevel in (${[...selection.levels].sort((a, b) => a - b).join(', ')})`)
  if (selection.types.length) conditions.push(`stats.tankType in (${[...selection.types].sort().map(quote).join(', ')})`)
  if (selection.nations.length) conditions.push(`splitByChar(':', stats.tankTag)[1] in (${[...selection.nations].sort().map(quote).join(', ')})`)
  return conditions.map(condition => `\n      and ${condition}`).join('')
}

export function vehicleHistoryQuery(filters: VehicleFilters, selection: VehicleSelection, beforeDay: string, step: HistoryStep,
  split: VehicleHistorySplit | null = null, slots: readonly Slot[] = []) {
  // Агрегируем участия сразу за весь период: игроки не складываются по дням,
  // отношения сумм сохраняют веса, квантили считаются по индивидуальным значениям.
  const period = {
    day: 'stats.day',
    week: 'toMonday(stats.day)',
    month: 'toStartOfMonth(stats.day)',
  }[step]
  const splitExpression: Record<VehicleHistorySplit, string> = {
    arena: 'stats.arenaTag',
    platoon: "multiIf(stats.squadmatesCount = 0, 'solo', stats.squadmatesCount = 1, 'duo', stats.squadmatesCount = 2, 'trio', 'large')",
    result: 'toString(stats.result)',
    battleLevel: 'toString(stats.battleLevel)',
  }
  const splitSelect = split === null ? '' : `,\n      ${splitExpression[split]} as splitKey`
  const splitGroup = split === null ? '' : ', splitKey'

  return `
    select
      ${period} as periodStart${splitSelect},
      ${statisticsMetrics(slots)}
    from PlayerBattleResults as stats
    prewhere ${vehicleStatisticsWhere(filters, beforeDay)}${selectionWhere(selection)}
    group by periodStart${splitGroup}
    order by periodStart${splitGroup}
  `
}

export function vehicleStatisticsQueries(filters: VehicleFilters, grouping: VehicleGrouping = 'tanks',
  days: VehicleStatisticsPeriod = 30, selection?: VehicleSelection, slots: readonly Slot[] = [],
  beforeDay = new Date().toISOString().slice(0, 10)) {
  const isTank = grouping === 'tanks'
  const withLevel = grouping === 'levels' || grouping === 'classesByLevel'
  const withType = grouping === 'classes' || grouping === 'classesByLevel'
  const dimensions = isTank ? ['stats.tankTag'] : [
    ...(withLevel ? ['stats.tankLevel'] : []),
    ...(withType ? ['stats.tankType'] : []),
  ]
  const groupBy = dimensions.join(', ')
  const keys = isTank ? ['tankTag'] : [
    ...(withLevel ? ['tankLevel'] : []),
    ...(withType ? ['tankType'] : []),
  ]
  const selectionFilter = selectionWhere(isTank ? undefined : selection)
  const where = vehicleStatisticsWhere(filters, beforeDay) + selectionFilter
  const latestWhere = vehicleStatisticsWhere(filters, beforeDay, 'lastDay') + selectionFilter
  const rowKey = isTank ? 'stats.tankTag' : `concat(${quote(`${grouping}:`)}, ${dimensions.map(column => `toString(${column})`).join(", ':', ")})`

  const selectPeriod = (conditions: string, isActual: boolean) => `
    select
      ${rowKey} as rowKey,
      ${isTank ? 'stats.tankTag' : 'NULL'} as tankTag,
      ${isTank || withLevel ? 'any(stats.tankLevel)' : 'NULL'} as tankLevel,
      ${isTank || withType ? 'any(stats.tankType)' : 'NULL'} as tankType,
      min(stats.region) as region,
      max(stats.day) as day,
      toBool(${isActual ? 1 : 0}) as isActual,
      ${statisticsMetrics(slots)}
    from PlayerBattleResults as stats
    prewhere ${where}
      and ${conditions}
    group by ${groupBy}
  `

  // Опорный день — самый частый среди последних дат в пределах двух дней от максимума.
  // Более свежие группы тоже актуальны; период каждой группы заканчивается её последним днём.
  // Оба запроса используют одинаковый срез, но читают непересекающиеся группы.
  const latest = `
    with
      latest as (
        select ${groupBy}, max(stats.lastDay) as latestDay
        from PlayerBattleLatestDays as stats
        prewhere ${latestWhere}
        group by ${groupBy}
      ),
      (select max(latestDay) from latest) as latestDataDay,
      (
        select latestDay from latest
        where latestDay >= latestDataDay - toIntervalDay(2)
        group by latestDay
        order by count() desc, latestDay desc
        limit 1
      ) as actualDay
  `

  return {
    actual: `${latest},
      actual as (
        select ${keys.join(', ')}, latestDay
        from latest
        where latestDay >= actualDay
      )
      ${selectPeriod(`stats.day >= actualDay - toIntervalDay(${days - 1})
      and stats.day <= latestDataDay
      and (${groupBy}, stats.day) in (
        select ${keys.join(', ')},
          arrayJoin(arrayMap(offset -> latestDay - toIntervalDay(offset), range(${days}))) as day
        from actual
      )`, true)}
      order by battles desc, rowKey
    `,
    inactive: `${latest},
      inactive as (
        select ${keys.join(', ')}, latestDay
        from latest
        where latestDay < actualDay
      )
      ${selectPeriod(`stats.day >= (select min(latestDay) from inactive) - toIntervalDay(${days - 1})
      and stats.day <= (select max(latestDay) from inactive)
      and (${groupBy}, stats.day) in (
        select ${keys.join(', ')},
          arrayJoin(arrayMap(offset -> latestDay - toIntervalDay(offset), range(${days}))) as day
        from inactive
      )`, false)}
      order by battles desc, rowKey
    `,
  }
}
