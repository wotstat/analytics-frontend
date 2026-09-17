import { customBattleModes } from '@/shared/game/wot'
import type { VehicleFilters } from './filters/types'
import { availableSlots } from './vehicleListTable/helpers'

function quote(value: string) {
  return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`
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

export function vehicleHistoryQuery(filters: VehicleFilters, tankTag: string, beforeDay: string) {
  return `
    select
      stats.day as day,
      ${Object.entries(availableSlots).map(([key, slot]) => `${slot.sql} as ${key}`).join(',\n      ')}
    from VehiclesStatistics as stats
    where ${vehicleStatisticsWhere(filters, beforeDay)}
      and stats.tankTag = ${quote(tankTag)}
    group by stats.day
    order by stats.day
  `
}

export function vehicleStatisticsQuery(filters: VehicleFilters) {
  const where = vehicleStatisticsWhere(filters)

  // Последний завершённый день ищем после фильтрации и отдельно для каждого танка.
  // IN по (tankTag, day) позволяет читать тяжёлые состояния только за нужные дни.
  return `
    select
      tankTag,
      any(stats.tankLevel) as tankLevel,
      any(stats.tankType) as tankType,
      min(stats.region) as region,
      max(stats.day) as day,
      ${Object.entries(availableSlots).map(([key, slot]) => `${slot.sql} as ${key}`).join(',\n      ')}
    from VehiclesStatistics as stats
    where ${where}
      and (stats.tankTag, stats.day) in (
        select tankTag, max(stats.day)
        from VehiclesStatistics as stats
        where ${where}
        group by tankTag
      )
    group by tankTag
    order by battles desc, tankTag
  `
}
