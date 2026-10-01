import type { BattleModeSelectionKey } from '@/shared/game/selectors/battleMode/catalog'

export type VehicleRegion = 'RU' | 'EU' | 'NA' | 'ASIA' | 'CN'

export type VehicleFilters = {
  // Пустой список означает отсутствие ограничения, значения внутри списка объединяются через OR.
  regions: VehicleRegion[]
  battleModes: BattleModeSelectionKey[]
  // Теги карт без команды, например 05_prohorovka.
  arenas: string[]
  platoon: 'any' | 'solo' | 'duo' | 'trio' | 'large'
  result: 'any' | 'win' | 'loss' | 'draw'
  battleLevel: 'any' | 'same' | 'top' | 'middle' | 'bottom'
}

export function createVehicleFilters(): VehicleFilters {
  return {
    regions: ['RU'],
    battleModes: ['REGULAR'],
    arenas: [],
    platoon: 'any',
    result: 'any',
    battleLevel: 'any',
  }
}
