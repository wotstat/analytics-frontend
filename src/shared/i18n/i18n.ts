import { LONG_CACHE_SETTINGS, queryAsync } from '@/db'
import { computed } from 'vue'

const LOCALE = 'RU'
const localeRegionPriority = {
  'RU': ['RU', 'PT_RU', 'EU', 'NA'],
  'EN': ['EU', 'NA', 'RU'],
} as const

const localizationRegionPriority = [...localeRegionPriority[LOCALE], 'CN', 'ASIA'] as const
const localizationRegionsSql = localizationRegionPriority.map(region => `'${region}'`).join(', ')
const localizationRegionPrioritySql = `indexOf([${[...localizationRegionPriority].reverse().map(region => `'${region}'`).join(', ')}], region)`

export function countLocalize(count: number, one: string, two: string, five: string = two) {
  if (count % 10 == 1 && count % 100 != 11) return one
  if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return two
  return five
}

export const selectVehiclesLocalization = `
  select
    tag,
    argMax(shortName, ${localizationRegionPrioritySql}) as short,
    argMax(name, ${localizationRegionPrioritySql}) as name
  from VehiclesLocalizationDictionary
  where region in (${localizationRegionsSql}) and locale = '${LOCALE}'
  group by tag
`
export const selectTagVehiclesLocalization = selectVehiclesLocalization

export const selectTagArenasLocalization = `
  select
    tag,
    argMax(name, ${localizationRegionPrioritySql}) as name
  from ArenasLocalizationDictionary
  where region in (${localizationRegionsSql}) and locale = '${LOCALE}'
  group by tag
`

export const selectArtefactsLocalization = `
  select
    tag,
    argMax(name, ${localizationRegionPrioritySql}) as name
  from ArtefactsLocalizationDictionary
  where region in (${localizationRegionsSql}) and locale = '${LOCALE}'
  group by tag
`

export const selectLootboxesLocalization = `
  select
    tag,
    argMax(name, ${localizationRegionPrioritySql}) as name
  from LootboxesLocalizationDictionary
  where region in (${localizationRegionsSql}) and locale = '${LOCALE}'
  group by tag
`

export const selectCustomizationsLocalization = `
  select
    tag,
    argMax(name, ${localizationRegionPrioritySql}) as name
  from CustomizationsLocalizationDictionary
  where region in (${localizationRegionsSql}) and locale = '${LOCALE}'
  group by tag
`

const tankNames = queryAsync<{ tag: string, short: string, name: string }>(selectVehiclesLocalization, { settings: LONG_CACHE_SETTINGS })
const tankNamesMap = computed(() => new Map<string, [string, string]>(tankNames.value.data.map(t => [t.tag, [t.name, t.short]])))

const arenaNames = queryAsync<{ tag: string, name: string }>(selectTagArenasLocalization, { settings: LONG_CACHE_SETTINGS })
const arenaNamesMap = computed(() => new Map<string, string>(arenaNames.value.data.map(t => [t.tag, t.name])))

const artefactsNames = queryAsync<{ tag: string, name: string }>(selectArtefactsLocalization, { settings: LONG_CACHE_SETTINGS })
const artefactsNamesMap = computed(() => new Map<string, string>(artefactsNames.value.data.map(t => [t.tag, t.name])))

function getBestTankLocale(tag: string, short: boolean = false) {
  const locales = tankNamesMap.value.get(tag)
  if (!locales) return null
  const result = short ? locales[1] : locales[0]
  if (result && result != '?empty?') return result
  return null
}

export function getTankName(tag: string, short: boolean = false) {
  const name = getBestTankLocale(tag, short)
  if (name) return name
  return tankTagToReadable(tag)
}

export function tankTagToReadable(tag: string) {

  const idName = tag.split(':')[1]

  if (!idName) return tag

  const splitted = idName.split('_').slice(1).join(' ')

  if (splitted) return splitted

  return idName
}

export function getArenaName(tag: string) {
  tag = tag.replace('spaces/', '')
  const name = arenaNamesMap.value.get(tag)
  if (name) return name
  return tag
}

export function getArtefactName(tag: string) {
  const name = artefactsNamesMap.value.get(tag)
  if (name) return name
  return tag
}

export function crewBookName(tag: string) {
  return {
    'universalBrochure': 'Универсальная брошюра',
    'universalBook': 'Универсальное пособие',
    'personalBook': 'Персональное учебное пособие',
    'brochure': 'Учебная брошюра',
    'universalGuide': 'Универсальное руководство',
  }[tag] ?? tag
}

export function entitlementsName(tag: string) {
  return {
    'birthday2025_golden_ticket': 'Золотые билеты',
  }[tag] ?? tag
}


export type LocalizedName = string | [name: string, region: string][]

export function getBestLocalization(data: LocalizedName) {

  if (typeof data === 'string') {
    return data
  }

  const dict = data.reduce((acc, [name, region]) => {
    acc[region] = name
    return acc
  }, {} as Record<string, string>)

  for (const region of localeRegionPriority[LOCALE])
    if (dict[region]) return dict[region]

  for (const region of ['EU', 'NA', 'RU', 'CN', 'ASIA'])
    if (dict[region]) return dict[region]
}
