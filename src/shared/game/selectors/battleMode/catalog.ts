import { battleGameplayName, battleModeName, type BattleMode, type BattleGameplay } from '../../battleModes'
import type { GameVendor } from '../../wot'

export type BattleModeSelectionKey = string
export type BattleModeTarget = { mode: string, gameplay?: string }
export type ObservedBattleMode = {
  game: GameVendor
  battleMode: string
  battleGameplay: string
  lastBattle: string
}
export type BattleModeVariant = {
  key: BattleModeSelectionKey
  label: string
  archived: boolean
  group?: string
}
export type BattleModeOption = BattleModeVariant & {
  children: BattleModeVariant[]
}

type ArchiveRule = 'archived' | 'active' | {
  archived: boolean
  inactiveDays: number
  since?: string
}

// archived — статус до загрузки БД; since запрещает старым боям отменять решение об архиве.
const defaultRule: ArchiveRule = { archived: false, inactiveDays: 365 }
const softArchive: ArchiveRule = { archived: true, inactiveDays: 30, since: '2026-09-30' }
const seasonal: ArchiveRule = { archived: false, inactiveDays: 36500 }
const historical: ArchiveRule = { archived: true, inactiveDays: 30 }

const initialCatalog: Record<GameVendor, Record<string, Record<string, ArchiveRule>>> = {
  mt: {
    REGULAR: { ctf: defaultRule, domination: defaultRule, assault: defaultRule },
    COMP7: { comp7: defaultRule },
    SORTIE_2: { assault2: defaultRule, domination3: softArchive },
    VERSUS_AI: { ctf: defaultRule },
    BATTLE_ROYALE_SOLO: { ctf: defaultRule },
    FUN_RANDOM: { ctf: defaultRule, comp7: defaultRule, domination: defaultRule, assault: defaultRule },
    RANKED: { ctf: defaultRule },
    TRAINING: { ctf: defaultRule, domination: defaultRule, assault: defaultRule, assault2: defaultRule, domination3: defaultRule, bootcamp: defaultRule },
    BOB: { bob: softArchive },
    EPIC_BATTLE: { epic: defaultRule },
    EPIC_RANDOM: { ctf30x30: defaultRule },
    COSMIC_EVENT: { ctf: seasonal },
    WHITE_TIGER: { ctf: defaultRule },
    PORTAL: { ctf: defaultRule },
    HB_DEFENCE: { ctf: defaultRule },
    FORT_BATTLE_2: { ctf: defaultRule },
    GLOBAL_MAP: { assault2: defaultRule, ctf: softArchive },
    HB_OFFENCE: { ctf: defaultRule },
    MAPBOX: { ctf: softArchive },
    HISTORICAL_BATTLES: { ctf: historical },
    BATTLE_ROYALE_SQUAD: { ctf: defaultRule },
    MAPS_TRAINING: { maps_training: softArchive },
    RACES: { ctf: softArchive },
    TOURNAMENT_REGULAR: { ctf: defaultRule, domination: defaultRule, assault2: defaultRule, domination3: defaultRule },
    STORY_MODE: { ctf: defaultRule },
    EPIC_RANDOM_TRAINING: { ctf30x30: defaultRule },
    TOURNAMENT_COMP7: { comp7: defaultRule, assault2: defaultRule },
    WHITE_TIGER_2: { ctf: defaultRule },
    BATTLE_ROYALE_TRN_SOLO: { ctf: defaultRule },
    BATTLE_ROYALE_TRN_SQUAD: { ctf: defaultRule },
  },
  wot: {
    REGULAR: { ctf: defaultRule, domination: softArchive, assault: softArchive },
    COMP7: { comp7: defaultRule },
    SORTIE_2: { domination: defaultRule },
    BATTLE_ROYALE_SOLO: { ctf: defaultRule },
    FUN_RANDOM: { ctf: defaultRule },
    TRAINING: { ctf: defaultRule, domination: defaultRule, assault: defaultRule, assault2: defaultRule, comp7: softArchive },
    EPIC_BATTLE: { epic: defaultRule },
    EPIC_RANDOM: { ctf30x30: softArchive },
    COSMIC_EVENT: { ctf: historical },
    WHITE_TIGER: { ctf: defaultRule },
    RANDOM_NP2: { ctf: defaultRule },
    FORT_BATTLE_2: { ctf: defaultRule },
    GLOBAL_MAP: { ctf: defaultRule },
    MAPBOX: { ctf: softArchive },
    LAST_STAND_HARD: { ctf: defaultRule },
    BATTLE_ROYALE_SQUAD: { ctf: defaultRule },
    MAPS_TRAINING: { maps_training: defaultRule },
    GRINCH: { ctf: defaultRule },
    EVENT_BATTLES: { ctf: softArchive },
    TOURNAMENT_REGULAR: { ctf: defaultRule, domination: defaultRule, assault2: defaultRule },
    LAST_STAND: { ctf: defaultRule },
    LAST_STAND_MEDIUM: { ctf: defaultRule },
    COMP7_LIGHT: { comp7: defaultRule },
    STORY_MODE: { ctf: softArchive },
    STORY_MODE_REGULAR: { ctf: defaultRule },
    HALLOWEEN: { ctf: seasonal },
    HALLOWEEN_MEDIUM: { ctf: seasonal },
    HALLOWEEN_HARD: { ctf: seasonal },
    WINBACK: { ctf: defaultRule },
    EPIC_RANDOM_TRAINING: { ctf30x30: softArchive },
    HALLOWEEN_DEFENCE: { ctf: softArchive },
    STORY_MODE_ONBOARDING: { ctf: defaultRule },
    TRAINING_COMP7: { comp7: defaultRule },
    TOURNAMENT_COMP7: { comp7: defaultRule },
    BATTLE_ROYALE_TRN_SOLO: { ctf: softArchive },
    EVENT_BATTLES_2: { ctf: softArchive },
    BATTLE_ROYALE_TRN_SQUAD: { ctf: softArchive },
  },
}

type BattleModeFamilyItem = { mode: BattleMode, gameplay?: BattleGameplay, label?: string }
type BattleModeFamily = {
  title: string
  children: (BattleModeFamilyItem | { label: string, children: BattleModeFamilyItem[] })[]
}

const families: Record<string, BattleModeFamily> = {
  battleRoyale: {
    title: 'Стальной охотник',
    children: [
      { mode: 'BATTLE_ROYALE_SOLO', label: 'Соло' },
      { mode: 'BATTLE_ROYALE_SQUAD', label: 'Взвод' },
    ],
  },
  tournaments: {
    title: 'Турниры',
    children: [
      {
        label: 'Обычные',
        children: [
          { mode: 'TOURNAMENT_REGULAR', gameplay: 'ctf' },
          { mode: 'TOURNAMENT_REGULAR', gameplay: 'domination' },
          { mode: 'TOURNAMENT_REGULAR', gameplay: 'assault2' },
          { mode: 'TOURNAMENT_REGULAR', gameplay: 'domination3' },
        ],
      },
      {
        label: 'Натиск',
        children: [
          { mode: 'TOURNAMENT_COMP7', gameplay: 'comp7' },
          { mode: 'TOURNAMENT_COMP7', gameplay: 'assault2' },
        ],
      },
    ],
  },
  training: {
    title: 'Тренировочные',
    children: [
      {
        label: 'Обычные',
        children: [
          { mode: 'TRAINING', gameplay: 'ctf' },
          { mode: 'TRAINING', gameplay: 'domination' },
          { mode: 'TRAINING', gameplay: 'assault' },
          { mode: 'TRAINING', gameplay: 'assault2' },
          { mode: 'TRAINING', gameplay: 'domination3' },
          { mode: 'TRAINING', gameplay: 'bootcamp' },
          { mode: 'TRAINING', gameplay: 'comp7' },
          { mode: 'EPIC_RANDOM_TRAINING', label: 'Генеральное сражение' },
        ],
      },
      {
        label: 'Стальной охотник',
        children: [
          { mode: 'BATTLE_ROYALE_TRN_SOLO', label: 'Соло' },
          { mode: 'BATTLE_ROYALE_TRN_SQUAD', label: 'Взвод' },
        ],
      },
      {
        label: 'Другое',
        children: [
          { mode: 'TRAINING_COMP7', label: 'Натиск' },
        ],
      }
    ],
  },
  whiteTiger: {
    title: 'Последний Waffenträger',
    children: [
      { mode: 'WHITE_TIGER', label: 'Обычный' },
      { mode: 'WHITE_TIGER_2', label: 'Против блогеров' },
      { mode: 'EVENT_BATTLES', label: 'Обычный до 2025' },
      { mode: 'EVENT_BATTLES_2', label: 'Против блогеров до 2025' },
    ],
  },
  heroesTime: {
    title: 'Время героев',
    children: [
      { mode: 'HB_OFFENCE', label: 'Прорыв' },
      { mode: 'HB_DEFENCE', label: 'Оборона' },
    ],
  },
  halloween: {
    title: 'Вавилон: Запретная зона',
    children: [
      { mode: 'HALLOWEEN', label: 'Обычный' },
      { mode: 'HALLOWEEN_MEDIUM', label: 'Средний' },
      { mode: 'HALLOWEEN_HARD', label: 'Сложный' },
      { mode: 'HALLOWEEN_DEFENCE', label: 'Проект Вавилон' },
    ],
  },
  lastStand: {
    title: 'Последний рубеж',
    children: [
      { mode: 'LAST_STAND', label: 'Нормально' },
      { mode: 'LAST_STAND_MEDIUM', label: 'Тяжело' },
      { mode: 'LAST_STAND_HARD', label: 'Жесть' },
    ],
  },
  regular: {
    title: 'Случайный бой',
    children: [
      { mode: 'REGULAR', gameplay: 'ctf' },
      { mode: 'REGULAR', gameplay: 'domination' },
      { mode: 'REGULAR', gameplay: 'assault' },
    ],
  },
  regularNewbie: {
    title: 'Случайный бой (для новичков)',
    children: [
      { mode: 'RANDOM_NP2', label: 'Новые аккаунты' },
      { mode: 'WINBACK', label: 'Вернулись в игру' },
    ],
  },
  stories: {
    title: 'Сценарии',
    children: [
      { mode: 'STORY_MODE', label: 'Сюжетный режим' },
      { mode: 'STORY_MODE_ONBOARDING', label: 'Введение' },
      { mode: 'STORY_MODE_REGULAR', label: 'Обычный' },
    ],
  },
}

const categories: Record<GameVendor, { title: string, keys: BattleModeSelectionKey[] }[]> = {
  mt: [
    { title: 'Основные', keys: ['REGULAR', 'EPIC_RANDOM', 'COMP7', 'EPIC_BATTLE', '@battleRoyale', 'VERSUS_AI'] },
    { title: 'Клановые', keys: ['GLOBAL_MAP', 'FORT_BATTLE_2', 'SORTIE_2'] },
    { title: 'Особые', keys: ['RANKED', '@tournaments', 'MAPBOX', 'FUN_RANDOM'] },
    { title: 'События', keys: ['@whiteTiger', 'COSMIC_EVENT', 'HISTORICAL_BATTLES', 'BOB', '@heroesTime', 'PORTAL', 'RACES'] },
    { title: 'Обучение', keys: ['@training', 'MAPS_TRAINING', '@stories'] }
  ],
  wot: [
    { title: 'Основные', keys: ['@regular', 'EPIC_RANDOM', 'COMP7', 'EPIC_BATTLE', '@battleRoyale'] },
    { title: 'Клановые', keys: ['GLOBAL_MAP', 'FORT_BATTLE_2', 'SORTIE_2'] },
    { title: 'Особые', keys: ['RANKED', '@tournaments', 'MAPBOX', 'FUN_RANDOM'] },
    { title: 'События', keys: ['@whiteTiger', 'COSMIC_EVENT', 'COMP7_LIGHT', 'GRINCH', '@halloween', '@lastStand'] },
    { title: 'Обучение', keys: ['@training', 'MAPS_TRAINING', '@stories', '@regularNewbie'] }
  ],
}

function familyFor(key: string) {
  return key.startsWith('@') ? families[key.slice(1)] : undefined
}

function familyItems(family: BattleModeFamily) {
  return family.children.flatMap(child => 'children' in child ? child.children : [child])
}

export function battleModeKey(mode: string, gameplay?: string): BattleModeSelectionKey {
  return encodeURIComponent(mode) + (gameplay === undefined ? '' : `/${encodeURIComponent(gameplay)}`)
}

export function battleModeSelection(key: BattleModeSelectionKey): { title: string, targets: BattleModeTarget[] } {
  const family = familyFor(key)
  if (family) return { title: family.title, targets: familyItems(family).map(({ mode, gameplay }) => ({ mode, gameplay })) }
  const [mode, gameplay] = key.split('/').map(decodeURIComponent)
  return { title: battleModeName(mode, gameplay), targets: [{ mode, gameplay }] }
}

function covers(parent: BattleModeTarget, child: BattleModeTarget) {
  return parent.mode === child.mode && (parent.gameplay === undefined || parent.gameplay === child.gameplay)
}

export function selectionContains(parent: BattleModeSelectionKey, child: BattleModeSelectionKey) {
  const parents = battleModeSelection(parent).targets
  return battleModeSelection(child).targets.every(target => parents.some(parent => covers(parent, target)))
}

export function toggleBattleMode(selected: BattleModeSelectionKey[], key: BattleModeSelectionKey) {
  if (selected.includes(key)) return selected.filter(value => value !== key)
  // Уточнение заменяет общий выбор; общий выбор убирает дублирующие уточнения.
  return [...selected.filter(value => !selectionContains(value, key) && !selectionContains(key, value)), key]
}

function isArchived(rule: ArchiveRule, lastBattle: string | undefined, now: Date) {
  if (typeof rule === 'string') return rule === 'archived'
  if (!lastBattle) return rule.archived

  const date = lastBattle.replace(' ', 'T')
  const time = new Date(date.endsWith('Z') ? date : date + 'Z').getTime()
  if (!Number.isFinite(time)) return rule.archived
  if (rule.since && time <= new Date(rule.since).getTime()) return true
  return time < now.getTime() - rule.inactiveDays * 24 * 60 * 60 * 1000
}

export function buildBattleModeCategories(games: GameVendor[], observed: ObservedBattleMode[], showArchived: boolean, now = new Date()) {
  const modes = new Map<string, Map<string, boolean>>()

  function add(mode: string, gameplay: string, archived: boolean) {
    if (!modes.has(mode)) modes.set(mode, new Map())
    const gameplays = modes.get(mode)!
    // При нескольких играх сочетание актуально, если оно актуально хотя бы в одной.
    gameplays.set(gameplay, (gameplays.get(gameplay) ?? true) && archived)
  }

  for (const game of games) {
    const catalog = new Map(Object.entries(initialCatalog[game])
      .map(([mode, gameplays]) => [mode, new Map(Object.entries(gameplays))]))
    const lastBattles = new Map<BattleModeSelectionKey, string>()

    for (const row of observed) {
      if (row.game !== game) continue
      if (!catalog.has(row.battleMode)) catalog.set(row.battleMode, new Map())
      const gameplays = catalog.get(row.battleMode)!
      if (!gameplays.has(row.battleGameplay)) gameplays.set(row.battleGameplay, defaultRule)
      lastBattles.set(battleModeKey(row.battleMode, row.battleGameplay), row.lastBattle)
    }
    for (const [mode, gameplays] of catalog) {
      for (const [gameplay, rule] of gameplays) {
        add(mode, gameplay, isArchived(rule, lastBattles.get(battleModeKey(mode, gameplay)), now))
      }
    }
  }

  function modeOption(mode: string, label = battleModeName(mode), technical = false): BattleModeOption | undefined {
    const entries = [...modes.get(mode) ?? []]
    const visible = entries.filter(([, archived]) => showArchived || !archived)
    if (!visible.length) return
    return {
      key: battleModeKey(mode), label,
      archived: entries.every(([, archived]) => archived),
      children: visible.length > 1 ? visible.map(([gameplay, archived]) => ({
        key: battleModeKey(mode, gameplay),
        label: technical ? gameplay : battleGameplayName(gameplay, mode),
        archived,
      })) : [],
    }
  }

  const selectedCategories = new Map<string, BattleModeSelectionKey[]>()
  const seenKeys = new Set<BattleModeSelectionKey>()
  for (const game of games) {
    for (const category of categories[game]) {
      if (!selectedCategories.has(category.title)) selectedCategories.set(category.title, [])
      for (const key of category.keys) {
        if (seenKeys.has(key)) continue
        seenKeys.add(key)
        selectedCategories.get(category.title)!.push(key)
      }
    }
  }

  const classified = new Set<string>()
  const groups = [...selectedCategories].map(([title, keys]) => ({
    title,
    options: keys.flatMap(key => {
      const family = familyFor(key)
      if (!family) {
        classified.add(key)
        const option = modeOption(key)
        return option ? [option] : []
      }
      familyItems(family).forEach(child => classified.add(child.mode))
      const children = family.children.flatMap(child => {
        const items = 'children' in child ? child.children : [child]
        const group = 'children' in child ? child.label : undefined
        return items.flatMap(({ mode, gameplay, label }): BattleModeVariant[] => {
          const gameplays = modes.get(mode)
          if (!gameplays) return []
          const archived = gameplay === undefined ? [...gameplays.values()].every(Boolean) : gameplays.get(gameplay)
          if (archived === undefined || archived && !showArchived) return []
          return [{
            key: battleModeKey(mode, gameplay),
            label: label ?? (gameplay === undefined ? battleModeName(mode) : battleGameplayName(gameplay, mode)),
            archived,
            group,
          }]
        })
      })
      if (!children.length) return []
      return [{ key, label: family.title, archived: children.every(child => child.archived), children: children.length > 1 ? children : [] }]
    }),
  }))
  groups.push({
    title: 'Другое',
    options: [...modes.keys()].filter(mode => !classified.has(mode)).sort().flatMap(mode => {
      const option = modeOption(mode, mode, true)
      return option ? [option] : []
    }),
  })
  return groups.filter(group => group.options.length)
}
