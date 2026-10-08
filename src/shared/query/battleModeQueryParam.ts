import { battleModeKey, battleModeSelection, type BattleModeSelectionKey } from '@/shared/game/battleModes/battleModeSelection'
import { battleModeFamilies } from '@/shared/game/battleModes/battleModeFamilies'

export const battleModeQueryParam = {
  label: 'mode',
  default: (): BattleModeSelectionKey[] => ['random'],
  serialize: (values: BattleModeSelectionKey[]) => values.length ? [...new Set(values)].join(',') : 'all',
  deserialize: (raw: string): BattleModeSelectionKey[] => {
    if (raw === 'all') return []
    return [...new Set(raw.split(',').map(key => {
      const { targets } = battleModeSelection(key)
      if (Object.hasOwn(battleModeFamilies, key)) return key
      return battleModeKey(targets[0].mode, targets[0].gameplay)
    }))]
  }
}
