import { battleModeKey, battleModeSelection, type BattleModeSelectionKey } from './battleModeSelection'
import { battleModeFamilies } from './battleModeFamilies'

export const battleModeQueryParam = {
  label: 'mode',
  default: (): BattleModeSelectionKey[] => ['random'],
  serialize: (values: BattleModeSelectionKey[]) => values.length ? [...new Set(values)].join(',') : 'any',
  deserialize: (raw: string): BattleModeSelectionKey[] => {
    if (raw === 'any') return []

    const keys = raw.split(',').map(key => {
      const { targets } = battleModeSelection(key)
      if (Object.hasOwn(battleModeFamilies, key)) return key
      return battleModeKey(targets[0].mode, targets[0].gameplay)
    })

    return [...new Set(keys)]
  }
}
