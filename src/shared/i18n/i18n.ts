import { queryAsync } from '@/db'
import { computed, shallowRef } from 'vue'

class Parser {

  private transitions: Map<string, string>

  constructor(po: string) {
    const translations = po.split('msgid')

    const parsed = translations
      .filter(t => t.includes('msgstr'))
      .map(t => {
        const splitted = t.split('msgstr')
        const msgid = splitted[0].trim().slice(1, -1)

        const lines = splitted[1]
          .split('\n')
          .map(l => l.trim())
          .filter(l => l.length > 0)
          .map(l => l.slice(1, -1))
          .filter(l => l.length > 0)

        const msgstr = lines.join('\n')

        return {
          msgid,
          msgstr
        }
      })

    this.transitions = new Map(parsed.map(t => [t.msgid, t.msgstr]))
  }

  public getTranslation(msg: string) {
    return this.transitions.get(msg) ?? msg
  }
}

export const arenas: Parser | null = null

const LANGUAGE = 'RU'
const languageRegionPriority = {
  'RU': ['RU', 'PT_RU', 'EU', 'NA'],
  'EN': ['EU', 'NA', 'RU'],
} as const

const parsers: { [key in 'arena']?: Parser | Promise<Parser> } = {}

function isGetText(obj: Parser | Promise<Parser>): obj is Parser {
  return obj instanceof Parser
}

export function getArenaName(tag: string) {
  const name = tag.replace('spaces/', '')
  const arenaName = shallowRef<string>(name)

  if (!parsers.arena) {
    parsers.arena = new Promise((resolve, reject) => {
      fetch(`https://raw.githubusercontent.com/IzeBerg/wot-src/${LANGUAGE}/sources/res/text/ru/lc_messages/arenas.po`)
        .then(res => res.text())
        .then(text => {
          resolve(new Parser(text))
        })
        .catch(reject)
    })

    parsers.arena
      .then(t => {
        parsers.arena = t
      })
      .catch(() => {
        parsers.arena = undefined
      })

  }

  if (isGetText(parsers.arena)) {
    arenaName.value = parsers.arena.getTranslation(name + '/name')
  } else {
    parsers.arena.then(arena => {
      arenaName.value = arena.getTranslation(name + '/name')
    })
  }

  return arenaName
}

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

const tankNames = queryAsync<{ tag: string, short: string, name: string }>(selectVehiclesLocalization)

const tankNamesMap = computed(() => new Map<string, [string, string]>(tankNames.value.data.map(t => [t.tag, [t.name, t.short]])))

function getBestLocale(tag: string, short: boolean = false) {
  const locales = tankNamesMap.value.get(tag)
  if (!locales) return null
  const result = short ? locales[1] : locales[0]
  if (result && result != '?empty?') return result
  return null
}

export function getTankName(tag: string, short: boolean = false) {
  const name = getBestLocale(tag, short)
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