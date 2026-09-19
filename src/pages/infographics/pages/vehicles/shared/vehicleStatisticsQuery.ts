import { customBattleModes } from '@/shared/game/wot'
import type { VehicleFilters } from '../filters/types'
import { availableSlots } from './vehicleMetrics'
import type { HistoryStep } from '../timeSeries/historyStep'
import type { VehicleHistorySplit } from '../timeSeries/historySplit'
import type { VehicleGrouping, VehicleSelection } from './vehicleGrouping'

function quote(value: string) {
  return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`
}

function statisticsSource(filters: VehicleFilters) {
  const needsDetails = filters.arenas.length > 0
    || filters.team !== 'any'
    || filters.platoon !== 'any'
    || filters.result !== 'any'
    || filters.battleLevel !== 'any'

  return needsDetails ? 'VehiclesStatistics' : 'VehiclesStatisticsByBattleMode'
}

function statisticsMetrics(source: ReturnType<typeof statisticsSource>) {
  const winrate = source === 'VehiclesStatisticsByBattleMode'
    ? 'sum(winCount) / nullIf(sum(participations), 0) * 100'
    : availableSlots.winrate.sql

  return Object.entries(availableSlots)
    .map(([key, slot]) => `${key === 'winrate' ? winrate : slot.sql} as ${key}`)
    .join(',\n      ')
}

export function vehicleStatisticsWhere(filters: VehicleFilters, beforeDay?: string) {
  const conditions: string[] = [`stats.day < ${beforeDay ? `toDate(${quote(beforeDay)})` : 'today()'}`]

  if (filters.regions.length) {
    conditions.push(`stats.region in (${[...filters.regions].sort().map(quote).join(', ')})`)
  }

  if (filters.battleModes.length) {
    const modes = [...new Set(filters.battleModes.map(key => customBattleModes[key].mode))].sort()
    conditions.push(`stats.battleMode in (${modes.map(quote).join(', ')})`)
    conditions.push(`(${[...filters.battleModes].sort().map(key => {
      const mode = customBattleModes[key]
      return `(stats.battleMode = ${quote(mode.mode)}${'gameplay' in mode ? ` and stats.battleGameplay = ${quote(mode.gameplay)}` : ''})`
    }).join(' or ')})`)
  }

  if (filters.arenas.length) {
    conditions.push(`(${[...filters.arenas].sort().map(arena => {
      const [tag, respawn] = arena.split(':')
      const team = respawn === '1' || respawn === '2' ? Number(respawn) : filters.team
      const arenaTag = tag.startsWith('spaces/') ? tag : `spaces/${tag}`
      return `(stats.arenaTag = ${quote(arenaTag)}${team === 'any' ? '' : ` and stats.team = ${team}`})`
    }).join(' or ')})`)
  } else if (filters.team !== 'any') {
    conditions.push(`stats.team = ${filters.team}`)
  }

  const platoons = { solo: '= 0', duo: '= 1', trio: '= 2', large: '>= 3' } as const
  if (filters.platoon !== 'any') conditions.push(`stats.squadmatesCount ${platoons[filters.platoon]}`)
  if (filters.result !== 'any') conditions.push(`stats.result = ${quote(filters.result)}`)

  const levels = {
    same: 'stats.minBattleTankLevel = stats.tankLevel and stats.maxBattleTankLevel = stats.tankLevel',
    top: 'stats.minBattleTankLevel < stats.tankLevel and stats.maxBattleTankLevel = stats.tankLevel',
    middle: 'stats.minBattleTankLevel < stats.tankLevel and stats.maxBattleTankLevel > stats.tankLevel',
    bottom: 'stats.minBattleTankLevel = stats.tankLevel and stats.maxBattleTankLevel > stats.tankLevel',
  } as const
  if (filters.battleLevel !== 'any') conditions.push(`(${levels[filters.battleLevel]})`)

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
  split: VehicleHistorySplit | null = null) {
  // Измерения разбиения есть только в подробной агрегации.
  const source = split === null ? statisticsSource(filters) : 'VehiclesStatistics'
  // Reaggregate source rows per period so averages keep their denominators and
  // player states are merged across days instead of adding daily results.
  const period = {
    day: 'stats.day',
    week: 'toMonday(stats.day)',
    month: 'toStartOfMonth(stats.day)',
  }[step]
  const splitExpression: Record<VehicleHistorySplit, string> = {
    arena: 'stats.arenaTag',
    platoon: "multiIf(stats.squadmatesCount = 0, 'solo', stats.squadmatesCount = 1, 'duo', stats.squadmatesCount = 2, 'trio', 'large')",
    result: 'toString(stats.result)',
    battleLevel: `multiIf(
        stats.minBattleTankLevel = stats.tankLevel and stats.maxBattleTankLevel = stats.tankLevel, 'same',
        stats.minBattleTankLevel < stats.tankLevel and stats.maxBattleTankLevel = stats.tankLevel, 'top',
        stats.minBattleTankLevel < stats.tankLevel and stats.maxBattleTankLevel > stats.tankLevel, 'middle',
        'bottom')`,
  }
  const splitSelect = split === null ? '' : `,\n      ${splitExpression[split]} as splitKey`
  const splitGroup = split === null ? '' : ', splitKey'

  return `
    select
      ${period} as periodStart${splitSelect},
      ${statisticsMetrics(source)}
    from ${source} as stats
    where ${vehicleStatisticsWhere(filters, beforeDay)}${selectionWhere(selection)}
    group by periodStart${splitGroup}
    order by periodStart${splitGroup}
  `
}

export function vehicleStatisticsQuery(filters: VehicleFilters, grouping: VehicleGrouping = 'tanks', selection?: VehicleSelection) {
  const source = statisticsSource(filters)
  const isTank = grouping === 'tanks'
  const withLevel = grouping === 'levels' || grouping === 'classesByLevel'
  const withType = grouping === 'classes' || grouping === 'classesByLevel'
  const dimensions = isTank ? ['stats.tankTag'] : [
    ...(withLevel ? ['stats.tankLevel'] : []),
    ...(withType ? ['stats.tankType'] : []),
  ]
  const groupBy = dimensions.join(', ')
  const where = vehicleStatisticsWhere(filters) + selectionWhere(isTank ? undefined : selection)
  const rowKey = isTank ? 'stats.tankTag' : `concat(${quote(`${grouping}:`)}, ${dimensions.map(column => `toString(${column})`).join(", ':', ")})`

  // У каждой строки один последний завершённый день после фильтрации.
  // Категории объединяем из исходных состояний за этот день, не из средних танков
  // с разными датами. В подзапросе читаются только измерения и дата.
  return `
    select
      ${rowKey} as rowKey,
      ${isTank ? 'stats.tankTag' : 'NULL'} as tankTag,
      ${isTank || withLevel ? 'any(stats.tankLevel)' : 'NULL'} as tankLevel,
      ${isTank || withType ? 'any(stats.tankType)' : 'NULL'} as tankType,
      min(stats.region) as region,
      max(stats.day) as day,
      ${statisticsMetrics(source)}
    from ${source} as stats
    where ${where}
      and (${groupBy}, stats.day) in (
        select ${groupBy}, max(stats.day)
        from ${source} as stats
        where ${where}
        group by ${groupBy}
      )
    group by ${groupBy}
    order by battles desc, rowKey
  `
}
