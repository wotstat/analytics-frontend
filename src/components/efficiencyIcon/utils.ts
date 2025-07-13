import { playerNameProcessor } from "@/composition/processors/usePlayerNameProcessor"
import { MultiSlotParamSlot } from "@/utils/defineWidget"

export const shared = [
  'battles',
  'player',
  'tank',
  'win',
] as const

export const efficiency = [
  'ammo-bay-destroyed', 'ammo-bay-destroyed-avg', 'ammo-bay-destroyed-max',
  'ammo-bay-destroyed-dmg', 'ammo-bay-destroyed-dmg-avg', 'ammo-bay-destroyed-dmg-max',
  'ammo-bay-destroyed-dmg-battle', 'ammo-bay-destroyed-dmg-battle-avg', 'ammo-bay-destroyed-dmg-battle-max',
  'assist', 'assist-avg', 'assist-max',
  'assist-radio', 'assist-radio-avg', 'assist-radio-max',
  'assist-track', 'assist-track-avg', 'assist-track-max',
  'base-capture', 'base-capture-avg', 'base-capture-max',
  'base-defend', 'base-defend-avg', 'base-defend-max',
  'block', 'block-avg', 'block-max',
  'chuck-score', 'chuck-score-avg', 'chuck-score-max',
  'crits', 'crits-avg', 'crits-max',
  'discover', 'discover-avg', 'discover-max',
  'distance', 'distance-avg', 'distance-max',
  'dmg', 'dmg-avg', 'dmg-max',
  'duration', 'duration-avg', 'duration-max',
  'fire', 'fire-avg', 'fire-max', 'fire-dmg', 'fire-dmg-avg', 'fire-dmg-max', 'fire-dmg-battle', 'fire-dmg-battle-avg', 'fire-dmg-battle-max',
  'kill', 'kill-avg', 'kill-max',
  'lifetime', 'lifetime-avg', 'lifetime-max',
  'position', 'position-avg', 'position-max',
  'ram', 'ram-avg', 'ram-max', 'ram-dmg', 'ram-dmg-avg', 'ram-dmg-max', 'ram-dmg-battle', 'ram-dmg-battle-avg', 'ram-dmg-battle-max',
  'shot-dmg', 'shot-dmg-avg', 'shot-dmg-max',
  'top1', 'top1-in-row', 'top1-in-row-max',
  'xp', 'xp-avg', 'xp-max',
  'gun-mark-dmg',
  'gun-mark-percent',
  'hp'
] as const

export const efficiencyWithMods = [
  { value: 'battles', modifications: ['battles'] },
  { value: 'win', modifications: ['win'] },
  { value: 'dmg', modifications: ['dmg', 'dmg-avg', 'dmg-max'] },
  { value: 'shot-dmg', modifications: ['shot-dmg', 'shot-dmg-avg', 'shot-dmg-max'] },
  { value: 'block', modifications: ['block', 'block-avg', 'block-max'] },
  { value: 'assist', modifications: ['assist', 'assist-avg', 'assist-max'] },
  { value: 'discover', modifications: ['discover', 'discover-avg', 'discover-max'] },
  { value: 'assist-radio', modifications: ['assist-radio', 'assist-radio-avg', 'assist-radio-max'] },
  { value: 'assist-track', modifications: ['assist-track', 'assist-track-avg', 'assist-track-max'] },
  { value: 'kill', modifications: ['kill', 'kill-avg', 'kill-max'] },
  { value: 'crits', modifications: ['crits', 'crits-avg', 'crits-max'] },
  { value: 'xp', modifications: ['xp', 'xp-avg', 'xp-max'] },
  { value: 'position', modifications: ['position-avg', 'position-max'] },
  { value: 'top1', modifications: ['top1', 'top1-in-row', 'top1-in-row-max'] },
  { value: 'fire', modifications: ['fire', 'fire-avg', 'fire-max'] },
  { value: 'fire-dmg', modifications: ['fire-dmg', 'fire-dmg-avg', 'fire-dmg-max'] },
  { value: 'fire-dmg-battle', modifications: ['fire-dmg-battle', 'fire-dmg-battle-avg', 'fire-dmg-battle-max'] },
  { value: 'ram', modifications: ['ram', 'ram-avg', 'ram-max'] },
  { value: 'ram-dmg', modifications: ['ram-dmg', 'ram-dmg-avg', 'ram-dmg-max'] },
  { value: 'ram-dmg-battle', modifications: ['ram-dmg-battle', 'ram-dmg-battle-avg', 'ram-dmg-battle-max'] },
  { value: 'ammo-bay-destroyed', modifications: ['ammo-bay-destroyed', 'ammo-bay-destroyed-avg', 'ammo-bay-destroyed-max'] },
  { value: 'ammo-bay-destroyed-dmg', modifications: ['ammo-bay-destroyed-dmg', 'ammo-bay-destroyed-dmg-avg', 'ammo-bay-destroyed-dmg-max'] },
  { value: 'ammo-bay-destroyed-dmg-battle', modifications: ['ammo-bay-destroyed-dmg-battle', 'ammo-bay-destroyed-dmg-battle-avg', 'ammo-bay-destroyed-dmg-battle-max'] },
  { value: 'chuck-score', modifications: ['chuck-score', 'chuck-score-avg', 'chuck-score-max'] },
  { value: 'distance', modifications: ['distance', 'distance-avg', 'distance-max'] },
  { value: 'duration', modifications: ['duration', 'duration-avg', 'duration-max'] },
  { value: 'lifetime', modifications: ['lifetime', 'lifetime-avg', 'lifetime-max'] },
  { value: 'base-capture', modifications: ['base-capture', 'base-capture-avg', 'base-capture-max'] },
  { value: 'base-defend', modifications: ['base-defend', 'base-defend-avg', 'base-defend-max'] },
  { value: 'gun-mark-dmg', modifications: ['gun-mark-dmg'] },
  { value: 'gun-mark-percent', modifications: ['gun-mark-percent'] },
] as const satisfies { value: IconType, modifications: IconType[] }[]


export function modificationLabel(modification: string) {
  if (modification.endsWith('-in-row-max')) return 'in-row-max'
  if (modification.endsWith('-avg')) return 'avg'
  if (modification.endsWith('-max')) return 'max'
  if (modification.endsWith('-in-row')) return 'in-row'
  return 'total'
}

export const multiSlotParamSlot = efficiencyWithMods.map(t => ({
  value: t.value,
  icon: t.value,
  label: t.value,
  modifications: t.modifications.map(t => ({
    value: t,
    icon: t,
    label: modificationLabel(t),
  }))
})) satisfies MultiSlotParamSlot[]

export type IconType = typeof efficiency[number] | typeof shared[number]
const iconTypeSet = new Set<IconType>([...efficiency, ...shared])
export function isIconType(value: string | null): value is IconType {
  if (!value) return false
  return iconTypeSet.has(value as IconType)
}

export const inBattleEfficiency = [
  'ammo-bay-destroyed',
  'ammo-bay-destroyed-dmg',
  'ammo-bay-destroyed-dmg-max',
  'assist',
  'assist-radio',
  'assist-track',
  'base-capture',
  'base-defend',
  'block',
  'crits',
  'chuck-score',
  'discover',
  'distance',
  'dmg',
  'fire',
  'fire-dmg',
  'fire-dmg-max',
  'kill',
  'ram',
  'ram-dmg',
  'ram-dmg-max',
  'shot-dmg-max',
  'shot-dmg-avg',
  'gun-mark-dmg',
  'gun-mark-percent',
  'lifetime',
  'duration',
  'hp'
] as const satisfies IconType[]


export type InBattleIconType = typeof inBattleEfficiency[number]

const rawProcessor = (value: string | number | undefined) => value?.toString() ?? ''
const spaceProcessor = (value: string | number | undefined) => Math.round(Number(value ?? 0)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
const roundProcessor = (precision = 0) => (value: string | number | undefined) => (Math.round(Number(value ?? 0) * Math.pow(10, precision)) / Math.pow(10, precision)).toFixed(precision)
const kProcessor = (value: string | number | undefined) => {
  if (value === 0) return '0'
  const num = Number(value ?? 0)
  if (num < 1e4) return roundProcessor(0)(num).toString()
  if (num < 1e5) return roundProcessor(1)(num / 1e3) + 'k'
  if (num < 1e6) return roundProcessor(0)(num / 1e3) + 'k'
  if (num < 1e7) return roundProcessor(1)(num / 1e6) + 'm'
  return Math.round(num / 1e6).toString() + 'm'
}
const kRoundProcessor = (precision = 0) => (value: string | number | undefined) => {
  if (value === 0) return '0'
  const num = Number(value ?? 0)
  if (num < 20) return roundProcessor(precision)(num).toString()
  return kProcessor(num)
}
const timeProcessor = (value: string | number | undefined) => {
  const num = Number(value ?? 0)
  const minutes = Math.floor(num / 60)
  const seconds = Math.floor(num % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

type Processor = (value: string | number | undefined) => string

const processorList = {
  'player': (value: string | number | undefined) => value ? playerNameProcessor(value.toString()) ?? '' : '',
  'tank': rawProcessor,
  'gun-mark-percent': roundProcessor(2),
  'lifetime': timeProcessor,
  'lifetime-avg': timeProcessor,
  'lifetime-max': timeProcessor,
  'duration': timeProcessor,
  'duration-avg': timeProcessor,
  'duration-max': timeProcessor,
} as const satisfies { [key in IconType]?: Processor }

const shortProcessorList = {
  'lifetime': timeProcessor,
  'lifetime-avg': timeProcessor,
  'lifetime-max': timeProcessor,
  'duration': timeProcessor,
  'duration-avg': timeProcessor,
  'duration-max': timeProcessor,
} as const satisfies { [key in IconType]?: Processor }

const ignoreAvg = new Set<IconType>(['dmg-avg', 'shot-dmg-avg'])

export function processor(icon: IconType, short = false): Processor {

  if (short) {
    const proc = icon in shortProcessorList ? shortProcessorList[icon as keyof typeof shortProcessorList] : null
    if (proc) return proc

    if (icon.endsWith('-avg') && !ignoreAvg.has(icon)) return kRoundProcessor(1)
    return kProcessor
  }

  const proc = icon in processorList ? processorList[icon as keyof typeof processorList] : null
  if (proc) return proc

  if (icon.endsWith('-avg') && !ignoreAvg.has(icon)) return roundProcessor(1)

  return spaceProcessor
}

const lessIsBetter = new Set<IconType>([
  'position',
] as const satisfies IconType[])

export function comparator(icon: IconType): (a: number, b: number) => number {
  if (lessIsBetter.has(icon)) return (a, b) => b - a
  return (a, b) => a - b
}