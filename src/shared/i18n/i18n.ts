import { LONG_CACHE_SETTINGS, queryAsync } from '@/db'
import { computed } from 'vue'

const LANGUAGE = 'RU'
const languageRegionPriority = {
  'RU': ['RU', 'PT_RU', 'EU', 'NA'],
  'EN': ['EU', 'NA', 'RU'],
} as const

export function countLocalize(count: number, one: string, two: string, five: string = two) {
  if (count % 10 == 1 && count % 100 != 11) return one
  if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return two
  return five
}

const languageToPostfix = {
  'RU': 'RU',
  'EN': 'EU',
  'CN': 'CN',
}

export const selectVehiclesLocalization = `select tag, type, level, role, nation, short${languageToPostfix[LANGUAGE]} as short, name${languageToPostfix[LANGUAGE]} as name from VehiclesLocalization`
export const selectTagVehiclesLocalization = `select tag, short${languageToPostfix[LANGUAGE]} as short, name${languageToPostfix[LANGUAGE]} as name from VehiclesLocalization`
export const selectTagArenasLocalization = `select tag, name${languageToPostfix[LANGUAGE]} as name from ArenasLocalization`

const tankNames = queryAsync<{ tag: string, short: string, name: string }>(selectVehiclesLocalization, { settings: LONG_CACHE_SETTINGS })
const tankNamesMap = computed(() => new Map<string, [string, string]>(tankNames.value.data.map(t => [t.tag, [t.name, t.short]])))

const arenaNames = queryAsync<{ tag: string, name: string }>(selectTagArenasLocalization, { settings: LONG_CACHE_SETTINGS })
const arenaNamesMap = computed(() => new Map<string, string>(arenaNames.value.data.map(t => [t.tag, t.name])))

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

  for (const region of languageRegionPriority[LANGUAGE])
    if (dict[region]) return dict[region]

  for (const region of ['EU', 'NA', 'RU', 'CN', 'ASIA'])
    if (dict[region]) return dict[region]
}