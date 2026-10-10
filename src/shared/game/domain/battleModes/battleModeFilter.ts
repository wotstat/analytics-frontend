import { battleModeTargets, type BattleModeSelectionKey } from './battleModeSelection'

function quote(value: string) {
  return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`
}

export function battleModeConditions(keys: BattleModeSelectionKey[], prefix = ''): string[] {
  const targets = battleModeTargets(keys)
  if (!targets.length) return []

  const modes = [...new Set(targets.map(target => target.mode))]
  const conditions = [`${prefix}battleMode in (${modes.map(quote).join(', ')})`]
  if (!targets.some(target => target.gameplay !== undefined)) return conditions

  const gameplayConditions = targets.map(target => {
    const modeCondition = `${prefix}battleMode = ${quote(target.mode)}`
    if (target.gameplay === undefined) return `(${modeCondition})`
    return `(${modeCondition} and ${prefix}battleGameplay = ${quote(target.gameplay)})`
  })

  conditions.push(`(${gameplayConditions.join(' or ')})`)
  return conditions
}

export function battleModeColumns(keys: BattleModeSelectionKey[]): string[] {
  const targets = battleModeTargets(keys)
  if (!targets.length) return []
  if (targets.some(target => target.gameplay !== undefined)) return ['battleMode', 'battleGameplay']
  return ['battleMode']
}
