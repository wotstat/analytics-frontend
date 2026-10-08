import { battleModeTargets, type BattleModeSelectionKey } from '@/shared/game/battleModes/battleModeSelection'

function quote(value: string) {
  return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`
}

export function battleModeConditions(keys: BattleModeSelectionKey[], prefix = ''): string[] {
  const targets = battleModeTargets(keys)
  if (!targets.length) return []
  const modes = [...new Set(targets.map(target => target.mode))]
  const conditions = [`${prefix}battleMode in (${modes.map(quote).join(', ')})`]
  if (targets.some(target => target.gameplay !== undefined)) {
    conditions.push(`(${targets.map(target => `(${prefix}battleMode = ${quote(target.mode)}${target.gameplay === undefined
      ? '' : ` and ${prefix}battleGameplay = ${quote(target.gameplay)}`})`).join(' or ')})`)
  }
  return conditions
}

export function battleModeColumns(keys: BattleModeSelectionKey[]): string[] {
  const targets = battleModeTargets(keys)
  if (!targets.length) return []
  return targets.some(target => target.gameplay !== undefined) ? ['battleMode', 'battleGameplay'] : ['battleMode']
}
