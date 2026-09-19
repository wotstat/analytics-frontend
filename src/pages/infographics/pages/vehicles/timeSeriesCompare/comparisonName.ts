import { hashToArena } from '@/shared/game/selectors/arena/utils'
import { customBattleModes } from '@/shared/game/wot'
import { countLocalize, getArenaName } from '@/shared/i18n/i18n'
import { differentComparisonFilters, type ComparisonFilters, type ComparisonSource } from './types'

function arenaLabel(arenas: string[]) {
  if (!arenas.length) return 'Все карты'

  const selected = arenas.map(hashToArena)
  const tags = [...new Set(selected.map(arena => arena.tag))]
  if (tags.length > 1) return `${tags.length} ${countLocalize(tags.length, 'карта', 'карты', 'карт')}`

  const teams = [...new Set(selected.map(arena => arena.team))]
  const teamLabel = teams.includes('any') || teams.length > 1 ? '' : ` / респ ${teams[0]}`

  return `${getArenaName(tags[0])}${teamLabel}`
}

export function comparisonName(source: ComparisonSource, current: ComparisonFilters) {
  const different = differentComparisonFilters(source.filters, current)
  if (different.length > 3) return `${source.name} (выборка ${source.sampleNumber})`

  const filters = source.filters
  const labels: string[] = []

  for (const key of different) {
    switch (key) {
      case 'regions':
        break

      case 'arenas':
        labels.push(arenaLabel(filters.arenas))
        break

      case 'battleModes':
        labels.push(filters.battleModes.length
          ? filters.battleModes.map(mode => customBattleModes[mode].title).join(', ')
          : 'Все режимы')
        break

      case 'team':
        labels.push(filters.team === 'any' ? 'Любой респ' : `Респ ${filters.team}`)
        break

      case 'platoon':
        labels.push({
          any: 'Любой взвод',
          solo: 'Без взвода',
          duo: 'Взвод: 2 игрока',
          trio: 'Взвод: 3 игрока',
          large: 'Взвод: 4 и более',
        }[filters.platoon])
        break

      case 'result':
        labels.push({
          any: 'Любой результат',
          win: 'Победа',
          loss: 'Поражение',
          draw: 'Ничья',
        }[filters.result])
        break

      case 'battleLevel':
        labels.push({
          any: 'Любые уровни боя',
          same: 'Одноуровневый бой',
          top: 'В топе',
          middle: 'В середине',
          bottom: 'Внизу списка',
        }[filters.battleLevel])
        break
    }
  }

  const region = different.includes('regions') ? `[${filters.regions.join(', ') || 'Все регионы'}] ` : ''
  return [region + source.name, ...labels].join(' • ')
}
