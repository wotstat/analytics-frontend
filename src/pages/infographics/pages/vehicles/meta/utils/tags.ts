import type { MetaTags } from '@/meta/utils'
import { battleModeSelection } from '@/shared/game/domain/battleModes/battleModeSelection'
import { singleRegion } from '@/shared/game/domain/regions'
import { nationNames, type Nation } from '@/shared/game/domain/vehicles/nations'
import { unpackRegionalId } from '@/shared/game/encoding/utils/regionalIdPacking'
import { resolveRegionalTag } from '@/shared/game/encoding/utils/regionalTagLookup'
import type { CompactValue } from '@/shared/game/encoding/utils/types'
import { romanNumberProcessor } from '@/shared/utils/processors/processors'
import type { VehicleSelection } from '../../shared/vehicleGrouping'
import type { SavedComparisonFilters, SavedComparisonSource } from '../../timeSeriesCompare/query/state'
import { availableSlots, type Slot } from '../../vehicleMetricSelector/vehicleMetrics/vehicleMetrics'
import { readVehiclesMetaParams, type VehiclesMetaParams } from './params'
import type { VehiclesMetaCatalog } from './catalog'

const listFormatter = new Intl.ListFormat('ru')
const list = (values: readonly string[]) => listFormatter.format(values)
const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)
const shorten = (value: string, length: number) => {
  if (value.length <= length) return value
  return value.slice(0, length - 1).trimEnd() + '…'
}

const classes: Record<string, string> = { HT: 'ТТ', MT: 'СТ', LT: 'ЛТ', AT: 'ПТ-САУ', SPG: 'САУ' }

function summarize(values: readonly string[]) {
  let count = Math.min(values.length, 3)
  while (count > 1 && list(values.slice(0, count)).length > 85) count--
  const selected = values.slice(0, count)
  const text = shorten(values.length > count ? selected.join(', ') : list(selected), 85)
  return values.length > count ? `${text} и ещё ${values.length - count}` : text
}

function selectionSubject(selection: VehicleSelection) {
  const types = selection.types.map(type => classes[type] ?? type)
  let name = types.length ? list(types) : 'техника'
  let genitive = types.length ? name : 'техники'

  if (selection.levels.length) {
    const levels = list([...selection.levels].sort((a, b) => a - b).map(romanNumberProcessor))
    const suffix = `${levels} ${selection.levels.length === 1 ? 'уровня' : 'уровней'}`
    name += ` ${suffix}`
    genitive += ` ${suffix}`
  }
  return { name, genitive }
}

function resolveTag(value: CompactValue, regions: readonly string[], index?: VehiclesMetaCatalog['vehicleTags']) {
  if (typeof value === 'string') return value
  const id = unpackRegionalId(value, singleRegion(regions))
  if (!id || !index) return
  const result = resolveRegionalTag(index, id.id, id.region)
  if (result.status === 'ready') return result.value
}

function vehicleLabel(value: CompactValue, filters: SavedComparisonFilters, catalog?: VehiclesMetaCatalog) {
  const tag = resolveTag(value, filters.regions, catalog?.vehicleTags)
  if (!tag) return
  const name = catalog?.vehicleNames.get(tag)?.trim()
  if (name && name !== '?empty?') return name
}

function filterParts(filters: SavedComparisonFilters, catalog?: VehiclesMetaCatalog) {
  return {
    regions: [...filters.regions].sort().join(' / ') || 'Все регионы',
    battleModes: list([...filters.battleModes].sort().map(mode => battleModeSelection(mode).title)) || 'Все режимы',
    arenas: list(filters.arenas.map(arena => {
      const tag = resolveTag(arena, filters.regions, catalog?.arenaTags)
      const name = tag ? catalog?.arenaNames.get(tag)?.trim() : undefined
      return name && name !== '?empty?' ? name : 'Выбранная карта'
    }).sort()) || 'Все карты',
    platoon: { any: 'Любой взвод', solo: 'Без взвода', duo: 'Взвод: 2', trio: 'Взвод: 3', large: 'Взвод: 4+' }[filters.platoon],
    result: { any: 'Все результаты', win: 'Победы', loss: 'Поражения', draw: 'Ничьи' }[filters.result],
    battleLevel: { any: 'Любой уровень боя', same: 'Одноуровневые бои', top: 'В топе', middle: 'В середине', bottom: 'Внизу списка' }[filters.battleLevel],
  }
}

function filterPresentation(filters: SavedComparisonFilters[], catalog?: VehiclesMetaCatalog) {
  const parts = filters.map(source => filterParts(source, catalog))
  const first = filters[0]
  const firstParts = parts[0]
  const common = (key: keyof SavedComparisonFilters) => parts.every(part => part[key] === firstParts[key])
  const different = (Object.keys(firstParts) as (keyof SavedComparisonFilters)[]).filter(key => !common(key))

  let mode = ''
  if (common('battleModes')) {
    if (!first.battleModes.length) mode = 'во всех режимах'
    else if (first.battleModes.length === 1 && first.battleModes[0] === 'random') mode = 'в случайных боях'
    else {
      const modeWord = first.battleModes.length === 1 ? 'режиме' : 'режимах'
      mode = `в ${modeWord} «${firstParts.battleModes}»`
    }
  }
  if (common('regions')) {
    if (!first.regions.length) mode += ' во всех регионах'
    else if (mode) mode += ` ${firstParts.regions}`
    else {
      const regionWord = first.regions.length === 1 ? 'регионе' : 'регионах'
      mode = `в ${regionWord} ${firstParts.regions}`
    }
  }

  const details: string[] = []
  if (common('arenas') && first.arenas.length) details.push(`Карты: ${firstParts.arenas}`)
  if (common('platoon') && first.platoon !== 'any') details.push(firstParts.platoon)
  if (common('result') && first.result !== 'any') details.push(firstParts.result)
  if (common('battleLevel') && first.battleLevel !== 'any') details.push(firstParts.battleLevel)
  return { context: mode.trim(), details, sources: parts.map(part => different.map(key => part[key]).join(' · ')) }
}

function tableSubject(table: VehiclesMetaParams['table']) {
  if (table.grouping === 'levels') return { name: 'уровни техники', genitive: 'уровней техники' }
  if (table.grouping === 'classes') return { name: 'типы техники', genitive: 'типов техники' }

  const subject = selectionSubject({ levels: [...table.levels], types: [...table.types], nations: [] })
  if (table.grouping !== 'classesByLevel') return subject
  if (table.types.size) return { name: `${subject.name} по уровням`, genitive: `${subject.genitive} по уровням` }
  if (table.levels.size) return { name: `типы ${subject.genitive}`, genitive: `типов ${subject.genitive}` }
  return { name: 'типы техники по уровням', genitive: 'типов техники по уровням' }
}

function tags(subject: string, description: string): MetaTags {
  return { title: `${subject} — WotStat Analytics`, description, imageAlt: subject }
}

export function vehiclesTableMetaTags(url: URL, catalog?: VehiclesMetaCatalog): MetaTags {
  const { table, filters } = readVehiclesMetaParams(url)
  const subject = tableSubject(table)

  const nations = list([...table.nations].map(nation => nationNames[nation]))
  let title = subject.name === 'техника' ? 'Статистика техники' : `${capitalize(subject.name)} — статистика`
  if (nations) title += ` · ${nations}`

  const presentation = filterPresentation([filters], catalog)
  const priority: Slot[] = ['damage', 'winrate', 'assist', 'blocked']
  const selected = [...new Set([...priority.filter(slot => table.slots.includes(slot)), ...table.slots])]
  const metrics = selected.slice(0, selected.length > 3 ? 2 : 3).map(slot => {
    if (slot === 'winrate') return 'процент побед'
    return availableSlots[slot].label.toLowerCase()
  })
  let metricSummary = list(metrics)
  if (selected.length > 3) metricSummary = `${metrics.join(', ')} и другие показатели`
  if (!selected.length) metricSummary = 'показатели по данным боёв'

  const period = table.period === 1 ? 'последний день' : `последние ${table.period} дней`
  let description = `Статистика ${subject.genitive} ${presentation.context} за ${period}: ${metricSummary}.`
  const details = [...presentation.details]
  if (nations) details.push(`Нации: ${nations}`)
  if (table.search) details.push(`Поиск: «${shorten(table.search, 60)}»`)
  if (details.length) description += ` ${details.join(' · ')}.`
  return tags(shorten(title, 120), description)
}

const metricNames: Partial<Record<Slot, { title: string, description: string }>> = {
  damage: { title: 'урона', description: 'среднего урона' },
  winrate: { title: 'процента побед', description: 'процента побед' },
  assist: { title: 'содействия', description: 'среднего содействия' },
  blocked: { title: 'заблокированного урона', description: 'заблокированного урона' },
  xp: { title: 'опыта', description: 'среднего опыта' },
  kills: { title: 'уничтожений', description: 'среднего числа уничтожений' },
  battles: { title: 'числа боёв', description: 'числа боёв' },
  playerCount: { title: 'числа игроков', description: 'числа игроков' },
  survival: { title: 'выживаемости', description: 'выживаемости' },
}

function sourceLabel(source: SavedComparisonSource, catalog?: VehiclesMetaCatalog) {
  if ('tank' in source.target) return vehicleLabel(source.target.tank, source.filters, catalog)
  const { selection } = source.target
  let label = capitalize(selectionSubject(selection).name)
  if (!selection.types.length && selection.levels.length) {
    const levels = list([...selection.levels].sort((a, b) => a - b).map(romanNumberProcessor))
    label = `${levels} ${selection.levels.length === 1 ? 'уровень' : 'уровни'}`
  }
  if (selection.nations.length) {
    const nations = selection.nations.map(nation => nationNames[nation as Nation] ?? nation)
    label += ` (${list(nations)})`
  }
  return label
}

export function vehiclesCompareMetaTags(url: URL, catalog?: VehiclesMetaCatalog): MetaTags {
  const params = readVehiclesMetaParams(url)
  const sources = params.sources.filter(source => source.enabled)
  const fallback = tags('Сравнение техники', 'Динамика показателей техники по данным боёв с марта 2024 года.')
  if (params.invalidComparison || !sources.length) return fallback

  const labels = sources.map(source => sourceLabel(source, catalog))
  if (!labels.every((label): label is string => !!label)) return fallback

  const presentation = filterPresentation(sources.map(source => source.filters), catalog)
  const names = labels.map((name, index) => {
    const details = presentation.sources[index]
    if (!details) return name
    return `${name} (${details})`
  })

  let subject = summarize(names)
  const levelsOnly = sources.every(source => 'category' in source.target && source.target.selection.levels.length === 1
    && !source.target.selection.types.length && !source.target.selection.nations.length)
  if (levelsOnly && sources.length > 1 && sources.length <= 3 && presentation.sources.every(detail => !detail)) {
    subject = `${list(labels.map(label => label.replace(/ уровень$/, '')))} уровни`
  }
  if (new Set(labels).size === 1 && presentation.sources.some(Boolean)) {
    subject = `${shorten(labels[0], 50)}: ${summarize(presentation.sources)}`
  }

  const slot = params.settings.slot
  const label = availableSlots[slot].label
  const metric = metricNames[slot] ?? {
    title: `показателя «${label}»`,
    description: `показателя «${label}»`,
  }
  const action = sources.length === 1 ? 'динамика' : 'сравнение'
  const title = `${subject} — ${action} ${metric.title}`

  let description = `Динамика ${metric.description}: ${summarize(names)}.`
  if (presentation.context) description += ` ${capitalize(presentation.context)}.`
  description += ' Данные боёв с марта 2024 года.'
  if (presentation.details.length) description += ` ${presentation.details.join(' · ')}.`
  return tags(title, description)
}
