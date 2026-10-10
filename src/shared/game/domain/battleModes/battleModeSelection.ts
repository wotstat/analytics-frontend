import { battleModeFamilies } from './battleModeFamilies'
import { battleModes, battleGameplays, battleModeName } from './battleModes'

export type BattleModeSelectionKey = string
export type BattleModeTarget = { mode: string, gameplay?: string }

export const modeSlugs = {
  REGULAR: 'random',
  COMP7: 'onslaught',
  SORTIE_2: 'skirmish',
  VERSUS_AI: 'versus-ai',
  BATTLE_ROYALE_SOLO: 'steel-hunter-solo',
  FUN_RANDOM: 'arcade',
  RANKED: 'ranked',
  TRAINING: 'training',
  BOB: 'bob',
  EPIC_BATTLE: 'frontline',
  EPIC_RANDOM: 'epic-battle',
  COSMIC_EVENT: 'cosmic-event',
  WHITE_TIGER: 'waffentrager-standard',
  PORTAL: 'portal',
  HB_DEFENCE: 'heroes-time-defence',
  RANDOM_NP2: 'random-new-account',
  FORT_BATTLE_2: 'advance',
  GLOBAL_MAP: 'global-map',
  HB_OFFENCE: 'heroes-time-offence',
  MAPBOX: 'recon-mission',
  HISTORICAL_BATTLES: 'historical-battles',
  LAST_STAND_HARD: 'last-stand-hard',
  BATTLE_ROYALE_SQUAD: 'steel-hunter-squad',
  MAPS_TRAINING: 'topography',
  GRINCH: 'winter-raid',
  RACES: 'races',
  EVENT_BATTLES: 'waffentrager-standard-2025',
  TOURNAMENT_REGULAR: 'tournament-regular',
  LAST_STAND: 'last-stand-normal',
  LAST_STAND_MEDIUM: 'last-stand-medium',
  COMP7_LIGHT: 'onslaught-light',
  STORY_MODE: 'story-newbie',
  STORY_MODE_REGULAR: 'story-regular',
  HALLOWEEN: 'babylon-normal',
  HALLOWEEN_MEDIUM: 'babylon-medium',
  HALLOWEEN_HARD: 'babylon-hard',
  WINBACK: 'random-returning',
  EPIC_RANDOM_TRAINING: 'training-epic-battle',
  HALLOWEEN_DEFENCE: 'babylon-defence',
  STORY_MODE_ONBOARDING: 'story-onboarding',
  TRAINING_COMP7: 'training-onslaught',
  TOURNAMENT_COMP7: 'tournament-onslaught',
  WHITE_TIGER_2: 'waffentrager-bloggers',
  BATTLE_ROYALE_TRN_SOLO: 'training-steel-hunter-solo',
  EVENT_BATTLES_2: 'waffentrager-bloggers-2025',
  BATTLE_ROYALE_TRN_SQUAD: 'training-steel-hunter-squad'
} as const satisfies Record<typeof battleModes[number], string>

const gameplaySlugs = {
  ctf: 'standard',
  comp7: 'onslaught',
  domination: 'domination',
  assault: 'assault',
  assault2: 'assault-2',
  bob: 'bob',
  epic: 'frontline',
  ctf30x30: 'standard-30x30',
  maps_training: 'topography',
  domination3: 'domination-3',
  bootcamp: 'bootcamp'
} satisfies Record<typeof battleGameplays[number], string>

const modes = new Map<string, string>(Object.entries(modeSlugs))
const gameplays = new Map<string, string>(Object.entries(gameplaySlugs))
const modeCodes = new Map([...modes].map(([code, slug]) => [slug, code]))
const gameplayCodes = new Map([...gameplays].map(([code, slug]) => [slug, code]))
const targets = new Map<string, BattleModeTarget>([...modes].map(([mode, slug]) => [slug, { mode }]))
const reserved = new Set([...modeCodes.keys(), ...Object.keys(battleModeFamilies)])

function technicalSlug(code: string) {
  return code.toLowerCase().replaceAll('_', '-')
}

export function battleModeKey(mode: string, gameplay?: string): BattleModeSelectionKey {
  const slug = modes.get(mode) ?? `mode-${technicalSlug(mode)}`
  if (gameplay === undefined) return slug

  const variant = gameplays.get(gameplay)
  const key = `${slug}-${variant}`

  if (modes.has(mode) && variant && !reserved.has(key)) return key
  return `${slug}-gameplay-${variant ?? `code-${technicalSlug(gameplay)}`}`
}

for (const mode of battleModes) {
  for (const gameplay of battleGameplays) targets.set(battleModeKey(mode, gameplay), { mode, gameplay })
}

function gameplayCode(slug: string) {
  const known = gameplayCodes.get(slug)
  if (known) return known
  if (slug.startsWith('code-') && slug.length > 5) return slug.slice(5).replaceAll('-', '_')
  throw new Error('Unknown gameplay')
}

function selectionTarget(key: string): BattleModeTarget {
  const known = targets.get(key)
  if (known) return { ...known }

  for (const [slug, mode] of modeCodes) {
    const prefix = `${slug}-gameplay-`
    if (!key.startsWith(prefix)) continue
    const suffix = key.slice(prefix.length)
    if (suffix) return { mode, gameplay: gameplayCode(suffix) }
  }

  if (!key.startsWith('mode-')) throw new Error('Unknown battle mode')
  const [mode, gameplay, extra] = key.slice(5).split('-gameplay-')
  if (!mode || extra !== undefined || gameplay === '') throw new Error('Unknown battle mode')

  const target: BattleModeTarget = { mode: mode.replaceAll('-', '_').toUpperCase() }
  if (gameplay !== undefined) target.gameplay = gameplayCode(gameplay)
  return target
}

export function battleModeSelection(key: BattleModeSelectionKey): { title: string, targets: BattleModeTarget[] } {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key)) throw new Error('Invalid battle mode')

  if (Object.hasOwn(battleModeFamilies, key)) {
    const family = battleModeFamilies[key]
    return {
      title: family.title,
      targets: family.children.flatMap(child => 'children' in child ? child.children : [child])
        .map(({ mode, gameplay }) => ({ mode, gameplay }))
    }
  }

  const target = selectionTarget(key)
  return { title: battleModeName(target.mode, target.gameplay), targets: [target] }
}

function covers(parent: BattleModeTarget, child: BattleModeTarget) {
  return parent.mode === child.mode && (parent.gameplay === undefined || parent.gameplay === child.gameplay)
}

export function battleModeTargets(keys: BattleModeSelectionKey[]): BattleModeTarget[] {
  const selected: BattleModeTarget[] = []
  for (const target of keys.flatMap(key => battleModeSelection(key).targets)) {
    if (selected.some(parent => covers(parent, target))) continue

    for (let i = selected.length - 1; i >= 0; i--) {
      if (covers(target, selected[i])) selected.splice(i, 1)
    }
    selected.push(target)
  }

  return selected.sort((a, b) => a.mode.localeCompare(b.mode) || (a.gameplay ?? '').localeCompare(b.gameplay ?? ''))
}

export function selectionContains(parent: BattleModeSelectionKey, child: BattleModeSelectionKey) {
  const parents = battleModeSelection(parent).targets
  return battleModeSelection(child).targets.every(target => parents.some(parent => covers(parent, target)))
}

export function toggleBattleMode(selected: BattleModeSelectionKey[], key: BattleModeSelectionKey) {
  if (selected.includes(key)) return selected.filter(value => value !== key)
  return [...selected.filter(value => !selectionContains(value, key) && !selectionContains(key, value)), key]
}
