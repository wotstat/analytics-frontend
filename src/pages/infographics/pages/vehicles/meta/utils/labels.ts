import { battleModeSelection } from '@/shared/game/domain/battleModes/battleModeSelection'
import { nationNames, type Nation } from '@/shared/game/domain/vehicles/nations'
import { getArenaName } from '@/shared/i18n/i18n'
import { romanNumberProcessor } from '@/shared/utils/processors/processors'
import type { VehicleFilters } from '../../filters/types'
import type { VehicleSelection } from '../../shared/vehicleGrouping'
import type { VehiclesMetaParams } from './params'

export function filterLabels(filters: VehicleFilters) {
  const labels: string[] = []
  if (filters.arenas.length) labels.push(filters.arenas.map(getArenaName).join(', '))
  if (filters.platoon !== 'any') labels.push({ solo: 'Без взвода', duo: 'Взвод: 2', trio: 'Взвод: 3', large: 'Взвод: 4+' }[filters.platoon])
  if (filters.result !== 'any') labels.push({ win: 'Победы', loss: 'Поражения', draw: 'Ничьи' }[filters.result])
  if (filters.battleLevel !== 'any') labels.push({ same: 'Одноуровневые бои', top: 'В топе', middle: 'В середине', bottom: 'Внизу списка' }[filters.battleLevel])
  return labels
}

export const regionLabel = (filters: VehicleFilters) => filters.regions.join(' / ') || 'Все регионы'
export const modeLabel = (filters: VehicleFilters) => filters.battleModes.map(mode => battleModeSelection(mode).title).join(', ') || 'Все режимы'

export function comparisonFilterLabels(filters: VehicleFilters[]) {
  const modes = filters.map(modeLabel)
  const commonMode = modes.every(mode => mode === modes[0]) ? modes[0] ?? '' : ''
  const labels = filters.map(filterLabels)
  const commonLabels = (labels[0] ?? []).filter(label => labels.every(source => source.includes(label)))

  const regionKeys = filters.map(source => [...source.regions].sort().join(','))
  const differentRegions = regionKeys.some(key => key !== regionKeys[0])
  const regions = [...new Set(filters.flatMap(source => source.regions))]
  let region = regions.join(' / ') || 'Все регионы'
  if (filters.some(source => !source.regions.length)) region = 'Все регионы'

  const sources = filters.map((source, index) => {
    const details: string[] = []
    if (differentRegions) details.push(regionLabel(source))
    if (!commonMode) details.push(modes[index])
    details.push(...labels[index].filter(label => !commonLabels.includes(label)))
    return details.join(' · ')
  })

  return { region, mode: commonMode, labels: commonLabels, sources }
}

type SelectionLabel = { text: string, level?: boolean, types?: string[] }

function selectionLabelParts(selection: VehicleSelection) {
  const labels: SelectionLabel[] = []
  const classes: Record<string, string> = { HT: 'ТТ', MT: 'СТ', LT: 'ЛТ', AT: 'ПТ-САУ', SPG: 'САУ' }
  if (selection.levels.length) labels.push({ text: [...selection.levels].sort((a, b) => a - b).map(romanNumberProcessor).join(', '), level: true })
  if (selection.types.length) labels.push({ text: selection.types.map(type => classes[type] ?? type).join(', '), types: selection.types })
  if (selection.nations.length) labels.push({ text: selection.nations.map(nation => nationNames[nation as Nation] ?? nation).join(', ') })
  return labels
}

export const selectionLabels = (selection: VehicleSelection) => selectionLabelParts(selection).map(label => label.text)

export function tableFilterLabels(params: VehiclesMetaParams) {
  const { table, filters } = params
  const labels: SelectionLabel[] = [...filterLabels(filters).map(text => ({ text })), ...selectionLabelParts({ levels: [...table.levels], types: [...table.types], nations: [...table.nations] })]
  if (table.search) labels.push({ text: `Поиск: ${table.search}` })
  return labels
}

export const tableHeading = (params: VehiclesMetaParams) => ({
  tanks: 'СТАТИСТИКА ТЕХНИКИ', levels: 'СТАТИСТИКА УРОВНЕЙ',
  classes: 'СТАТИСТИКА ТИПОВ', classesByLevel: 'ТИПЫ ПО УРОВНЯМ',
})[params.table.grouping]

export const periodLabel = (days: number) => ({ 1: 'Последний день', 7: 'Последние 7 дней', 30: 'Последние 30 дней' })[days]
