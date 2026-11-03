import { battleModeConditions } from '@/shared/game/domain/battleModes/battleModeFilter'
import type { VehicleFilters } from '../../../filters/types'
import type { VehicleSelection } from '../../vehicleGrouping'
import { quote } from '../../utils/sql'

export function vehicleStatisticsWhere(filters: VehicleFilters, beforeDay: string | null, dateColumn: 'day' | 'lastDay' = 'day') {
  const conditions: string[] = beforeDay === null ? [] : [`stats.${dateColumn} < toDate(${quote(beforeDay)})`]

  if (filters.regions.length) {
    conditions.push(`stats.region in (${[...filters.regions].sort().map(quote).join(', ')})`)
  }

  conditions.push(...battleModeConditions(filters.battleModes, 'stats.'))

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

export function vehicleSelectionWhere(selection?: VehicleSelection) {
  if (!selection) return ''
  const conditions: string[] = []
  if (selection.tankTag) conditions.push(`stats.tankTag = ${quote(selection.tankTag)}`)
  if (selection.levels.length) conditions.push(`stats.tankLevel in (${[...selection.levels].sort((a, b) => a - b).join(', ')})`)
  if (selection.types.length) conditions.push(`stats.tankType in (${[...selection.types].sort().map(quote).join(', ')})`)
  if (selection.nations.length) conditions.push(`splitByChar(':', stats.tankTag)[1] in (${[...selection.nations].sort().map(quote).join(', ')})`)
  return conditions.map(condition => `\n      and ${condition}`).join('')
}

export function vehicleDailyStatisticsTable(filters: VehicleFilters, selection?: VehicleSelection, byTank = false) {
  if (filters.arenas.length || filters.platoon !== 'any' || filters.result !== 'any' || filters.battleLevel !== 'any') return null
  return byTank || selection?.tankTag || selection?.nations.length
    ? 'PlayerBattleDailyStatistics'
    : 'PlayerBattleDailyStatisticsByClassLevel'
}

