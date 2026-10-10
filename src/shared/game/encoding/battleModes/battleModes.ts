import type { CompactValue, Expansion } from '../utils/types'
import { battleModes, battleGameplays } from '../../domain/battleModes/battleModes'
import { modeSlugs, battleModeKey, battleModeSelection } from '../../domain/battleModes/battleModeSelection'
import { modeCodes, gameplayCodes, familyCodes, preferredPairs, type KnownBattleMode, type KnownBattleGameplay } from './battleModeCodes'

// 0..127 — короткие выборы. Общие пары начинаются после этого диапазона.
const PAIR_CODE_BASE = 128
// В компоненте пары четыре бита отведены под код геймплея.
const GAMEPLAY_BITS = 4
const GAMEPLAY_STRIDE = 2 ** GAMEPLAY_BITS
const GAMEPLAY_MASK = GAMEPLAY_STRIDE - 1
const shortCodes = new Map<string, number>()
const shortKeys = new Map<number, string>()
const modesByPairCode = new Map<number, KnownBattleMode>()
const gameplaysByCode = new Map<number, KnownBattleGameplay>()

function registerShort(key: string, code: number) {
  if (!Number.isInteger(code) || code < 0 || code >= PAIR_CODE_BASE) throw new Error('Invalid compact battle mode code')
  if (shortCodes.has(key) || shortKeys.has(code)) throw new Error('Duplicate compact battle mode code')
  shortCodes.set(key, code)
  shortKeys.set(code, key)
}

for (const mode of battleModes) {
  const { shortCode, pairCode } = modeCodes[mode]
  if (!Number.isSafeInteger(pairCode) || pairCode < 0 || modesByPairCode.has(pairCode)) throw new Error('Invalid compact mode pair code')
  modesByPairCode.set(pairCode, mode)
  registerShort(modeSlugs[mode], shortCode)
}

for (const gameplay of battleGameplays) {
  const code = gameplayCodes[gameplay]
  if (!Number.isInteger(code) || code < 0 || code >= GAMEPLAY_STRIDE || gameplaysByCode.has(code)) throw new Error('Invalid compact gameplay code')
  gameplaysByCode.set(code, gameplay)
}

for (const [family, code] of Object.entries(familyCodes)) registerShort(family, code)
for (const { mode, gameplay, code } of preferredPairs) registerShort(battleModeKey(mode, gameplay), code)

const pairs = new Map<string, number>()
for (const mode of battleModes) {
  for (const gameplay of battleGameplays) {
    pairs.set(battleModeKey(mode, gameplay), PAIR_CODE_BASE + modeCodes[mode].pairCode * GAMEPLAY_STRIDE + gameplayCodes[gameplay])
  }
}

export const battleModeCompactor = {
  compact: (key: string): CompactValue => shortCodes.get(key) ?? pairs.get(key) ?? key,
  expand: (value: CompactValue): Expansion => {
    if (typeof value === 'string') {
      try {
        battleModeSelection(value)
        return { status: 'ready', value }
      } catch {
        return { status: 'unresolved', reason: 'invalid' }
      }
    }

    if (!Number.isInteger(value) || value < 0) return { status: 'unresolved', reason: 'invalid' }

    const key = shortKeys.get(value)
    if (key !== undefined) return { status: 'ready', value: key }

    const offset = value - PAIR_CODE_BASE
    const mode = modesByPairCode.get(Math.floor(offset / GAMEPLAY_STRIDE))
    const gameplay = gameplaysByCode.get(offset & GAMEPLAY_MASK)

    if (mode !== undefined && gameplay !== undefined) return { status: 'ready', value: battleModeKey(mode, gameplay) }
    return { status: 'unresolved', reason: 'invalid' }
  },
}
